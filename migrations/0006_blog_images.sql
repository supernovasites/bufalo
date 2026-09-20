CREATE TABLE IF NOT EXISTS blog_images (
  id TEXT PRIMARY KEY,
  data BLOB NOT NULL,
  content_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);
