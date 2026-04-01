import { randomUUID } from 'crypto';
import { extractTags } from '../utils/tagExtractor.js';

const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs/gb/search/1';
const KEYWORDS = [
  'software engineer',
  'java developer',
  'backend engineer',
  'cloud engineer',
  'devops engineer',
  'data engineer',
  'full stack developer',
  'QA engineer',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);

      if (res.status === 429) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`[Adzuna] Rate limited. Waiting ${delay}ms before retry ${attempt}/${retries}`);
        await sleep(delay);
        continue;
      }

      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`[Adzuna] Request failed (attempt ${attempt}/${retries}): ${err.message}. Retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new Error(`[Adzuna] Failed after ${retries} attempts`);
}

function formatSalary(min, max) {
  if (!min && !max) return 'Competitive';
  const fmt = (n) => `£${Math.round(n).toLocaleString()}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  return min ? `From ${fmt(min)}` : `Up to ${fmt(max)}`;
}

function parsePostedDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function normalizeJob(raw) {
  const description = raw.description || '';
  const tags = extractTags(raw.title || '', description);

  // Determine contract type
  let type = 'Full-time';
  if (raw.contract_time === 'part_time') type = 'Part-time';
  else if (raw.contract_type === 'contract') type = 'Contract';
  else if (raw.contract_type === 'permanent') type = 'Full-time';

  return {
    id: randomUUID(),
    externalId: String(raw.id),
    title: raw.title || 'Untitled',
    company: raw.company?.display_name || 'Unknown Company',
    location: raw.location?.display_name || 'London',
    salary: formatSalary(raw.salary_min, raw.salary_max),
    salaryMin: raw.salary_min ? Math.round(raw.salary_min) : null,
    salaryMax: raw.salary_max ? Math.round(raw.salary_max) : null,
    description,
    url: raw.redirect_url || raw.id,
    source: 'adzuna',
    tags,
    sponsorship: false,
    type,
    postedDate: parsePostedDate(raw.created),
    fetchedDate: new Date().toISOString(),
  };
}

export async function scrapeAdzuna() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.warn('[Adzuna] ADZUNA_APP_ID or ADZUNA_APP_KEY not set. Skipping Adzuna scraper.');
    return [];
  }

  const allJobs = [];
  const seenIds = new Set();

  for (const keyword of KEYWORDS) {
    try {
      const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        results_per_page: '50',
        what: keyword,
        where: 'london',
        sort_by: 'date',
      });

      const url = `${ADZUNA_BASE}?${params}`;
      console.log(`[Adzuna] Fetching: "${keyword}"`);

      const res = await fetchWithRetry(url);

      if (!res.ok) {
        console.error(`[Adzuna] HTTP ${res.status} for keyword "${keyword}"`);
        await sleep(1000);
        continue;
      }

      const data = await res.json();
      const results = data.results || [];

      for (const raw of results) {
        if (!seenIds.has(raw.id)) {
          seenIds.add(raw.id);
          allJobs.push(normalizeJob(raw));
        }
      }

      console.log(`[Adzuna] "${keyword}" → ${results.length} results (${allJobs.length} total so far)`);
    } catch (err) {
      console.error(`[Adzuna] Error fetching "${keyword}": ${err.message}`);
    }

    await sleep(1000);
  }

  console.log(`[Adzuna] Scrape complete. Total unique jobs: ${allJobs.length}`);
  return allJobs;
}
