import { randomUUID } from 'crypto';
import { extractTags } from '../utils/tagExtractor.js';

const ARBEITNOW_API = 'https://www.arbeitnow.com/api/job-board-api';
const PAGES_TO_FETCH = 5;

// Keywords to match against job titles (case-insensitive)
const TITLE_KEYWORDS = [
  'software', 'developer', 'engineer', 'devops', 'backend', 'frontend',
  'full stack', 'fullstack', 'cloud', 'data', 'qa', 'quality assurance',
  'site reliability', 'sre', 'platform', 'infrastructure',
];

// Location strings that indicate a job is UK-relevant
const UK_LOCATION_KEYWORDS = [
  'uk', 'united kingdom', 'britain', 'england', 'london', 'manchester',
  'birmingham', 'glasgow', 'edinburgh', 'cardiff', 'belfast', 'leeds',
  'bristol', 'remote', 'worldwide', 'global', 'europe',
];

function isUkRelevant(location = '', remote = false) {
  if (remote) return true;
  if (!location) return false;
  const lower = location.toLowerCase();
  return UK_LOCATION_KEYWORDS.some((kw) => lower.includes(kw));
}

function isTechJob(title = '') {
  const lower = title.toLowerCase();
  return TITLE_KEYWORDS.some((kw) => lower.includes(kw));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePostedDate(createdAt) {
  if (!createdAt) return new Date().toISOString().split('T')[0];
  try {
    // createdAt is a Unix timestamp (seconds)
    return new Date(createdAt * 1000).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function normalizeJob(raw) {
  const description = raw.description || '';
  const tags = extractTags(raw.title || '', description);

  const jobTypes = raw.job_types || [];
  let type = 'Full-time';
  if (jobTypes.some((t) => t.toLowerCase().includes('contract'))) type = 'Contract';
  else if (jobTypes.some((t) => t.toLowerCase().includes('part'))) type = 'Part-time';
  else if (jobTypes.some((t) => t.toLowerCase().includes('freelance'))) type = 'Contract';

  const location = raw.remote
    ? `${raw.location || 'Remote'} (Remote)`
    : (raw.location || 'United Kingdom');

  return {
    id: randomUUID(),
    externalId: raw.slug,
    title: raw.title || 'Untitled',
    company: raw.company_name || 'Unknown Company',
    location,
    salary: 'Competitive',
    salaryMin: null,
    salaryMax: null,
    description,
    url: raw.url || `https://www.arbeitnow.com/jobs/${raw.slug}`,
    source: 'arbeitnow',
    tags,
    sponsorship: false,
    type,
    postedDate: parsePostedDate(raw.created_at),
    fetchedDate: new Date().toISOString(),
  };
}

export async function scrapeArbeitnow() {
  const allJobs = [];
  const seenIds = new Set();

  for (let page = 1; page <= PAGES_TO_FETCH; page++) {
    try {
      console.log(`[Arbeitnow] Fetching page ${page}/${PAGES_TO_FETCH}`);

      const params = new URLSearchParams({ page: String(page) });
      const res = await fetch(`${ARBEITNOW_API}?${params}`);

      if (!res.ok) {
        console.error(`[Arbeitnow] HTTP ${res.status} on page ${page}`);
        await sleep(1000);
        continue;
      }

      const data = await res.json();
      const results = data.data || [];

      if (results.length === 0) break;

      let added = 0;
      for (const raw of results) {
        if (seenIds.has(raw.slug)) continue;
        if (!isTechJob(raw.title)) continue;
        if (!isUkRelevant(raw.location, raw.remote)) continue;

        seenIds.add(raw.slug);
        allJobs.push(normalizeJob(raw));
        added++;
      }

      console.log(`[Arbeitnow] Page ${page} → ${results.length} total, ${added} UK tech jobs added (${allJobs.length} so far)`);
    } catch (err) {
      console.error(`[Arbeitnow] Error on page ${page}: ${err.message}`);
    }

    await sleep(800);
  }

  console.log(`[Arbeitnow] Scrape complete. Total UK tech jobs: ${allJobs.length}`);
  return allJobs;
}
