export const reasons = {'produto-caro':'Preço do produto alto','frete-caro':'Frete caro','prazo-longo':'Prazo de entrega longo','outro':'Outro motivo'};
export async function ensureSurvey(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS chopeira_survey_attendance (survey_id TEXT PRIMARY KEY, result TEXT NOT NULL, responded_at TEXT NOT NULL)`).run();
  await db.prepare('CREATE TABLE IF NOT EXISTS chopeira_attendance_staff (survey_id TEXT PRIMARY KEY, staff_name TEXT NOT NULL)').run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS chopeira_surveys (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, reasons TEXT NOT NULL, other TEXT NOT NULL DEFAULT '', device TEXT NOT NULL, day TEXT NOT NULL, created_at TEXT NOT NULL, consent INTEGER NOT NULL CHECK(consent=1))`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS chopeira_surveys_day ON chopeira_surveys(day,device)').run();
}
export function validateSurvey(data) {
  if (!data || typeof data !== 'object' || typeof data.name !== 'string' || typeof data.phone !== 'string' || typeof data.other !== 'string') return null;
  const name = data.name.trim().replace(/\s+/g,' '), phone = data.phone.replace(/[\s()+.-]/g,'');
  if (name.length < 2 || name.length > 100 || /[<>\u0000-\u001f]/.test(name) || !/^(?:55)?[1-9]{2}9[0-9]{8}$/.test(phone)) return null;
  if (!Array.isArray(data.reasons) || !data.reasons.length || data.reasons.length > 4 || data.reasons.some(key=>!Object.hasOwn(reasons,key))) return null;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(data.id) || !['mobile','tablet','desktop'].includes(data.device) || data.consent !== true || data.website) return null;
  const other = data.other.trim();
  if (other.length > 500 || /[<>\u0000-\u001f]/.test(other) || (data.reasons.includes('outro') && !other)) return null;
  return {id:data.id,name,phone:phone.length===11?'55'+phone:phone,reasons:[...new Set(data.reasons)],other:data.reasons.includes('outro')?other:'',device:data.device};
}
export async function surveyResults(db, range, device, offset=0,limit=50) {
  await ensureSurvey(db);
  const where = "day >= ? AND day <= ? AND (? = 'all' OR device = ?)";
  const query = sql=>db.prepare(sql).bind(range.start,range.end,device,device);
  const total = await query('SELECT COUNT(*) AS total FROM chopeira_surveys WHERE '+where).first();
  const summary = await query('SELECT value AS reason,COUNT(*) AS total FROM chopeira_surveys,json_each(chopeira_surveys.reasons) WHERE '+where+' GROUP BY value').all();
  const rows = await db.prepare("SELECT id,name,phone,reasons,other,device,created_at,COALESCE((SELECT result FROM chopeira_survey_attendance WHERE survey_id=id),'') AS attendance_result,(SELECT staff_name FROM chopeira_attendance_staff WHERE survey_id=id) AS staff_name,(SELECT responded_at FROM chopeira_survey_attendance WHERE survey_id=id) AS responded_at FROM chopeira_surveys WHERE "+where+' ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?').bind(range.start,range.end,device,device,limit,offset).all();
  return {total:Number(total.total),offset,limit,summary:summary.results||[],rows:(rows.results||[]).map(row=>({...row,reasons:JSON.parse(row.reasons)}))};
}
export async function saveAttendance(db, payload, actor=null) {
  if (!payload || typeof payload.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(payload.id) || typeof payload.result !== 'string') return {error:'Atendimento inválido.',status:400};
  const result=payload.result.trim();
  if (!result || result.length>1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(result)) return {error:'Escreva o resultado do atendimento (até 1.000 caracteres).',status:400};
  await ensureSurvey(db);
  if (!await db.prepare('SELECT id FROM chopeira_surveys WHERE id=?').bind(payload.id).first()) return {error:'Contato não encontrado.',status:404};
  const responded_at=new Date().toISOString();
  await db.prepare('INSERT INTO chopeira_survey_attendance (survey_id,result,responded_at) VALUES (?,?,?) ON CONFLICT(survey_id) DO UPDATE SET result=excluded.result,responded_at=excluded.responded_at').bind(payload.id,result,responded_at).run();
  if(actor)await db.prepare('INSERT INTO chopeira_attendance_staff (survey_id,staff_name) VALUES (?,?) ON CONFLICT(survey_id) DO UPDATE SET staff_name=excluded.staff_name').bind(payload.id,actor.name).run();
  return {ok:true,attendance_result:result,responded_at,staff_name:actor?.name||null};
}
