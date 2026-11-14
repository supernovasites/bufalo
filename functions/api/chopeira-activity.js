import {ensureHomepageStats,belemDay} from '../_lib/home-analytics.js';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const schema='CREATE TABLE IF NOT EXISTS chopeira_active_visitors (visitor TEXT PRIMARY KEY,last_seen INTEGER NOT NULL)';
export async function onRequest({request,env}){
 if(request.method!=='POST')return json({error:'Método não permitido.'},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Origem inválida.'},403);
 if(!env.LIVE_DB)return json({available:false},503);
 if(/bot|crawler|spider|headless|preview/i.test(request.headers.get('User-Agent')||''))return json({available:false});
 try{
  const raw=await request.text();if(raw.length>256)return json({error:'Evento inválido.'},413);
  let payload;try{payload=JSON.parse(raw);}catch{return json({error:'Evento inválido.'},400);}
  if(!payload||typeof payload.visitor!=='string'||!/^[a-f0-9-]{36}$/i.test(payload.visitor))return json({error:'Visitante inválido.'},400);
  const visitor=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload.visitor))),b=>b.toString(16).padStart(2,'0')).join('');
  const db=env.LIVE_DB,now=Date.now();await db.prepare(schema).run();
  await db.batch([
   db.prepare('DELETE FROM chopeira_active_visitors WHERE last_seen < ?').bind(now-90000),
   db.prepare('INSERT INTO chopeira_active_visitors(visitor,last_seen) VALUES (?,?) ON CONFLICT(visitor) DO UPDATE SET last_seen=excluded.last_seen').bind(visitor,now)
  ]);
  const row=await db.prepare('SELECT COUNT(*) AS total FROM chopeira_active_visitors WHERE last_seen >= ?').bind(now-90000).first();
  let products=[];
  try{
   await ensureHomepageStats(db);
   const result=await db.prepare("SELECT target,SUM(total) AS clicks FROM site_interactions WHERE page='/produtos/chopeira/' AND day=? AND kind='product' AND target LIKE 'loja.bufalogrowler.com.br/%' GROUP BY target HAVING SUM(total)>0 ORDER BY clicks DESC,target LIMIT 10").bind(belemDay()).all();
   products=(result.results||[]).map(product=>({target:product.target,clicks:Number(product.clicks)})).filter(product=>Number.isSafeInteger(product.clicks)&&product.clicks>0);
  }catch{/* Viewer counts remain available if product analytics is temporarily unavailable. */}
  // Product clicks are never presented as people or purchases.
  return json({available:true,viewers:Number(row?.total||0),activeWindowSeconds:90,products,productPeriod:'today'});
 }catch{return json({available:false},503);}
}

