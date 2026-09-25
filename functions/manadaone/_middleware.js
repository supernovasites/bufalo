const encoder = new TextEncoder();
const headers = {'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
const json = (data,status=200,extra={}) => new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8',...extra}});
const hex = bytes => Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2,'0')).join('');
const digest = async text => hex(await crypto.subtle.digest('SHA-256',encoder.encode(text)));
async function verify(password,setting){
  const [salt,expected]=(setting||'').split(':');
  if(!/^[a-f0-9]{32}$/.test(salt||'')||!/^[a-f0-9]{64}$/.test(expected||''))return false;
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const actual=hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:Uint8Array.from(salt.match(/../g),x=>parseInt(x,16)),iterations:150000},key,256));
  let diff=0;for(let i=0;i<64;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i);
  return diff===0;
}
async function setup(db){
  await db.prepare('CREATE TABLE IF NOT EXISTS manadaone_settings (id INTEGER PRIMARY KEY CHECK (id=1), enabled INTEGER NOT NULL DEFAULT 1, coupon TEXT NOT NULL DEFAULT \'\')').run();
  await db.prepare('INSERT OR IGNORE INTO manadaone_settings (id,enabled,coupon) VALUES (1,0,\'\')').run();
  await db.prepare("UPDATE manadaone_settings SET enabled=1 WHERE id=1 AND enabled=0 AND coupon=''").run();
  await db.prepare('CREATE TABLE IF NOT EXISTS manadaone_sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL)').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS manadaone_attempts (client TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires INTEGER NOT NULL)').run();
}
async function session(request,db){
 const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)manadaone_session=([a-f0-9]{64})(?:;|$)/)?.[1];
 return token && await db.prepare('SELECT token FROM manadaone_sessions WHERE token=? AND expires>?').bind(await digest(token),Date.now()).first() ? token : null;
}
function cookie(request,token,age){return `manadaone_session=${token}; Path=/manadaone; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
async function handle(context){
 const {request,env}=context,url=new URL(request.url),path=url.pathname.replace(/\/$/,'');
 if(!env.LIVE_DB)return json({error:'Campanha temporariamente indisponível.'},503);
 const db=env.LIVE_DB;
 await setup(db);
 const settings=()=>db.prepare('SELECT enabled,coupon FROM manadaone_settings WHERE id=1').first();
 if(path.startsWith('/manadaone/api/')){
   if(!['GET','POST'].includes(request.method))return json({error:'Método não permitido.'},405);
   if(request.method==='POST' && request.headers.get('Origin')!==url.origin)return json({error:'Origem não permitida.'},403);
   let body={};if(request.method==='POST'){
     if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Formato inválido.'},415);
     const raw=await request.text();if(raw.length>1024)return json({error:'Pedido muito grande.'},413);
     try{body=JSON.parse(raw)}catch{return json({error:'Pedido inválido.'},400)}
   }
   if(path==='/manadaone/api/login' && request.method==='POST'){
     if(!env.MANADAONE_PASSWORD_HASH)return json({error:'Painel ainda não configurado no servidor.'},503);
     const bucket=Math.floor(Date.now()/900000),client=await digest((request.headers.get('CF-Connecting-IP')||'local')+':'+bucket);
     const attempt=await db.prepare('INSERT INTO manadaone_attempts(client,attempts,expires) VALUES (?,1,?) ON CONFLICT(client) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(client,(bucket+1)*900000).first();
     if(attempt.attempts>8)return json({error:'Muitas tentativas. Aguarde 15 minutos.'},429,{'Retry-After':'900'});
     if(typeof body.password!=='string'||body.password.length>128||!await verify(body.password,env.MANADAONE_PASSWORD_HASH))return json({error:'Senha incorreta.'},401);
     const token=hex(crypto.getRandomValues(new Uint8Array(32)));
     await db.batch([db.prepare('DELETE FROM manadaone_sessions WHERE expires<=?').bind(Date.now()),db.prepare('DELETE FROM manadaone_attempts WHERE client=?').bind(client),db.prepare('INSERT INTO manadaone_sessions(token,expires) VALUES (?,?)').bind(await digest(token),Date.now()+14400000)]);
     return json({ok:true},200,{'Set-Cookie':cookie(request,token,14400)});
   }
   const token=await session(request,db);if(!token)return json({error:'Entre no painel para continuar.'},401);
   if(path==='/manadaone/api/logout' && request.method==='POST'){
     await db.prepare('DELETE FROM manadaone_sessions WHERE token=?').bind(await digest(token)).run();
     return json({ok:true},200,{'Set-Cookie':cookie(request,'',0)});
   }
   if(path==='/manadaone/api/settings'){
     if(request.method==='POST'){
       if(typeof body.enabled!=='boolean'||typeof body.coupon!=='string')return json({error:'Dados inválidos.'},400);
       const coupon=body.coupon.trim().toUpperCase();
       if(coupon&&!/^[A-Z0-9_-]{3,24}$/.test(coupon))return json({error:'Use de 3 a 24 letras, números, hífen ou sublinhado.'},400);
       if(body.enabled&&!coupon)return json({error:'Informe o cupom antes de ativar.'},400);
       await db.prepare('UPDATE manadaone_settings SET enabled=?,coupon=? WHERE id=1').bind(body.enabled?1:0,coupon).run();
     }
     return json(await settings());
   }
   return json({error:'Página não encontrada.'},404);
 }
 if(['/manadaone','/manadaone/index','/manadaone/index.html'].includes(path)){
   const state=await settings();
   const assetPath=state.enabled?'/manadaone/index.html':'/manadaone/encerrada.html';
   const response=await env.ASSETS.fetch(new Request(new URL(assetPath,url),request));
   let page=await response.text();
   if(state.enabled)page=page.replaceAll('CUPOM A DEFINIR',state.coupon||'CUPOM EM BREVE');
   return new Response(request.method==='HEAD'?null:page,{status:200,headers:{...headers,'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex,nofollow'}});
 }
 const response=await context.next();const h=new Headers(response.headers);
 if(path.startsWith('/manadaone/admin')){Object.entries(headers).forEach(([k,v])=>h.set(k,v));h.set('X-Robots-Tag','noindex,nofollow');}
 return new Response(response.body,{status:response.status,headers:h});
}
export async function onRequest(context){try{return await handle(context)}catch{return json({error:'Não foi possível carregar a campanha.'},503)}}
