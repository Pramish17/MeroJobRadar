import { randomUUID } from 'crypto';
import { extractTags } from '../utils/tagExtractor.js';

const REMOTEOK_API = 'https://remoteok.com/api';

// Only keep tech-relevant tags
const TECH_TAGS = new Set([
  'software', 'engineer', 'developer', 'dev', 'backend', 'frontend', 'fullstack',
  'full-stack', 'devops', 'cloud', 'data', 'python', 'javascript', 'typescript',
  'java', 'golang', 'go', 'rust', 'node', 'react', 'vue', 'angular', 'aws',
  'gcp', 'azure', 'kubernetes', 'docker', 'terraform', 'sre', 'platform',
  'infrastructure', 'security', 'qa', 'mobile', 'ios', 'android', 'api',
  'database', 'postgres', 'mysql', 'mongodb',
]);

function isTechJob(tags = []) {
  return tags.some((t) => TECH_TAGS.has(t.toLowerCase()));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatSalary(min, max) {
  if (!min && !max) return 'Competitive';
  const fmt = (n) => `$${Math.round(n).toLocaleString()}`;
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
  const tags = extractTags(raw.position || '', description);

  return {
    id: randomUUID(),
    externalId: String(raw.id),
    title: raw.position || 'Untitled',
    company: raw.company || 'Unknown Company',
    location: raw.location || 'Remote (Worldwide)',
    salary: formatSalary(raw.salary_min, raw.salary_max),
    salaryMin: raw.salary_min || null,
    salaryMax: raw.salary_max || null,
    description,
    url: raw.url || `https://remoteok.com/remote-jobs/${raw.slug}`,
    source: 'remoteok',
    tags,
    sponsorship: false,
    type: 'Full-time',
    postedDate: parsePostedDate(raw.date),
    fetchedDate: new Date().toISOString(),
  };
}

export async function scrapeRemoteOk() {
  try {
    console.log('[RemoteOK] Fetching jobs...');

    const res = await fetch(REMOTEOK_API, {
      headers: { 'User-Agent': 'MeroJobRadar/1.0' },
    });

    if (!res.ok) {
      console.error(`[RemoteOK] HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();

    // First element is a legal notice object, not a job
    const jobs = data
      .filter((item) => item.id && item.position)
      .filter((item) => isTechJob(item.tags || []));

    const normalized = jobs.map(normalizeJob);
    console.log(`[RemoteOK] Scrape complete. ${normalized.length} tech jobs.`);
    return normalized;
  } catch (err) {
    console.error(`[RemoteOK] Error: ${err.message}`);
    return [];
  }
}
