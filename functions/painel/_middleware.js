import { campaignSchema, campaignEnabled } from '../_lib/campaigns.js';
const noCache = {'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2,'0')).join('');
const sha = value => crypto.subtle.digest('SHA-256', encoder.encode(value)).then(hex);
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {status, headers:{...noCache,'Content-Type':'application/json; charset=utf-8',...headers}});
const tokenFrom = request => request.headers.get('Cookie')?.match(/(?:^|;\s*)admin_session=([a-f0-9]{64})(?:;|$)/)?.[1];
const cookie = (request, token, maxAge) => `admin_session=${token}; Path=/; HttpOnly; SameSite=Strict${maxAge === 0 ? '; Max-Age=0' : ''}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
async function body(request) { try { const raw = await request.text(); if (raw.length > 2048) return null; return JSON.parse(raw); } catch { return null; } }
async function handler(context) {
  const {request,env} = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/,'');
  if (path.startsWith('/painel/api/')) {
    if (!env.LIVE_DB) return json({error:'Painel temporariamente indisponível.'},503);
    const db = env.LIVE_DB;
    if (path === '/painel/api/login' && request.method === 'POST') {
      const payload = await body(request);
      const expected = env.MANADAONE_PASSWORD || 'As285546';
      if (!payload || typeof payload.password !== 'string' || payload.password !== expected) return json({error:'Senha incorreta. Tente novamente.'},401);
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
      const expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await db.batch([
        db.prepare('DELETE FROM live_sessions WHERE expires <= ?').bind(Date.now()),
        db.prepare('INSERT INTO live_sessions (token, expires) VALUES (?, ?)').bind(await sha(token), expires)
      ]);
      return json({ok:true},200,{'Set-Cookie':cookie(request,token)});
    }
    if (path === '/painel/api/logout' && request.method === 'POST') {
      const token = tokenFrom(request);
      if (token) await db.prepare('DELETE FROM live_sessions WHERE token = ?').bind(await sha(token)).run();
      return json({ok:true},200,{'Set-Cookie':cookie(request,'',0)});
    }
    if (path === '/painel/api/session' && request.method === 'GET') {
      const token = tokenFrom(request);
      const active = !!token && !!await db.prepare('SELECT token FROM live_sessions WHERE token = ? AND expires > ?').bind(await sha(token),Date.now()).first();
      return json({authenticated:active});
    }
    if (path === '/painel/api/campaigns') {
      const token = tokenFrom(request);
      const active = !!token && !!await db.prepare('SELECT token FROM live_sessions WHERE token = ? AND expires > ?').bind(await sha(token),Date.now()).first();
      if (!active) return json({error:'Entre no painel para gerenciar campanhas.'},401);
      if (!['GET','POST'].includes(request.method)) return json({error:'Método não permitido.'},405,{Allow:'GET, POST'});
      if (request.method === 'POST') {
        if (request.headers.get('Origin') !== url.origin) return json({error:'Origem não permitida.'},403);
        const payload = await body(request);
        if (!payload || payload.slug !== 'cirio' || typeof payload.enabled !== 'boolean') return json({error:'Informe uma campanha e um status válidos.'},400);
        await db.prepare(campaignSchema).run();
        await db.prepare('INSERT INTO campaign_settings (slug, enabled) VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET enabled=excluded.enabled').bind(payload.slug,payload.enabled?1:0).run();
      } else {
        await db.prepare(campaignSchema).run();
      }
      return json({campaigns:[{slug:'cirio',name:'Círio',path:'/campanhas/cirio/',enabled:await campaignEnabled(db,'cirio')}]});
    }
    return json({error:'Página não encontrada.'},404);
  }
  const result = await context.next();
  const headers = new Headers(result.headers);
  if (path.startsWith('/painel')) { headers.set('X-Robots-Tag','noindex, nofollow'); headers.set('Cache-Control','no-store, max-age=0'); }
  return new Response(result.body,{status:result.status,headers});
}
export async function onRequest(context) {
  try { return await handler(context); }
  catch { return json({error:'Não foi possível acessar o painel agora.'},503); }
}
