import {readLimited} from './live-content.js';

export const auctionSchema = [
  `CREATE TABLE IF NOT EXISTS live_auction (id INTEGER PRIMARY KEY CHECK(id=1), round_id INTEGER NOT NULL DEFAULT 1, enabled INTEGER NOT NULL DEFAULT 0, title TEXT NOT NULL DEFAULT 'Cooler Búfalo Growler', description TEXT NOT NULL DEFAULT 'Dê seu lance e leve a aventura com você.', photo TEXT, photo_type TEXT, photo_version TEXT, updated_at INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS live_auction_bids (id INTEGER PRIMARY KEY AUTOINCREMENT, round_id INTEGER NOT NULL, request_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL, phone TEXT NOT NULL, city TEXT NOT NULL, product_title TEXT NOT NULL, amount_cents INTEGER NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS live_auction_round_bids ON live_auction_bids(round_id,id DESC)`,
  `INSERT OR IGNORE INTO live_auction(id) VALUES(1)`,
  `CREATE TABLE IF NOT EXISTS live_auction_pricing (id INTEGER PRIMARY KEY CHECK(id=1), start_cents INTEGER NOT NULL DEFAULT 0 CHECK(start_cents BETWEEN 0 AND 10000000000))`,
  `INSERT OR IGNORE INTO live_auction_pricing(id,start_cents) VALUES(1,0)`
];
const headers={'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
const ready=new WeakMap();
export async function initAuction(db){
  if(!ready.has(db))ready.set(db,(async()=>{for(const sql of auctionSchema)await db.prepare(sql).run();})().catch(error=>{ready.delete(db);throw error;}));
  await ready.get(db);
}
async function snapshot(db){
  const config=await db.prepare('SELECT a.round_id,a.enabled,a.title,a.description,a.photo_version,a.updated_at,p.start_cents FROM live_auction a JOIN live_auction_pricing p ON p.id=a.id WHERE a.id=1').first();
  const live=await db.prepare('SELECT enabled FROM live_settings WHERE id=1').first();
  const bids=(await db.prepare('SELECT id,name,city,amount_cents,created_at FROM live_auction_bids WHERE round_id=? ORDER BY id DESC LIMIT 2').bind(config.round_id).all()).results;
  return {...config,enabled:!!config.enabled&&live?.enabled!==0,amount_cents:bids[0]?.amount_cents??config.start_cents,increment_cents:10000,next_amount_cents:(bids[0]?.amount_cents??config.start_cents)+10000,bids,photo_url:config.photo_version?'/live/api/auction/photo?v='+encodeURIComponent(config.photo_version):'/live/assets/auction-cooler.png'};
}
async function bodyJSON(request){
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new Error('format');
  const body=JSON.parse(new TextDecoder().decode(await readLimited(request,8192)));
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('format');
  return body;
}
const field=(v,max)=>typeof v==='string'?v.trim().replace(/\s+/g,' ').slice(0,max+1):'';
export async function handleAuction(request,db,authenticated){
  const url=new URL(request.url),path=url.pathname.replace(/\/$/,'');
  if(!['GET','POST','HEAD'].includes(request.method))return json({error:'Método não permitido.'},405);
  if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return json({error:'Origem não permitida.'},403);
  const admin=path==='/live/api/auction/admin'||path==='/live/api/auction/reset'||(path==='/live/api/auction/photo'&&request.method==='POST');
  if(admin&&!await authenticated())return json({error:'Entre no painel para continuar.'},401);
  await initAuction(db);
  if(path==='/live/api/auction/photo'){
    if(request.method==='GET'||request.method==='HEAD'){
      const row=await db.prepare('SELECT photo,photo_type FROM live_auction WHERE id=1').first();
      if(!row?.photo)return new Response(null,{status:404,headers});
      return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(row.photo),c=>c.charCodeAt(0)),{headers:{...headers,'Content-Type':row.photo_type,'Content-Security-Policy':"default-src 'none'"}});
    }
    const type=request.headers.get('Content-Type')?.split(';')[0];
    if(!['image/jpeg','image/png','image/webp'].includes(type))return json({error:'Envie JPG, PNG ou WebP.'},415);
    let bytes;try{bytes=await readLimited(request,800000);}catch{return json({error:'A imagem deve ter até 800 KB.'},413);}
    const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    const png=[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
    const webp=new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
    if(bytes.length<12||!(type==='image/jpeg'&&jpeg||type==='image/png'&&png||type==='image/webp'&&webp))return json({error:'Imagem inválida.'},400);
    let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.slice(i,i+8192));
    await db.prepare('UPDATE live_auction SET photo=?,photo_type=?,photo_version=?,updated_at=MAX(updated_at+1,?) WHERE id=1').bind(btoa(binary),type,crypto.randomUUID(),Date.now()).run();
    return json(await snapshot(db));
  }
  if(path==='/live/api/auction'&&request.method==='GET')return json(await snapshot(db));
  if(path==='/live/api/auction/admin'&&request.method==='GET'){
    const offset=Math.max(0,Math.min(10000000,parseInt(url.searchParams.get('offset')||'0',10)||0));
    const bids=(await db.prepare('SELECT id,round_id,name,phone,city,product_title,amount_cents,created_at FROM live_auction_bids ORDER BY id DESC LIMIT 100 OFFSET ?').bind(offset).all()).results;
    const total=(await db.prepare('SELECT COUNT(*) AS total FROM live_auction_bids').first()).total;
    return json({...await snapshot(db),history:bids,total,offset});
  }
  if(request.method!=='POST')return json({error:'Página não encontrada.'},404);
  let body;try{body=await bodyJSON(request);}catch{return json({error:'Pedido inválido ou muito grande.'},400);}
  if(path==='/live/api/auction/admin'){
    const title=field(body.title,120),description=typeof body.description==='string'?body.description.trim():'';
    if(!title||title.length>120||description.length>1500||typeof body.enabled!=='boolean')return json({error:'Informe o produto e uma descrição de até 1.500 caracteres.'},400);
    if(body.start_cents!==undefined&&(!Number.isSafeInteger(body.start_cents)||body.start_cents<0||body.start_cents>10000000000))return json({error:'Informe um valor inicial válido, maior ou igual a zero.'},400);
    const config=db.prepare('UPDATE live_auction SET title=?,description=?,enabled=?,updated_at=MAX(updated_at+1,?) WHERE id=1').bind(title,description,body.enabled?1:0,Date.now());
    if(body.start_cents===undefined)await config.run();
    else await db.batch([config,db.prepare('UPDATE live_auction_pricing SET start_cents=? WHERE id=1').bind(body.start_cents)]);
    return json(await snapshot(db));
  }
  if(path==='/live/api/auction/reset'){
    if(!Number.isSafeInteger(body.round_id))return json({error:'Atualize a consulta antes de reiniciar.'},400);
    await db.prepare('UPDATE live_auction SET round_id=round_id+1,enabled=0,updated_at=MAX(updated_at+1,?) WHERE id=1 AND round_id=?').bind(Date.now(),body.round_id).run();
    const current=await snapshot(db);
    if(current.round_id!==body.round_id+1)return json({error:'O leilão já foi reiniciado. Atualize a consulta.'},409);
    return json(current);
  }
  if(path!=='/live/api/auction/bid')return json({error:'Página não encontrada.'},404);
  const name=field(body.name,120),city=field(body.city,100),phone=typeof body.phone==='string'?body.phone.replace(/\D/g,''):'';
  if(name.length<2||name.length>120||city.length<2||city.length>100||!/^\d{10,13}$/.test(phone)||!Number.isSafeInteger(body.round_id)||!Number.isSafeInteger(body.product_version)||body.product_version<0||!Number.isSafeInteger(body.expected_cents)||body.expected_cents<0||body.expected_cents>10000000000||typeof body.request_id!=='string'||!/^[a-f0-9-]{36}$/i.test(body.request_id))return json({error:'Confira nome, telefone com DDD e cidade.'},400);
  const config=await snapshot(db);
  const duplicate=await db.prepare('SELECT id FROM live_auction_bids WHERE request_id=? AND round_id=?').bind(body.request_id,body.round_id).first();
  if(duplicate&&config.round_id===body.round_id)return json({...config,accepted_id:duplicate.id});
  const live=await db.prepare('SELECT enabled FROM live_settings WHERE id=1').first();
  if(live?.enabled===0||!config.enabled)return json({error:'Os lances estão pausados.',auction:config},409);
  const bucket=Math.floor(Date.now()/60000);
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('auction:'+(request.headers.get('CF-Connecting-IP')||'local')+':'+bucket))),b=>b.toString(16).padStart(2,'0')).join('');
  const attempts=await db.prepare('INSERT INTO live_attempts(client,attempts,expires) VALUES (?,1,?) ON CONFLICT(client) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(hash,(bucket+1)*60000).first();
  if(attempts.attempts>30)return json({error:'Muitos lances em sequência. Aguarde um minuto.'},429);
  // One atomic statement checks the round and price and assigns exactly + R$ 100.
  const bid=await db.prepare(`INSERT INTO live_auction_bids(round_id,request_id,name,phone,city,product_title,amount_cents,created_at)
    SELECT round_id,?,?,?,?,title,?+10000,? FROM live_auction WHERE id=1 AND enabled=1 AND round_id=? AND updated_at=?
    AND COALESCE((SELECT MAX(amount_cents) FROM live_auction_bids WHERE round_id=?),(SELECT start_cents FROM live_auction_pricing WHERE id=1))=?
    AND COALESCE((SELECT enabled FROM live_settings WHERE id=1),1)=1
    ON CONFLICT(request_id) DO NOTHING RETURNING id`).bind(body.request_id,name,phone,city,body.expected_cents,Date.now(),body.round_id,body.product_version,body.round_id,body.expected_cents).first();
  const current=await snapshot(db);
  if(!bid)return json({error:'O valor ou a rodada mudou. Confira o novo lance e confirme novamente.',auction:current},409);
  return json({...current,accepted_id:bid.id},201);
}
