CREATE TABLE IF NOT EXISTS live_raffle (
  id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL DEFAULT 0,
  participants TEXT NOT NULL DEFAULT '[]', candidate TEXT,
  winners TEXT NOT NULL DEFAULT '[]'
);
INSERT OR IGNORE INTO live_raffle(id) VALUES(1);
