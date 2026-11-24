import {readLimited} from '../../lib/live-content.js';
import {analyticsRange,belemDay} from './home-analytics.js';
import {identity,sha} from './team-auth.js';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'};
const json=(data,status=200)=>Response.json(data,{status,headers});
export const PUBLICATION_CONSENT="Autorizo a Búfalo a utilizar e divulgar minha avaliação para que outros compradores possam conhecer minha experiência e considerá-la em suas decisões de compra. Autorizo também o registro dos meus dados e da foto enviada para análise da minha experiência e contato sobre esta resposta. Meu e-mail e telefone não serão divulgados.";
export const schema=[
"CREATE TABLE IF NOT EXISTS chopeira_nps_details (id TEXT PRIMARY KEY,improvement TEXT NOT NULL DEFAULT '',final_review TEXT NOT NULL DEFAULT '')",
"CREATE TABLE IF NOT EXISTS chopeira_nps_consents (id TEXT PRIMARY KEY,version TEXT NOT NULL,text TEXT NOT NULL,accepted_at TEXT NOT NULL)",
"CREATE TABLE IF NOT EXISTS chopeira_nps (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 10),review TEXT NOT NULL,device TEXT NOT NULL,day TEXT NOT NULL,created_at TEXT NOT NULL,source_hash TEXT NOT NULL,has_photo INTEGER NOT NULL DEFAULT 0)",
"CREATE INDEX IF NOT EXISTS chopeira_nps_day ON chopeira_nps(day,device)",
"CREATE TABLE IF NOT EXISTS chopeira_nps_photos (id TEXT PRIMARY KEY,content_type TEXT NOT NULL,data BLOB NOT NULL)"
];
export async function ensureNps(db){for(const sql of schema)await db.prepare(sql).run();}
export function validateNps(data){
 if(!data||typeof data!=='object')return null;
 const clean=(v,max)=>typeof v==='string'&&v.trim().length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)?v.trim():null;
 const name=clean(data.name,100),email=clean(data.email,254),review=clean(data.review,3000);
 const improvement=clean(data.improvement??'',3000),final_review=clean(data.final_review??'',3000);
 if(!improvement||final_review===null)return null;
 const phone=typeof data.phone==='string'?data.phone.replace(/[\s()+.-]/g,''):'';
 if(!name||name.length<2||!email||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||!review||!/^(?:55)?[1-9]{2}[0-9]{8,9}$/.test(phone))return null;
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(data.id)||!Number.isInteger(data.score)||data.score<0||data.score>10||!['mobile','tablet','desktop'].includes(data.device)||data.consent!==true||data.consentVersion!=='review-publication-20261124'||data.website)return null;
 return {id:data.id,name,email:email.toLowerCase(),phone:phone.length<=11?'55'+phone:phone,score:data.score,review,improvement,final_review,device:data.device};
}
export function photoType(b){
 if(b.length<12)return null;
 if(b[0]===255&&b[1]===216&&b[2]===255)return 'image/jpeg';
 if([137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))return 'image/png';
 const t=new TextDecoder();if(t.decode(b.slice(0,4))==='RIFF'&&t.decode(b.slice(8,12))==='WEBP')return 'image/webp';
 return null;
}
export async function submitNps({request,env}){
 if(request.method!=='POST')return json({error:'Método não permitido.'},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Origem não permitida.'},403);
 if(!env.LIVE_DB)return json({error:'Pesquisa temporariamente indisponível.'},503);
 try{
  if(Number(request.headers.get('Content-Length')||0)>250000)return json({error:'Foto muito grande.'},413);
  let bytes;try{bytes=await readLimited(request,250000);}catch{return json({error:'Foto muito grande.'},413);}
  let form;try{form=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('Content-Type')||''},body:bytes}).formData();}catch{return json({error:'Envio inválido.'},400);}
  let raw;try{raw=JSON.parse(form.get('data'));}catch{return json({error:'Resposta inválida.'},400);}
  const data=validateNps(raw);if(!data)return json({error:'Confira a nota, sugestão de melhoria, avaliação, nome, e-mail, telefone com DDD e autorização.'},400);
  const file=form.get('photo');let photo=null,type=null;
  if(!file||!file.size)return json({error:'Compartilhe uma foto da sua chopeira para enviar a avaliação.'},400);
  if(file&&file.size){if(file.size>220000)return json({error:'Foto muito grande. Selecione outra imagem.'},413);photo=new Uint8Array(await file.arrayBuffer());type=photoType(photo);if(!type||type!==file.type)return json({error:'Envie uma foto JPG, PNG ou WebP válida.'},415);}
  const db=env.LIVE_DB;await ensureNps(db);
  if(await db.prepare('SELECT id FROM chopeira_nps WHERE id=?').bind(data.id).first())return json({ok:true});
  const source=await sha((request.headers.get('CF-Connecting-IP')||'unknown')+':'+belemDay());
  const recent=await db.prepare('SELECT COUNT(*) AS total FROM chopeira_nps WHERE source_hash=? AND created_at>=?').bind(source,new Date(Date.now()-3600000).toISOString()).first();
  if(Number(recent.total)>=10)return json({error:'Muitos envios. Tente novamente mais tarde.'},429);
  const queries=[db.prepare('INSERT INTO chopeira_nps (id,name,email,phone,score,review,device,day,created_at,source_hash,has_photo) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(data.id,data.name,data.email,data.phone,data.score,data.review,data.device,belemDay(),new Date().toISOString(),source,photo?1:0)];
  queries.push(db.prepare('INSERT INTO chopeira_nps_consents (id,version,text,accepted_at) VALUES (?,?,?,?)').bind(data.id,'review-publication-20261124',PUBLICATION_CONSENT,new Date().toISOString()));
  queries.push(db.prepare('INSERT INTO chopeira_nps_details (id,improvement,final_review) VALUES (?,?,?)').bind(data.id,data.improvement,data.final_review));
  if(photo)queries.push(db.prepare('INSERT INTO chopeira_nps_photos (id,content_type,data) VALUES (?,?,?)').bind(data.id,type,photo));
  await db.batch(queries);
  return json({ok:true},201);
 }catch{return json({error:'Não foi possível salvar. Tente novamente.'},503);}
}
export async function adminNps({request,env}){
 if(request.method!=='GET')return json({error:'Método não permitido.'},405);
 if((await identity(request,env))?.role!=='A')return json({error:'Entre como administrador para consultar as avaliações.'},401);
 const url=new URL(request.url),db=env.LIVE_DB;await ensureNps(db);
 if(url.pathname.endsWith('/photo')){
  const id=url.searchParams.get('id')||'';if(!/^[a-f0-9-]{36}$/i.test(id))return json({error:'Foto inválida.'},400);
  const row=await db.prepare('SELECT content_type,data FROM chopeira_nps_photos WHERE id=?').bind(id).first();
  if(!row)return json({error:'Foto não encontrada.'},404);
  return new Response(Uint8Array.from(row.data),{headers:{...headers,'Content-Type':row.content_type,'Content-Security-Policy':"default-src 'none'; sandbox"}});
 }
 let range;try{range=analyticsRange(url.searchParams.get('days')||'30',url.searchParams.get('start'),url.searchParams.get('end'));}catch(e){return json({error:e.message},400);}
 const device=url.searchParams.get('device')||'all',offset=Number(url.searchParams.get('offset')||0);
 if(!['all','mobile','tablet','desktop'].includes(device)||!Number.isSafeInteger(offset)||offset<0)return json({error:'Filtros inválidos.'},400);
 const where="day>=? AND day<=? AND (?='all' OR device=?)",args=[range.start,range.end,device,device];
 const distribution=(await db.prepare('SELECT score,COUNT(*) AS total FROM chopeira_nps WHERE '+where+' GROUP BY score').bind(...args).all()).results||[];
 const total=distribution.reduce((n,r)=>n+Number(r.total),0);
 const count=(min,max)=>distribution.filter(r=>r.score>=min&&r.score<=max).reduce((n,r)=>n+Number(r.total),0);
 const promoters=count(9,10),passives=count(7,8),detractors=count(0,6);
 const rows=(await db.prepare('SELECT id,name,email,phone,score,review,device,created_at,has_photo,COALESCE((SELECT improvement FROM chopeira_nps_details d WHERE d.id=chopeira_nps.id),\'\') AS improvement,COALESCE((SELECT final_review FROM chopeira_nps_details d WHERE d.id=chopeira_nps.id),\'\') AS final_review,EXISTS(SELECT 1 FROM chopeira_nps_consents c WHERE c.id=chopeira_nps.id) AS publication_authorized FROM chopeira_nps WHERE '+where+' ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET ?').bind(...args,offset).all()).results||[];
 return json({total,promoters,passives,detractors,nps:total?Math.round((promoters-detractors)*100/total):null,distribution,rows,offset,limit:50});
}
