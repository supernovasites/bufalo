CREATE TABLE IF NOT EXISTS live_challenge_coupons (
  id INTEGER PRIMARY KEY CHECK(id=1),
  tote TEXT NOT NULL,
  nag TEXT NOT NULL,
  outdoor TEXT NOT NULL,
  mestre TEXT NOT NULL
);
