const encoder=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const sha=value=>crypto.subtle.digest('SHA-256',encoder.encode(value)).then(hex);
const noCache={'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{...noCache,'Content-Type':'application/json; charset=utf-8',...headers}});
const sharedToken=request=>request.headers.get('Cookie')?.match(/(?:^|;\s*)admin_session=([a-f0-9]{64})(?:;|$)/)?.[1];
async function authenticated(request,db){const token=sharedToken(request);if(!token)return false;return !!await db.prepare('SELECT token FROM live_sessions WHERE token=? AND expires>?').bind(await sha(token),Date.now()).first();}
async function setting(db){const row=await db.prepare('SELECT enabled FROM manadaone_settings WHERE id=1').first();return {enabled:row?!!row.enabled:true};}
async function body(request){if(!request.headers.get('Content-Type')?.startsWith('application/json'))return null;const raw=await request.text();if(raw.length>2048)return null;try{return JSON.parse(raw);}catch{return null;}}
async function handler(context){const {request,env}=context;const url=new URL(request.url);const path=url.pathname.replace(/\/$/,'');
if(path.startsWith('/manadaone/api/')){if(!env.LIVE_DB)return json({error:'Painel temporariamente indisponível.'},503);const db=env.LIVE_DB;
if(path==='/manadaone/api/state'&&request.method==='GET')return json(await setting(db));
if(path==='/manadaone/api/login'&&request.method==='POST')return json({error:'Acesse pelo Painel administrativo.'},401);
if(path==='/manadaone/api/logout'&&request.method==='POST')return json({ok:true});
if(path==='/manadaone/api/state'&&request.method==='POST'){if(!await authenticated(request,db))return json({error:'Entre no Painel para continuar.'},401);const payload=await body(request);if(!payload||typeof payload.enabled!=='boolean')return json({error:'Estado inválido.'},400);await db.prepare('INSERT INTO manadaone_settings (id,enabled) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET enabled=excluded.enabled').bind(payload.enabled?1:0).run();return json(await setting(db));}
return json({error:'Página não encontrada.'},404);}
if(['/manadaone','/manadaone/index','/manadaone/index.html'].includes(path)){if(!env.LIVE_DB)return new Response('Manada One temporariamente indisponível.',{status:503,headers:noCache});if(!(await setting(env.LIVE_DB)).enabled){const assetUrl=new URL('/manadaone/encerrada.html',url);const result=await env.ASSETS.fetch(new Request(assetUrl,request));return new Response(request.method==='HEAD'?null:result.body,{status:200,headers:{...noCache,'Content-Type':'text/html; charset=utf-8'}});}}
if(path.startsWith('/manadaone/admin')){if(!env.LIVE_DB||!(await authenticated(request,env.LIVE_DB)))return Response.redirect(new URL('/painel/',url),302);}
const result=await context.next();const headers=new Headers(result.headers);if(path.startsWith('/manadaone')){headers.set('X-Robots-Tag','noindex, nofollow');headers.set('Cache-Control','no-store, max-age=0');}return new Response(result.body,{status:result.status,headers});}
export async function onRequest(context){try{return await handler(context);}catch{return json({error:'Não foi possível acessar o painel agora.'},503);}}
