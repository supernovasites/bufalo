CREATE TABLE IF NOT EXISTS campaign_settings (slug TEXT PRIMARY KEY, enabled INTEGER NOT NULL CHECK(enabled IN (0,1)));
