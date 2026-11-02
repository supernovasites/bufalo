// Contadores agregados da homepage. Nao guardar IP, cookies, CPF ou consultas.
export const homeAnalyticsSchema = "CREATE TABLE IF NOT EXISTS homepage_interactions (day TEXT NOT NULL, device TEXT NOT NULL, kind TEXT NOT NULL, section TEXT NOT NULL, element_key TEXT NOT NULL, label TEXT NOT NULL, target TEXT NOT NULL DEFAULT '', total INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day,device,kind,section,element_key))";
export const homeAnalyticsMigration = "CREATE INDEX IF NOT EXISTS homepage_interactions_day_kind ON homepage_interactions(day,kind)";
let initialized;
export async function ensureHomepageStats(db) {
  if (!initialized) initialized = (async () => {
    await db.prepare(homeAnalyticsSchema).run();
    await db.prepare(homeAnalyticsMigration).run();
    await db.prepare("CREATE TABLE IF NOT EXISTS site_scroll_sections (page TEXT NOT NULL,device TEXT NOT NULL,percent INTEGER NOT NULL,label TEXT NOT NULL,day TEXT NOT NULL,PRIMARY KEY(page,device,percent))").run();
    await db.prepare("CREATE TABLE IF NOT EXISTS site_interactions (page TEXT NOT NULL,day TEXT NOT NULL,device TEXT NOT NULL,kind TEXT NOT NULL,section TEXT NOT NULL,element_key TEXT NOT NULL,label TEXT NOT NULL,target TEXT NOT NULL DEFAULT '',total INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(page,day,device,kind,section,element_key))").run();
    await db.prepare("CREATE INDEX IF NOT EXISTS site_interactions_day_page ON site_interactions(day,page)").run();
    await db.prepare("CREATE TABLE IF NOT EXISTS site_scroll_users (page TEXT NOT NULL,visitor TEXT NOT NULL,day TEXT NOT NULL,device TEXT NOT NULL,percent INTEGER NOT NULL CHECK(percent IN (25,50,75,100)),PRIMARY KEY(page,visitor))").run();
    await db.prepare("CREATE TABLE IF NOT EXISTS homepage_scroll_users (visitor TEXT PRIMARY KEY, day TEXT NOT NULL, device TEXT NOT NULL, percent INTEGER NOT NULL CHECK(percent IN (25,50,75,100)))").run();
    await db.prepare("INSERT OR IGNORE INTO site_scroll_users SELECT '/',visitor,day,device,percent FROM homepage_scroll_users").run();
  })().catch(error => { initialized = null; throw error; });
  return initialized;
}
export function belemDay(date = Date.now()) {
  return new Date(date - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
export async function homepageStats(db, days, device, page = '/') {
  await ensureHomepageStats(db);
  const start = belemDay(Date.now() - (days - 1) * 86400000);
  const where = "day >= ? AND (? = 'all' OR device = ?) AND (? = 'all' OR page = ?)";
  const source = "(SELECT page,day,device,kind,section,element_key,label,target,total FROM site_interactions UNION ALL SELECT '/' AS page,day,device,kind,section,element_key,label,target,total FROM homepage_interactions)";

  const query = (sql, extra = []) => db.prepare(sql).bind(start, device, device, page, page, ...extra).all().then(out => out.results || []);
  const [totals, daily, sections, elements, devices, scroll, products, pages, scrollSections] = await Promise.all([
    query("SELECT kind, SUM(total) AS total FROM " + source + " WHERE " + where + " GROUP BY kind"),
    query("SELECT day, SUM(CASE WHEN kind = 'click' THEN total ELSE 0 END) AS clicks, SUM(CASE WHEN kind = 'view' THEN total ELSE 0 END) AS views FROM " + source + " WHERE " + where + " GROUP BY day ORDER BY day"),
    query("SELECT section, SUM(total) AS clicks FROM " + source + " WHERE " + where + " AND kind = 'click' GROUP BY section ORDER BY clicks DESC LIMIT 40"),
    query("SELECT page, day, section, element_key AS element, MAX(label) AS label, MAX(target) AS target, SUM(total) AS clicks FROM " + source + " WHERE " + where + " AND kind = 'click' GROUP BY page, day, section, element_key ORDER BY day DESC, clicks DESC LIMIT 500"),
    query("SELECT device, SUM(CASE WHEN kind = 'click' THEN total ELSE 0 END) AS clicks, SUM(CASE WHEN kind = 'view' THEN total ELSE 0 END) AS views FROM " + source + " WHERE " + where + " GROUP BY device"),
    query("SELECT percent, COUNT(*) AS visits FROM site_scroll_users WHERE " + where + " GROUP BY percent"),
    query("SELECT target, MAX(label) AS label, SUM(total) AS clicks FROM " + source + " WHERE " + where + " AND kind = 'product' GROUP BY target ORDER BY clicks DESC, target LIMIT 5"),
    db.prepare("SELECT page,SUM(CASE WHEN kind = 'view' THEN total ELSE 0 END) AS views,SUM(CASE WHEN kind = 'click' THEN total ELSE 0 END) AS clicks FROM " + source + " WHERE day >= ? AND (? = 'all' OR device = ?) GROUP BY page ORDER BY views DESC,page").bind(start,device,device).all().then(out=>out.results || []),
    query("SELECT percent,label,device FROM site_scroll_sections WHERE " + where + " ORDER BY device")
  ]);
  const count = kind => Number(totals.find(row => row.kind === kind)?.total || 0);
  return {days, device, page, pages, timezone:'America/Belem', start, end:belemDay(), clicks:count('click'), views:count('view'), daily, sections, elements, devices, topProducts:products, topProduct:products[0] || null, scroll:[25,50,75,100].map(percent => ({percent,sections:[...new Set(scrollSections.filter(row=>Number(row.percent)===percent).map(row=>row.label))],visits:Number(scroll.find(row => Number(row.percent) === percent)?.visits || 0)}))};
}
