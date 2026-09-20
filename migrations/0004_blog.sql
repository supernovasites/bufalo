CREATE TABLE IF NOT EXISTS blog_posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  image TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  post_date TEXT NOT NULL,
  body TEXT NOT NULL,
  source_url TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft','published')),
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS blog_posts_public ON blog_posts(status, post_date DESC);
CREATE TABLE IF NOT EXISTS blog_sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS blog_attempts (client TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires INTEGER NOT NULL);
