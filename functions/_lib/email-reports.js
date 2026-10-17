export const reportSchema = `CREATE TABLE IF NOT EXISTS mkt_activity (id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL, email TEXT NOT NULL, type TEXT NOT NULL, occurred_at INTEGER NOT NULL, received_at INTEGER NOT NULL, detail TEXT NOT NULL DEFAULT '');
CREATE INDEX IF NOT EXISTS mkt_activity_campaign ON mkt_activity(campaign_id,email,type);
CREATE INDEX IF NOT EXISTS mkt_activity_time ON mkt_activity(campaign_id,occurred_at);
CREATE TABLE IF NOT EXISTS mkt_archived_templates (template_id TEXT PRIMARY KEY, archived_at INTEGER NOT NULL);
`;

const activity = `SELECT campaign_id,email,
 MIN(CASE WHEN type='accepted' THEN occurred_at END) AS accepted_at,
 MIN(CASE WHEN type='email.delivered' THEN occurred_at END) AS delivered_at,
 MIN(CASE WHEN type='email.opened' THEN occurred_at END) AS opened_at,
 MIN(CASE WHEN type='email.clicked' THEN occurred_at END) AS clicked_at,
 MAX(CASE WHEN type='email.delivery_delayed' THEN occurred_at END) AS delayed_at,
 SUM(CASE WHEN type='email.opened' THEN 1 ELSE 0 END) AS opens,
 SUM(CASE WHEN type='email.clicked' THEN 1 ELSE 0 END) AS clicks,
 MAX(occurred_at) AS last_event_at FROM mkt_activity GROUP BY campaign_id,email`;
const recipients = `SELECT r.*,c.status AS contact_status,a.accepted_at,a.delivered_at,a.opened_at,a.clicked_at,a.delayed_at,
 COALESCE(a.opens,0) AS opens,COALESCE(a.clicks,0) AS clicks,a.last_event_at
 FROM mkt_recipients r JOIN mkt_contacts c ON c.email=r.email
 LEFT JOIN (${activity}) a ON a.campaign_id=r.campaign_id AND a.email=r.email`;
const metrics = `COUNT(*) AS total,
 SUM(CASE WHEN provider_id IS NOT NULL THEN 1 ELSE 0 END) AS sent,
 SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
 SUM(CASE WHEN delivered_at IS NOT NULL OR status='delivered' THEN 1 ELSE 0 END) AS delivered,
 SUM(CASE WHEN status='accepted' THEN 1 ELSE 0 END) AS awaiting,
 SUM(CASE WHEN status='bounced' THEN 1 ELSE 0 END) AS bounced,
 SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed,
 SUM(CASE WHEN status='complained' THEN 1 ELSE 0 END) AS complained,
 SUM(CASE WHEN status='skipped' THEN 1 ELSE 0 END) AS skipped,
 SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) AS opened,
 SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) AS clicked,
 SUM(CASE WHEN delayed_at IS NOT NULL AND status='accepted' THEN 1 ELSE 0 END) AS delayed,
 SUM(CASE WHEN contact_status='unsubscribed' THEN 1 ELSE 0 END) AS unsubscribed,
 SUM(opens) AS opens,SUM(clicks) AS clicks,MAX(last_event_at) AS last_event_at`;
const cleanMetrics = row => Object.fromEntries(Object.entries(row).map(([k,v])=>[k,v??0]));
export async function overview(db) {
  const campaigns=(await db.prepare(`SELECT c.id,c.name,c.status,c.created_at,c.updated_at,l.name AS list_name,m.*
    FROM mkt_campaigns c LEFT JOIN mkt_lists l ON l.id=c.list_id
    LEFT JOIN (SELECT campaign_id,${metrics} FROM (${recipients}) GROUP BY campaign_id) m ON m.campaign_id=c.id
    ORDER BY c.created_at DESC LIMIT 100`).all()).results;
  const totals=cleanMetrics(await db.prepare(`SELECT ${metrics} FROM (${recipients})`).first());
  return {campaigns:campaigns.map(c=>({...c,total:c.total||0})),totals,updatedAt:Date.now()};
}
export async function report(db,id,params) {
  const campaign=await db.prepare('SELECT c.id,c.name,c.status,c.created_at,c.updated_at,c.content,l.name AS list_name FROM mkt_campaigns c LEFT JOIN mkt_lists l ON l.id=c.list_id WHERE c.id=?').bind(id).first();
  if(!campaign)return null;
  campaign.subject=JSON.parse(campaign.content).subject;delete campaign.content;
  const totals=cleanMetrics(await db.prepare(`SELECT ${metrics} FROM (${recipients}) WHERE campaign_id=?`).bind(id).first());
  const filters={pending:"status='pending'",accepted:"status='accepted'",delivered:"(delivered_at IS NOT NULL OR status='delivered')",bounced:"status='bounced'",failed:"status='failed'",complained:"status='complained'",skipped:"status='skipped'",opened:'opened_at IS NOT NULL',clicked:'clicked_at IS NOT NULL',unsubscribed:"contact_status='unsubscribed'"};
  const filter=params.get('status')||'',search=(params.get('search')||'').trim().slice(0,150);
  const page=Math.max(1,Math.min(100,parseInt(params.get('page'),10)||1)),size=50;
  let where='campaign_id=?',values=[id];
  if(filters[filter])where+=' AND '+filters[filter];
  if(search){where+=" AND (instr(lower(email),lower(?))>0 OR instr(lower(name),lower(?))>0)";values.push(search,search);}
  const {count}=await db.prepare(`SELECT COUNT(*) AS count FROM (${recipients}) WHERE ${where}`).bind(...values).first();
  const rows=(await db.prepare(`SELECT * FROM (${recipients}) WHERE ${where} ORDER BY email LIMIT ? OFFSET ?`).bind(...values,size,(page-1)*size).all()).results;
  const daily=(await db.prepare(`SELECT date(occurred_at/1000,'unixepoch','-3 hours') AS day,
    COUNT(DISTINCT CASE WHEN type='accepted' THEN email END) AS sent,
    COUNT(DISTINCT CASE WHEN type='email.delivered' THEN email END) AS delivered,
    COUNT(DISTINCT CASE WHEN type='email.opened' THEN email END) AS opened,
    COUNT(DISTINCT CASE WHEN type='email.clicked' THEN email END) AS clicked
    FROM mkt_activity WHERE campaign_id=? GROUP BY day ORDER BY day DESC LIMIT 30`).bind(id).all()).results.reverse();
  const links=(await db.prepare("SELECT detail AS url,COUNT(*) AS clicks,COUNT(DISTINCT email) AS people FROM mkt_activity WHERE campaign_id=? AND type='email.clicked' AND detail<>'' GROUP BY detail ORDER BY clicks DESC LIMIT 10").bind(id).all()).results;
  return {campaign,totals,recipients:rows,page,pages:Math.ceil(count/size),matched:count,daily,links,updatedAt:Date.now()};
}
