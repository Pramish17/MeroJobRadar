import { randomUUID } from 'crypto';
import { extractTags } from '../utils/tagExtractor.js';

const REMOTIVE_API = 'https://remotive.com/api/remote-jobs';

// Categories relevant to IT jobs
const CATEGORIES = ['software-dev', 'devops-sysadmin', 'data', 'qa'];

// Location strings that indicate a job is open to UK candidates
const UK_RELEVANT_KEYWORDS = ['uk', 'united kingdom', 'britain', 'europe', 'emea', 'worldwide', 'global', 'anywhere'];

function isUkRelevant(locationStr) {
  if (!locationStr || locationStr.trim() === '') return true;
  const lower = locationStr.toLowerCase();
  return UK_RELEVANT_KEYWORDS.some((kw) => lower.includes(kw));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  // Remotive uses job_type like "full_time", "contract", "part_time"
  let type = 'Full-time';
  if (raw.job_type === 'contract') type = 'Contract';
  else if (raw.job_type === 'part_time') type = 'Part-time';
  else if (raw.job_type === 'freelance') type = 'Contract';

  const location = raw.candidate_required_location?.trim() || 'Remote (UK/Europe)';

  return {
    id: randomUUID(),
    externalId: String(raw.id),
    title: raw.title || 'Untitled',
    company: raw.company_name || 'Unknown Company',
    location,
    salary: raw.salary?.trim() || 'Competitive',
    salaryMin: null,
    salaryMax: null,
    description,
    url: raw.url || '',
    source: 'remotive',
    tags,
    sponsorship: false,
    type,
    postedDate: parsePostedDate(raw.publication_date),
    fetchedDate: new Date().toISOString(),
  };
}

export async function scrapeRemotive() {
  const allJobs = [];
  const seenIds = new Set();

  for (const category of CATEGORIES) {
    try {
      console.log(`[Remotive] Fetching category: "${category}"`);

      const params = new URLSearchParams({ category, limit: '100' });
      const res = await fetch(`${REMOTIVE_API}?${params}`);

      if (!res.ok) {
        console.error(`[Remotive] HTTP ${res.status} for category "${category}"`);
        await sleep(1000);
        continue;
      }

      const data = await res.json();
      const results = data.jobs || [];

      let added = 0;
      for (const raw of results) {
        if (seenIds.has(raw.id)) continue;
        if (!isUkRelevant(raw.candidate_required_location)) continue;

        seenIds.add(raw.id);
        allJobs.push(normalizeJob(raw));
        added++;
      }

      console.log(`[Remotive] "${category}" → ${results.length} total, ${added} UK-relevant (${allJobs.length} so far)`);
    } catch (err) {
      console.error(`[Remotive] Error fetching "${category}": ${err.message}`);
    }

    await sleep(1000);
  }

  console.log(`[Remotive] Scrape complete. Total unique UK-relevant jobs: ${allJobs.length}`);
  return allJobs;
}
