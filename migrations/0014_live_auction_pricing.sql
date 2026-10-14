CREATE TABLE IF NOT EXISTS live_auction_pricing (id INTEGER PRIMARY KEY CHECK(id=1), start_cents INTEGER NOT NULL DEFAULT 0 CHECK(start_cents BETWEEN 0 AND 10000000000));
INSERT OR IGNORE INTO live_auction_pricing(id,start_cents) VALUES(1,0);
