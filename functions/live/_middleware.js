import {content, gallery, validDate, photoResponse, savePhoto, readLimited} from '../../lib/live-content.js';
const encoder = new TextEncoder();
const noCache = {'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {status, headers:{...noCache,'Content-Type':'application/json; charset=utf-8',...headers}});
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2,'0')).join('');
async function sha(value) { return hex(await crypto.subtle.digest('SHA-256', encoder.encode(value))); }
async function passwordMatches(password, setting) {
  const [salt, expected] = setting.split(':');
  if (!salt || !/^[a-f0-9]{64}$/.test(expected || '')) return false;
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const actual = hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:100000},key,256));
  let diff = 0; for (let i=0;i<actual.length;i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
async function state(db) { const row = await db.prepare('SELECT enabled FROM live_settings WHERE id = 1').first(); return {enabled: row ? !!row.enabled : true,...await content(db)}; }
async function authenticated(request, db) {
  const token = request.headers.get('Cookie')?.match(/(?:^|;\s*)live_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return false;
  return !!await db.prepare('SELECT token FROM live_sessions WHERE token = ? AND expires > ?').bind(await sha(token),Date.now()).first();
}
function cookie(request, token, maxAge) { return `live_session=${token}; Path=/live; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`; }
async function handle(context) {
  const {request,env} = context;
  const url = new URL(request.url), path = url.pathname.replace(/\/$/,'');
  if (path.startsWith('/live/api/')) {
    if (!env.LIVE_DB || !env.LIVE_PASSWORD_HASH) return json({error:'O painel ainda não foi configurado no servidor.'},503);
    const db = env.LIVE_DB;
    const gallerySlot=path.match(/^\/live\/api\/gallery\/([1-5])$/)?.[1];
    if(path==='/live/api/gallery' && request.method==='GET')return json({photos:await gallery(db)});
    if(gallerySlot && ['GET','HEAD'].includes(request.method))return photoResponse(db,request,noCache,Number(gallerySlot));
    if(path==='/live/api/photo' && ['GET','HEAD'].includes(request.method)) return photoResponse(db,request,noCache);
    if (!['GET','POST'].includes(request.method)) return json({error:'Método não permitido.'},405);
    if (request.method === 'POST' && request.headers.get('Origin') !== url.origin) return json({error:'Origem não permitida.'},403);
    if(gallerySlot && request.method==='POST') {
      if(!await authenticated(request,db))return json({error:'Entre no painel para continuar.'},401);
      const result=await savePhoto(db,request,Number(gallerySlot));return result.error?json({error:result.error},result.status):json(await state(db));
    }
    if(path==='/live/api/photo' && request.method==='POST') {
      if(!await authenticated(request,db))return json({error:'Entre no painel para continuar.'},401);
      const result=await savePhoto(db,request);return result.error?json({error:result.error},result.status):json(await state(db));
    }
    let body = {};
    if (request.method === 'POST') {
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'Formato inválido.'},415);
      let raw; try{raw=new TextDecoder().decode(await readLimited(request,2048));}catch{return json({error:'Pedido muito grande.'},413);}
      try { body = JSON.parse(raw); } catch { return json({error:'Pedido inválido.'},400); }
      if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'Pedido inválido.'},400);
    }
    if (path === '/live/api/register' && request.method === 'POST') {
      if (!env.LIVE_SHEET_WEBHOOK_URL || !env.LIVE_SUBMISSION_TOKEN) return json({error:'Cadastro indisponível no momento. Tente novamente mais tarde.'},503);
      const field = (value, limit, required = true) => typeof value === 'string' && value.trim().length <= limit && (!required || value.trim()) ? value.trim() : null;
      const member=body.tipo_cadastro==='member';
      if (body.tipo_cadastro && !['first','member'].includes(body.tipo_cadastro)) return json({error:'Tipo de cadastro inválido.'},400);
      const nome=field(body.nome,120), nascimento=member?'':field(body.data_nascimento,10), cpf=field(body.cpf,18), email=member?'':field(body.email,254), instagram=field(body.instagram,80,member)??'', cidade=field(body.cidade,100), whatsapp=member?'':field(body.whatsapp,22);
      if (!nome || !cpf || cpf.replace(/\D/g,'').length!==11 || !cidade || (member ? !instagram : (!nome || !/^\d{4}-\d{2}-\d{2}$/.test(nascimento || '') || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !whatsapp || !/^\d{10,13}$/.test(whatsapp.replace(/\D/g,''))))) return json({error:'Confira os dados informados e tente novamente.'},400);
      const now=Date.now(), bucket=Math.floor(now/900000);
      const client=await sha('register:'+(request.headers.get('CF-Connecting-IP')||'local')+':'+bucket);
      const attempt=await db.prepare('INSERT INTO live_attempts (client,attempts,expires) VALUES (?,1,?) ON CONFLICT(client) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(client,(bucket+1)*900000).first();
      if (attempt.attempts>10) return json({error:'Muitas tentativas de cadastro. Aguarde alguns minutos.'},429,{'Retry-After':'900'});
      const payload={nome,data_nascimento:nascimento,cpf,email,instagram,cidade,whatsapp,tipo_cadastro:member?'member':'first',token:env.LIVE_SUBMISSION_TOKEN};
      let result;
      try {
        const upstream=await fetch(env.LIVE_SHEET_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'text/plain; charset=utf-8'},body:JSON.stringify(payload),redirect:'follow',signal:AbortSignal.timeout(15000)});
        if (!upstream.ok) throw new Error('upstream_status');
        result=JSON.parse(new TextDecoder().decode(await readLimited(upstream,2048)));
      } catch { return json({error:'Não foi possível salvar o cadastro agora. Tente novamente.'},502); }
      if (result?.ok!==true) return json({error:result?.error==='invalid_fields'?'Confira os dados informados e tente novamente.':'Não foi possível salvar o cadastro agora. Tente novamente.'},result?.error==='invalid_fields'?400:502);
      return json({ok:true});
    }
    if (path === '/live/api/login' && request.method === 'POST') {
      const now = Date.now(), bucket = Math.floor(now / 900000);
      const client = await sha((request.headers.get('CF-Connecting-IP') || 'local') + ':' + bucket);
      const attempt = await db.prepare('INSERT INTO live_attempts (client, attempts, expires) VALUES (?,1,?) ON CONFLICT(client) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(client,(bucket+1)*900000).first();
      if (attempt.attempts > 8) return json({error:'Muitas tentativas. Aguarde 15 minutos e tente novamente.'},429,{'Retry-After':'900'});
      if (typeof body.password !== 'string' || body.password.length > 128 || !await passwordMatches(body.password,env.LIVE_PASSWORD_HASH)) return json({error:'Senha incorreta. Tente novamente.'},401);
      const token = hex(crypto.getRandomValues(new Uint8Array(32)));
      await db.batch([
        db.prepare('DELETE FROM live_sessions WHERE expires <= ?').bind(now),
        db.prepare('DELETE FROM live_attempts WHERE expires <= ? OR client = ?').bind(now,client),
        db.prepare('INSERT INTO live_sessions (token, expires) VALUES (?, ?)').bind(await sha(token),now+14400000)
      ]);
      return json({ok:true},200,{'Set-Cookie':cookie(request,token,14400)});
    }
    if (!await authenticated(request,db)) return json({error:'Entre no painel para continuar.'},401);
    if(path==='/live/api/content' && request.method==='POST') {
      const coupon=typeof body.coupon==='string'?body.coupon.trim().toUpperCase():'';
      if(!/^[A-Z0-9_-]{3,24}$/.test(coupon))return json({error:'Use de 3 a 24 letras, números, hífen ou sublinhado no cupom.'},400);
      if(!validDate(body.live_date))return json({error:'Informe uma data válida no formato DD/MM.'},400);
      await db.prepare('UPDATE live_content SET coupon=?,live_date=? WHERE id=1').bind(coupon,body.live_date).run();
      return json(await state(db));
    }
    if (path === '/live/api/logout' && request.method === 'POST') {
      const token = request.headers.get('Cookie').match(/(?:^|;\s*)live_session=([a-f0-9]{64})/)?.[1];
      await db.prepare('DELETE FROM live_sessions WHERE token = ?').bind(await sha(token)).run();
      return json({ok:true},200,{'Set-Cookie':cookie(request,'',0)});
    }
    if (path === '/live/api/state') {
      if (request.method === 'POST') {
        if (typeof body.enabled !== 'boolean') return json({error:'Estado inválido.'},400);
        await db.prepare('INSERT INTO live_settings (id,enabled) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET enabled=excluded.enabled').bind(body.enabled?1:0).run();
      }
      return json(await state(db));
    }
    return json({error:'Página não encontrada.'},404);
  }
  if (['/live','/live/index','/live/index.html'].includes(path)) {
    if (!env.LIVE_DB) return new Response('Live temporariamente indisponível. Volte em instantes.',{status:503,headers:noCache});
    if (!(await state(env.LIVE_DB)).enabled) {
      const assetUrl = new URL('/live/encerrada',url);
      const result = await env.ASSETS.fetch(new Request(assetUrl,request));
      return new Response(request.method === 'HEAD'?null:result.body,{status:200,headers:{...noCache,'Content-Type':'text/html; charset=utf-8'}});
    }
  }
  const result = await context.next();
  const headers = new Headers(result.headers);
  if (['/live','/live/index','/live/index.html','/live/admin','/live/admin.html'].includes(path)) {
    for(const [key,value] of Object.entries(noCache)) headers.set(key,value);
  }
  if (path.startsWith('/live/admin')) { headers.set('X-Robots-Tag','noindex, nofollow'); headers.set('Cache-Control','no-store, max-age=0'); }
  if (['/live','/live/index','/live/index.html'].includes(path) && result.status===200 && headers.get('Content-Type')?.includes('text/html')) {
    const config=await content(env.LIVE_DB);
    let html=await result.text();
    html=html.replaceAll('LIVEBG1609',config.coupon).replaceAll('16/09',config.live_date).replaceAll('16.09',config.live_date.replace('/','.'));
    if(config.photo_version)html=html.replace(/<img id="momento-image"[^>]*>/,tag=>tag.replace(/src="[^"]*"/,'src="/live/api/photo?v='+encodeURIComponent(config.photo_version)+'"').replace(/alt="[^"]*"/,'alt="Foto da manada no Momento BG"'));
    headers.delete('Content-Length');headers.delete('ETag');
    return new Response(request.method==='HEAD'?null:html,{status:200,headers});
  }
  return new Response(result.body,{status:result.status,headers});
}
export async function onRequest(context) {
  try { return await handle(context); }
  catch { return json({error:'Não foi possível acessar o controle da live. Tente novamente em instantes.'},503); }
}
