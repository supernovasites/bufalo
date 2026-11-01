-- Relatorio de cliques por elemento da homepage, sem identificadores pessoais.
CREATE TABLE IF NOT EXISTS homepage_interactions (
  day TEXT NOT NULL,
  device TEXT NOT NULL,
  kind TEXT NOT NULL,
  section TEXT NOT NULL,
  element_key TEXT NOT NULL,
  label TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  total INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, device, kind, section, element_key)
);
CREATE INDEX IF NOT EXISTS homepage_interactions_day_kind ON homepage_interactions(day, kind);
