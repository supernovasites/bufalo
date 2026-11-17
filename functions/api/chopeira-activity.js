const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const schema='CREATE TABLE IF NOT EXISTS chopeira_active_visitors (visitor TEXT PRIMARY KEY,last_seen INTEGER NOT NULL)';
const dailySchema='CREATE TABLE IF NOT EXISTS chopeira_daily_visitors (visit_date TEXT NOT NULL,visitor TEXT NOT NULL,PRIMARY KEY(visit_date,visitor))';
function belemDateKey(timestamp){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Belem',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(timestamp));
 const value=Object.fromEntries(parts.map(part=>[part.type,part.value]));
 return value.year+'-'+value.month+'-'+value.day;
}
export async function onRequest({request,env}){
 if(request.method!=='POST')return json({error:'Método não permitido.'},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Origem inválida.'},403);
 if(!env.LIVE_DB)return json({available:false},503);
 if(/bot|crawler|spider|headless|preview/i.test(request.headers.get('User-Agent')||''))return json({available:false});
 try{
  const raw=await request.text();if(raw.length>256)return json({error:'Evento inválido.'},413);
  let payload;try{payload=JSON.parse(raw);}catch{return json({error:'Evento inválido.'},400);}
  if(!payload||typeof payload.visitor!=='string'||!/^[a-f0-9-]{36}$/i.test(payload.visitor))return json({error:'Visitante inválido.'},400);
  const db=env.LIVE_DB,now=Date.now(),today=belemDateKey(now);
  const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
  const visitor=await hash(payload.visitor),dailyVisitor=await hash(today+':'+visitor);
  await db.prepare(schema).run();await db.prepare(dailySchema).run();
  await db.batch([
   db.prepare('DELETE FROM chopeira_active_visitors WHERE last_seen < ?').bind(now-90000),
   db.prepare('INSERT INTO chopeira_active_visitors(visitor,last_seen) VALUES (?,?) ON CONFLICT(visitor) DO UPDATE SET last_seen=excluded.last_seen').bind(visitor,now),
   db.prepare('INSERT OR IGNORE INTO chopeira_daily_visitors(visit_date,visitor) VALUES (?,?)').bind(today,dailyVisitor),
   db.prepare("DELETE FROM chopeira_daily_visitors WHERE visit_date < date('now','-90 days')")
  ]);
  const [activeRow,dailyRow]=await Promise.all([
   db.prepare('SELECT COUNT(*) AS total FROM chopeira_active_visitors WHERE last_seen >= ?').bind(now-90000).first(),
   db.prepare('SELECT COUNT(*) AS total FROM chopeira_daily_visitors WHERE visit_date = ?').bind(today).first()
  ]);
  return json({available:true,viewers:Number(activeRow?.total||0),todayVisitors:Number(dailyRow?.total||0),localDate:today,activeWindowSeconds:90});
 }catch{return json({available:false},503);}
}

