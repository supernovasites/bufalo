CREATE TABLE IF NOT EXISTS mkt_activity (id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL, email TEXT NOT NULL, type TEXT NOT NULL, occurred_at INTEGER NOT NULL, received_at INTEGER NOT NULL, detail TEXT NOT NULL DEFAULT '');
CREATE INDEX IF NOT EXISTS mkt_activity_campaign ON mkt_activity(campaign_id,email,type);
CREATE INDEX IF NOT EXISTS mkt_activity_time ON mkt_activity(campaign_id,occurred_at);
CREATE TABLE IF NOT EXISTS mkt_archived_templates (template_id TEXT PRIMARY KEY, archived_at INTEGER NOT NULL);
