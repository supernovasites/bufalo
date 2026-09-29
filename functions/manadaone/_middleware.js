const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2,'0')).join('');
const sha = value => crypto.subtle.digest('SHA-256', encoder.encode(value)).then(hex);

const noCache = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin'
};

const fallbackHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Manada One · Búfalo Growler</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#142e32;color:#fff;font-family:Arial,sans-serif;display:grid;place-items:center;padding:24px}main{max-width:780px;padding:clamp(34px,8vw,90px);text-align:left}.eyebrow{color:#ff9b52;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase}h1{font-size:clamp(40px,6vw,72px);line-height:1.04;letter-spacing:-2px;margin:24px 0}h1 span{color:#ff9b52}p{max-width:520px;color:#d3dedd;font-size:17px;line-height:1.8}</style></head><body><main><div class="eyebrow">OBRIGADO POR PERTENCER À MANADA ONE</div><h1>Você faz parte do grupo seleto.<br><span>O mais alto nível de reconhecimento.</span></h1><p>Obrigado por pertencer ao grupo seleto de clientes da Manada One. A Búfalo Growler reconhece a sua presença, a sua confiança e cada momento compartilhado com a nossa manada.</p></main></body></html>`;

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...noCache, 'Content-Type': 'application/json; charset=utf-8', ...headers }
  });

const sessionCookie = (request, token, maxAge) =>
  `manadaone_session=${token}; Path=/manadaone; HttpOnly; SameSite=Strict${maxAge === 0 ? '; Max-Age=0' : ''}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;

const sessionToken = request =>
  request.headers.get('Cookie')?.match(/(?:^|;\s*)manadaone_session=([a-f0-9]{64})(?:;|$)/)?.[1];

async function authenticated(request, db) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const shared = cookieHeader.match(/(?:^|;\s*)admin_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  try {
    if (shared && await db.prepare('SELECT token FROM live_sessions WHERE token = ? AND expires > ?').bind(await sha(shared), Date.now()).first()) return true;
  } catch {}
  const token = cookieHeader.match(/(?:^|;\s*)manadaone_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return false;
  return !!await db.prepare('SELECT token FROM manadaone_sessions WHERE token = ? AND expires > ?').bind(token, Date.now()).first();
}
async function setting(db) {
  const row = await db.prepare('SELECT enabled FROM manadaone_settings WHERE id = 1').first();
  return { enabled: row ? !!row.enabled : true };
}

async function body(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return null;
  const raw = await request.text();
  if (raw.length > 2048) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function handler(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '');

  if (path.startsWith('/manadaone/api/')) {
    if (!env.LIVE_DB) return json({ error: 'Painel temporariamente indisponível.' }, 503);
    const db = env.LIVE_DB;
    if (path === '/manadaone/api/state' && request.method === 'GET') return json(await setting(db));
    if (path === '/manadaone/api/login' && request.method === 'POST') {
      const payload = await body(request);
      const expected = env.MANADAONE_PASSWORD || 'As285546';
      if (!payload || typeof payload.password !== 'string' || payload.password !== expected) return json({ error: 'Senha incorreta. Tente novamente.' }, 401);
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
      const expires = Date.now() + 4 * 60 * 60 * 1000;
      await db.batch([
        db.prepare('DELETE FROM manadaone_sessions WHERE expires <= ?').bind(Date.now()),
        db.prepare('INSERT INTO manadaone_sessions (token, expires) VALUES (?, ?)').bind(token, expires)
      ]);
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, token, 14400) });
    }
    if (path === '/manadaone/api/logout' && request.method === 'POST') {
      const token = sessionToken(request);
      if (token) await db.prepare('DELETE FROM manadaone_sessions WHERE token = ?').bind(token).run();
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, '', 0) });
    }
    if (path === '/manadaone/api/state' && request.method === 'POST') {
      if (!await authenticated(request, db)) return json({ error: 'Entre no painel para continuar.' }, 401);
      const payload = await body(request);
      if (!payload || typeof payload.enabled !== 'boolean') return json({ error: 'Estado inválido.' }, 400);
      await db.prepare('INSERT INTO manadaone_settings (id, enabled) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET enabled = excluded.enabled').bind(payload.enabled ? 1 : 0).run();
      return json(await setting(db));
    }
    return json({ error: 'Página não encontrada.' }, 404);
  }

  if (['/manadaone', '/manadaone/index', '/manadaone/index.html'].includes(path)) {
    if (!env.LIVE_DB) return new Response('Manada One temporariamente indisponível.', { status: 503, headers: noCache });
    if (!(await setting(env.LIVE_DB)).enabled) {
      let html = '';
      try {
        const fallback = await env.ASSETS.fetch(new Request(new URL('/manadaone/encerrada.html', url), { method: 'GET', headers: request.headers }));
        if (fallback.ok) html = await fallback.text();
      } catch {}
      if (!html.trim()) html = fallbackHtml;
      return new Response(request.method === 'HEAD' ? null : html, {
        status: 200,
        headers: { ...noCache, 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  }

  const result = await context.next();
  const headers = new Headers(result.headers);
  if (path.startsWith('/manadaone')) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    headers.set('Cache-Control', 'no-store, max-age=0');
  }
  return new Response(result.body, { status: result.status, headers });
}

export async function onRequest(context) {
  try { return await handler(context); }
  catch { return json({ error: 'Não foi possível acessar o painel agora.' }, 503); }
}