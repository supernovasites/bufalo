import {schema} from './chopeira-nps.js';
export const creditSchema="CREATE TABLE IF NOT EXISTS chopeira_nps_credits (nps_id TEXT PRIMARY KEY,points INTEGER NOT NULL DEFAULT 500,staff_id TEXT NOT NULL,staff_name TEXT NOT NULL,credited_at TEXT NOT NULL)";
export async function ensureCredits(db){await db.batch([...schema,creditSchema].map(sql=>db.prepare(sql)));}
export async function creditNps(db,data,user){
 if(!data||typeof data.id!=='string'||!/^[a-f0-9-]{36}$/i.test(data.id)||data.credited!==true)return {error:'Marcação inválida.',status:400};
 await ensureCredits(db);
 if(!await db.prepare('SELECT id FROM chopeira_nps WHERE id=?').bind(data.id).first())return {error:'Avaliação não encontrada.',status:404};
 await db.prepare('INSERT OR IGNORE INTO chopeira_nps_credits (nps_id,points,staff_id,staff_name,credited_at) VALUES (?,500,?,?,?)').bind(data.id,user.id,user.name,new Date().toISOString()).run();
 const credit=await db.prepare('SELECT points,staff_name,credited_at FROM chopeira_nps_credits WHERE nps_id=?').bind(data.id).first();
 return {ok:true,id:data.id,...credit};
}
export async function npsContacts(db,params){
 const offset=Number(params.get('offset')||0),status=params.get('status')||'all',search=(params.get('search')||'').trim().slice(0,100);
 if(!Number.isSafeInteger(offset)||offset<0||!['all','pending','credited'].includes(status))return {error:'Filtros inválidos.',status:400};
 await ensureCredits(db);
 const base="FROM chopeira_nps n LEFT JOIN chopeira_nps_credits c ON c.nps_id=n.id WHERE (?='' OR instr(lower(n.name),lower(?))>0 OR instr(lower(n.email),lower(?))>0 OR instr(n.phone,?)>0)";
 const args=[search,search,search,search];
 const summaryQuery=db.prepare('SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN c.nps_id IS NOT NULL THEN 1 ELSE 0 END),0) AS credited '+base).bind(...args);
 const filter=status==='pending'?' AND c.nps_id IS NULL':status==='credited'?' AND c.nps_id IS NOT NULL':'';
 const rowsQuery=db.prepare("SELECT n.id,n.name,n.email,n.phone,n.score,n.review,n.created_at,n.has_photo,COALESCE((SELECT improvement FROM chopeira_nps_details d WHERE d.id=n.id),'') AS improvement,c.points,c.staff_name,c.credited_at "+base+filter+' ORDER BY n.created_at DESC,n.id DESC LIMIT 50 OFFSET ?').bind(...args,offset);
 const [summaryResult,rowsResult]=await db.batch([summaryQuery,rowsQuery]);
 const summary=summaryResult.results[0],rows=rowsResult.results||[];
 const total=status==='pending'?Number(summary.total)-Number(summary.credited):status==='credited'?Number(summary.credited):Number(summary.total);
 return {rows,total,offset,limit:50,summary:{total:Number(summary.total),credited:Number(summary.credited),pending:Number(summary.total)-Number(summary.credited)}};
}
export async function npsPhoto(db,id){
 if(!/^[a-f0-9-]{36}$/i.test(id||''))return null;
 await ensureCredits(db);
 return await db.prepare('SELECT content_type,data FROM chopeira_nps_photos WHERE id=?').bind(id).first();
}
