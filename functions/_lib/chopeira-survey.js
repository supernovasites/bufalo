export const reasons = {'produto-caro':'Preço do produto alto','frete-caro':'Frete caro','prazo-longo':'Prazo de entrega longo','outro':'Outro motivo'};
export async function ensureSurvey(db) {
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
export async function surveyResults(db, range, device, offset=0) {
  await ensureSurvey(db);
  const where = "day >= ? AND day <= ? AND (? = 'all' OR device = ?)";
  const query = sql=>db.prepare(sql).bind(range.start,range.end,device,device);
  const total = await query('SELECT COUNT(*) AS total FROM chopeira_surveys WHERE '+where).first();
  const summary = await query('SELECT value AS reason,COUNT(*) AS total FROM chopeira_surveys,json_each(chopeira_surveys.reasons) WHERE '+where+' GROUP BY value').all();
  const rows = await db.prepare('SELECT name,phone,reasons,other,device,created_at FROM chopeira_surveys WHERE '+where+' ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET ?').bind(range.start,range.end,device,device,offset).all();
  return {total:Number(total.total),offset,limit:50,summary:summary.results||[],rows:(rows.results||[]).map(row=>({...row,reasons:JSON.parse(row.reasons)}))};
}
