CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT DEFAULT 'London',
  salary TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  description TEXT,
  url TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('reed', 'adzuna')),
  tags TEXT,
  sponsorship INTEGER DEFAULT 0,
  type TEXT DEFAULT 'Full-time',
  posted_date TEXT,
  fetched_date TEXT NOT NULL,
  saved INTEGER DEFAULT 0,
  UNIQUE(external_id, source)
);

CREATE INDEX IF NOT EXISTS idx_posted ON jobs(posted_date);
CREATE INDEX IF NOT EXISTS idx_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_sponsorship ON jobs(sponsorship);
CREATE INDEX IF NOT EXISTS idx_saved ON jobs(saved);
CREATE INDEX IF NOT EXISTS idx_company ON jobs(company);
