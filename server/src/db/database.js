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
    console.log('[DB] Initialized at', DB_PATH);
  }
  return db;
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

export function getJobs({ search, source, sponsorship, dateFrom, saved, page = 1, limit = 30 } = {}) {
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

  // Get today's date in Europe/London timezone as YYYY-MM-DD
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
  const todayJobs = db.prepare(`SELECT COUNT(*) as count FROM jobs WHERE posted_date = ?`).get(today).count;

  const bySource = db.prepare(`
    SELECT source, COUNT(*) as count FROM jobs GROUP BY source
  `).all();

  return { total, sponsors, today: todayJobs, bySource };
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
