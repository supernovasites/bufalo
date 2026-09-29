const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const sha = value => crypto.subtle.digest('SHA-256', encoder.encode(value)).then(hex);
const noCache = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin'
};

async function authenticated(request, db) {
  const token = request.headers.get('Cookie')?.match(/(?:^|;\s*)admin_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return false;
  return Boolean(await db.prepare(
    'SELECT token FROM live_sessions WHERE token = ? AND expires > ?'
  ).bind(await sha(token), Date.now()).first());
}

export async function onRequest(context) {
  const {request, env} = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '');

  if (path.startsWith('/blog/admin')) {
    if (!env.LIVE_DB || !await authenticated(request, env.LIVE_DB)) {
      return Response.redirect(new URL('/painel/', url), 302);
    }
  }

  const result = await context.next();
  const headers = new Headers(result.headers);

  if (path.startsWith('/blog/admin')) {
    for (const [key, value] of Object.entries(noCache)) headers.set(key, value);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return new Response(result.body, {status: result.status, headers});
}
