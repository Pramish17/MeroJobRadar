import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const DB_PATH = join(DATA_DIR, 'jobs.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

let db;

export function getDb() {
  if (!db) {
    mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');

    const schema = readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);
    runMigrations(db);
    console.log('[DB] Initialized at', DB_PATH);
  }
  return db;
}

function runMigrations(db) {
  const tableInfo = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='jobs'`).get();
  if (tableInfo?.sql?.includes("CHECK(source IN")) {
    console.log('[DB] Migrating: removing restrictive source CHECK constraint...');
    db.exec(`
      CREATE TABLE jobs_new (
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
        source TEXT NOT NULL,
        tags TEXT,
        sponsorship INTEGER DEFAULT 0,
        type TEXT DEFAULT 'Full-time',
        posted_date TEXT,
        fetched_date TEXT NOT NULL,
        saved INTEGER DEFAULT 0,
        UNIQUE(external_id, source)
      );
      INSERT OR IGNORE INTO jobs_new SELECT * FROM jobs;
      DROP TABLE jobs;
      ALTER TABLE jobs_new RENAME TO jobs;
      CREATE INDEX IF NOT EXISTS idx_posted ON jobs(posted_date);
      CREATE INDEX IF NOT EXISTS idx_source ON jobs(source);
      CREATE INDEX IF NOT EXISTS idx_sponsorship ON jobs(sponsorship);
      CREATE INDEX IF NOT EXISTS idx_saved ON jobs(saved);
      CREATE INDEX IF NOT EXISTS idx_company ON jobs(company);
    `);
    console.log('[DB] Migration complete.');
  }
}

export function insertJob(job) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO jobs (
      id, external_id, title, company, location,
      salary, salary_min, salary_max, description, url,
      source, tags, sponsorship, type, posted_date, fetched_date, saved
    ) VALUES (
      @id, @externalId, @title, @company, @location,
      @salary, @salaryMin, @salaryMax, @description, @url,
      @source, @tags, @sponsorship, @type, @postedDate, @fetchedDate, 0
    )
  `);

  const result = stmt.run({
    ...job,
    tags: Array.isArray(job.tags) ? JSON.stringify(job.tags) : job.tags,
    sponsorship: job.sponsorship ? 1 : 0,
  });

  return result.changes > 0;
}

export function getJobs({ search, source, location, sponsorship, dateFrom, saved, page = 1, limit = 30 } = {}) {
  const db = getDb();

  const conditions = [];
  const params = {};

  if (search && search.trim()) {
    conditions.push(`(
      title LIKE @search OR
      company LIKE @search OR
      tags LIKE @search
    )`);
    params.search = `%${search.trim()}%`;
  }

  if (source && source !== 'all') {
    conditions.push(`source = @source`);
    params.source = source;
  }

  if (location && location !== 'all') {
    conditions.push(`location LIKE @location`);
    params.location = `%${location}%`;
  }

  if (sponsorship === true || sponsorship === 'true') {
    conditions.push(`sponsorship = 1`);
  }

  if (dateFrom) {
    conditions.push(`posted_date >= @dateFrom`);
    params.dateFrom = dateFrom;
  }

  if (saved === true || saved === 'true') {
    conditions.push(`saved = 1`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM jobs ${where}`).get(params);
  const total = countRow.total;

  const offset = (page - 1) * limit;
  const jobs = db.prepare(`
    SELECT * FROM jobs ${where}
    ORDER BY posted_date DESC, fetched_date DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset });

  return {
    jobs: jobs.map(parseJobRow),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export function getJobById(id) {
  const db = getDb();
  const job = db.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id);
  return job ? parseJobRow(job) : null;
}

export function toggleSaveJob(id) {
  const db = getDb();
  const job = db.prepare(`SELECT saved FROM jobs WHERE id = ?`).get(id);
  if (!job) return null;

  const newState = job.saved ? 0 : 1;
  db.prepare(`UPDATE jobs SET saved = ? WHERE id = ?`).run(newState, id);
  return newState === 1;
}

export function getStats() {
  const db = getDb();

  const total = db.prepare(`SELECT COUNT(*) as count FROM jobs`).get().count;
  const sponsors = db.prepare(`SELECT COUNT(*) as count FROM jobs WHERE sponsorship = 1`).get().count;

  const today = new Date().toISOString().split('T')[0];
  const todayJobs = db.prepare(`SELECT COUNT(*) as count FROM jobs WHERE posted_date = ?`).get(today).count;

  const bySource = db.prepare(`
    SELECT source, COUNT(*) as count FROM jobs GROUP BY source
  `).all();

  return { total, sponsors, today: todayJobs, bySource };
}

export function updateSponsorships(checkFn) {
  const db = getDb();
  // Fetch id, company, description so checkFn can do both register + keyword matching
  const jobs = db.prepare(`SELECT id, company, description FROM jobs`).all();

  const updateStmt = db.prepare(`UPDATE jobs SET sponsorship = ? WHERE id = ?`);

  const updateAll = db.transaction(() => {
    let sponsored = 0;
    for (const { id, company, description } of jobs) {
      const isSponsored = checkFn(company, description) ? 1 : 0;
      updateStmt.run(isSponsored, id);
      if (isSponsored) sponsored++;
    }
    return sponsored;
  });

  return updateAll();
}

export function cleanOldJobs(days = 30) {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const result = db.prepare(`DELETE FROM jobs WHERE posted_date < ? AND saved = 0`).run(cutoffStr);
  return result.changes;
}

function parseJobRow(row) {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    sponsorship: row.sponsorship === 1,
    saved: row.saved === 1,
  };
}
