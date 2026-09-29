const noCache = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin'
};

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...noCache, 'Content-Type': 'application/json; charset=utf-8', ...headers }
  });

const sessionCookie = (request, token, maxAge) =>
  `manadaone_session=${token}; Path=/manadaone; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;

const sessionToken = request =>
  request.headers.get('Cookie')?.match(/(?:^|;\s*)manadaone_session=([a-f0-9]{64})(?:;|$)/)?.[1];

async function authenticated(request, db) {
  const token = sessionToken(request);
  if (!token) return false;
  return !!await db.prepare(
    'SELECT token FROM manadaone_sessions WHERE token = ? AND expires > ?'
  ).bind(token, Date.now()).first();
}

async function setting(db) {
  const row = await db.prepare(
    'SELECT enabled FROM manadaone_settings WHERE id = 1'
  ).first();
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

    if (path === '/manadaone/api/state' && request.method === 'GET') {
      return json(await setting(db));
    }

    if (path === '/manadaone/api/login' && request.method === 'POST') {
      const payload = await body(request);
      const expected = env.MANADAONE_PASSWORD || 'As285546';
      if (!payload || typeof payload.password !== 'string' || payload.password !== expected) {
        return json({ error: 'Senha incorreta. Tente novamente.' }, 401);
      }
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
      await db.prepare(
        'INSERT INTO manadaone_settings (id, enabled) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET enabled = excluded.enabled'
      ).bind(payload.enabled ? 1 : 0).run();
      return json(await setting(db));
    }

    return json({ error: 'Página não encontrada.' }, 404);
  }

  if (['/manadaone', '/manadaone/index', '/manadaone/index.html'].includes(path)) {
    if (!env.LIVE_DB) return new Response('Manada One temporariamente indisponível.', { status: 503, headers: noCache });
    if (!(await setting(env.LIVE_DB)).enabled) {
      const fallback = await env.ASSETS.fetch(new Request(new URL('/manadaone/encerrada.html', url), request));
      return new Response(request.method === 'HEAD' ? null : fallback.body, {
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