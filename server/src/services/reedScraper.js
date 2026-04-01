import { randomUUID } from 'crypto';
import { extractTags } from '../utils/tagExtractor.js';

const REED_BASE = 'https://www.reed.co.uk/api/1.0';
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

async function fetchWithRetry(url, options, retries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);

      if (res.status === 429) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`[Reed] Rate limited. Waiting ${delay}ms before retry ${attempt}/${retries}`);
        await sleep(delay);
        continue;
      }

      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`[Reed] Request failed (attempt ${attempt}/${retries}): ${err.message}. Retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new Error(`[Reed] Failed after ${retries} attempts`);
}

function formatSalary(min, max, currency = '£') {
  if (!min && !max) return 'Competitive';
  if (min && max) {
    return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
  }
  return min ? `From ${currency}${min.toLocaleString()}` : `Up to ${currency}${max.toLocaleString()}`;
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
  const description = raw.jobDescription || '';
  const tags = extractTags(raw.jobTitle || '', description);

  return {
    id: randomUUID(),
    externalId: String(raw.jobId),
    title: raw.jobTitle || 'Untitled',
    company: raw.employerName || 'Unknown Company',
    location: raw.locationName || 'London',
    salary: formatSalary(raw.minimumSalary, raw.maximumSalary),
    salaryMin: raw.minimumSalary || null,
    salaryMax: raw.maximumSalary || null,
    description,
    url: raw.jobUrl || `https://www.reed.co.uk/jobs/${raw.jobId}`,
    source: 'reed',
    tags,
    sponsorship: false,
    type: raw.contractType || 'Full-time',
    postedDate: parsePostedDate(raw.date),
    fetchedDate: new Date().toISOString(),
  };
}

export async function scrapeReed() {
  const apiKey = process.env.REED_API_KEY;

  if (!apiKey) {
    console.warn('[Reed] REED_API_KEY not set. Skipping Reed scraper.');
    return [];
  }

  const credentials = Buffer.from(`${apiKey}:`).toString('base64');
  const headers = {
    Authorization: `Basic ${credentials}`,
    Accept: 'application/json',
  };

  const allJobs = [];
  const seenIds = new Set();

  for (const keyword of KEYWORDS) {
    try {
      const params = new URLSearchParams({
        keywords: keyword,
        locationName: 'London',
        distanceFromLocation: '15',
        resultsToTake: '50',
      });

      const url = `${REED_BASE}/search?${params}`;
      console.log(`[Reed] Fetching: "${keyword}"`);

      const res = await fetchWithRetry(url, { headers });

      if (!res.ok) {
        console.error(`[Reed] HTTP ${res.status} for keyword "${keyword}"`);
        await sleep(500);
        continue;
      }

      const data = await res.json();
      const results = data.results || [];

      for (const raw of results) {
        if (!seenIds.has(raw.jobId)) {
          seenIds.add(raw.jobId);
          allJobs.push(normalizeJob(raw));
        }
      }

      console.log(`[Reed] "${keyword}" → ${results.length} results (${allJobs.length} total so far)`);
    } catch (err) {
      console.error(`[Reed] Error fetching "${keyword}": ${err.message}`);
    }

    await sleep(500);
  }

  console.log(`[Reed] Scrape complete. Total unique jobs: ${allJobs.length}`);
  return allJobs;
}
