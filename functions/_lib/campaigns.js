export const campaignSchema = 'CREATE TABLE IF NOT EXISTS campaign_settings (slug TEXT PRIMARY KEY, enabled INTEGER NOT NULL CHECK(enabled IN (0,1)))';
export async function campaignEnabled(db, slug) {
  if (!db) return true;
  try {
    const row = await db.prepare('SELECT enabled FROM campaign_settings WHERE slug = ?').bind(slug).first();
    return row ? !!row.enabled : true;
  } catch (error) {
    if (String(error.message).includes('no such table: campaign_settings')) return true;
    throw error;
  }
}
