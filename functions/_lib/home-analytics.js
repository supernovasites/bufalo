// Contadores agregados da homepage. Nao guardar IP, cookies, CPF ou consultas.
export const homeAnalyticsSchema = "CREATE TABLE IF NOT EXISTS homepage_interactions (day TEXT NOT NULL, device TEXT NOT NULL, kind TEXT NOT NULL, section TEXT NOT NULL, element_key TEXT NOT NULL, label TEXT NOT NULL, target TEXT NOT NULL DEFAULT '', total INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day,device,kind,section,element_key))";
export const homeAnalyticsMigration = "CREATE INDEX IF NOT EXISTS homepage_interactions_day_kind ON homepage_interactions(day,kind)";
let initialized;
export async function ensureHomepageStats(db) {
  if (!initialized) initialized = (async () => {
    await db.prepare(homeAnalyticsSchema).run();
    await db.prepare(homeAnalyticsMigration).run();
  })().catch(error => { initialized = null; throw error; });
  return initialized;
}
export function belemDay(date = Date.now()) {
  return new Date(date - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
export async function homepageStats(db, days, device) {
  await ensureHomepageStats(db);
  const start = belemDay(Date.now() - (days - 1) * 86400000);
  const where = "day >= ? AND (? = 'all' OR device = ?)";
  const query = (sql, extra = []) => db.prepare(sql).bind(start, device, device, ...extra).all().then(out => out.results || []);
  const [totals, daily, sections, elements, devices, scroll] = await Promise.all([
    query("SELECT kind, SUM(total) AS total FROM homepage_interactions WHERE " + where + " GROUP BY kind"),
    query("SELECT day, SUM(CASE WHEN kind = 'click' THEN total ELSE 0 END) AS clicks, SUM(CASE WHEN kind = 'view' THEN total ELSE 0 END) AS views FROM homepage_interactions WHERE " + where + " GROUP BY day ORDER BY day"),
    query("SELECT section, SUM(total) AS clicks FROM homepage_interactions WHERE " + where + " AND kind = 'click' GROUP BY section ORDER BY clicks DESC LIMIT 40"),
    query("SELECT day, section, element_key AS element, MAX(label) AS label, MAX(target) AS target, SUM(total) AS clicks FROM homepage_interactions WHERE " + where + " AND kind = 'click' GROUP BY day, section, element_key ORDER BY day DESC, clicks DESC LIMIT 500"),
    query("SELECT device, SUM(CASE WHEN kind = 'click' THEN total ELSE 0 END) AS clicks, SUM(CASE WHEN kind = 'view' THEN total ELSE 0 END) AS views FROM homepage_interactions WHERE " + where + " GROUP BY device"),
    query("SELECT element_key AS milestone, SUM(total) AS visits FROM homepage_interactions WHERE " + where + " AND kind = 'scroll' GROUP BY element_key")
  ]);
  const count = kind => Number(totals.find(row => row.kind === kind)?.total || 0);
  return {days, device, timezone:'America/Belem', start, end:belemDay(), clicks:count('click'), views:count('view'), daily, sections, elements, devices, scroll:[25,50,75,100].map(percent => ({percent,visits:Number(scroll.find(row => row.milestone === 'scroll-' + percent)?.visits || 0)}))};
}
