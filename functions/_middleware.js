import {teamRouter} from './_lib/retorno-router.js';
import {identity} from './_lib/team-auth.js';
const encoder=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const sha=value=>crypto.subtle.digest('SHA-256',encoder.encode(value)).then(hex);
async function authenticated(request,db){const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)admin_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return false;return !!await db.prepare('SELECT token FROM live_sessions WHERE token=? AND expires>?').bind(await sha(token),Date.now()).first();}
export async function onRequest(context){const {request,env}=context;const url=new URL(request.url);const path=url.pathname.replace(/\/$/,'');
const routed=await teamRouter(context);if(routed)return routed;
const privatePath=/^\/(painel|live\/(admin|sorteio|mesadj)|blog\/admin|manadaone\/admin|mkt|midia)(?:\/|\.html$|$)/.test(path);
if(privatePath && request.headers.get('Cookie')?.includes('retorno_session=')){
  const user=await identity(request,env);
  if(user?.role==='C')return path.includes('/api/')?new Response(JSON.stringify({error:'Acesso restrito ao retorno de atendimentos.'}),{status:403,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}):Response.redirect(new URL('/retorno/',url),302);
}
if(path==='/painel/usuarios'||path.startsWith('/painel/usuarios/')){
 const user=await identity(request,env);if(user?.role!=='A')return Response.redirect(new URL('/painel/',url),302);
}
if(['/painel/estatisticas','/live/admin','/live/sorteio','/live/sorteio.html','/live/mesadj','/live/mesadj.html','/blog/admin','/manadaone/admin'].some(prefix=>path===prefix||path.startsWith(prefix+'/'))){if(!env.LIVE_DB||!(await authenticated(request,env.LIVE_DB)))return Response.redirect(new URL('/painel/',url),302);}const result=await context.next();if(['/assets/site-shell.js','/assets/site-shell.css','/assets/shop-assistant.js','/assets/product-search.js','/assets/product-references.json'].includes(path)){const headers=new Headers(result.headers);headers.set('Cache-Control','public, max-age=0, must-revalidate');return new Response(result.body,{status:result.status,statusText:result.statusText,headers});}if(result.ok && (result.headers.get('Content-Type') || '').includes('text/html') && !/\/(admin|painel|retorno|mkt|midia|assets|api|mesadj|sorteio)(?:[/.]|$)/.test(url.pathname)){
  return new HTMLRewriter().on('script[src*="/assets/home-clicks.js"]',{element(el){el.remove();}})
    .on('head',{element(el){el.append('<script defer src="/assets/home-clicks.js?v=20261107-daily-unique"></script>',{html:true});}}).transform(result);
}return result;}