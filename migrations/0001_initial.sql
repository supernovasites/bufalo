CREATE TABLE media (id TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, filename TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE banners (id TEXT PRIMARY KEY, title TEXT NOT NULL, alt TEXT NOT NULL, desktop TEXT NOT NULL, mobile TEXT, target TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0, position INTEGER NOT NULL DEFAULT 0, starts_at TEXT, ends_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE sessions (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, last_seen TEXT NOT NULL, source TEXT NOT NULL, medium TEXT NOT NULL, campaign TEXT NOT NULL, referrer TEXT NOT NULL, device TEXT NOT NULL, country TEXT NOT NULL, landing TEXT NOT NULL);
CREATE TABLE events (id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id), type TEXT NOT NULL CHECK(type IN ('page_view','banner_view','banner_click','outbound_click')), page TEXT NOT NULL, banner_id TEXT, label TEXT NOT NULL, destination TEXT NOT NULL, view_id TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE UNIQUE INDEX event_dedup ON events(session_id,view_id,type,COALESCE(banner_id,''),label);
CREATE INDEX event_date ON events(created_at,type);
CREATE INDEX session_date ON sessions(created_at);
CREATE INDEX banner_order ON banners(archived,active,position);
CREATE TABLE audit (id TEXT PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL, created_at TEXT NOT NULL);
