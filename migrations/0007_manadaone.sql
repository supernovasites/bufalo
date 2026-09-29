CREATE TABLE IF NOT EXISTS manadaone_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  enabled INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO manadaone_settings (id, enabled) VALUES (1, 1);

CREATE TABLE IF NOT EXISTS manadaone_sessions (
  token TEXT PRIMARY KEY,
  expires INTEGER NOT NULL
);