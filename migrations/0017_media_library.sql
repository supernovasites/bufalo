CREATE TABLE IF NOT EXISTS media_files (id TEXT PRIMARY KEY,name TEXT NOT NULL,content_type TEXT NOT NULL,extension TEXT NOT NULL,size INTEGER NOT NULL,data BLOB NOT NULL,created_at INTEGER NOT NULL,deleted_at INTEGER);
CREATE INDEX IF NOT EXISTS media_files_listing ON media_files(deleted_at,created_at);
