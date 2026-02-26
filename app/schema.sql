CREATE TABLE shares (
  id SERIAL PRIMARY KEY,
  share_key TEXT UNIQUE NOT NULL,
  repo_full_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_shares_key ON shares(share_key);
