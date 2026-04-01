import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const CACHE_PATH = join(DATA_DIR, 'sponsors.json');

// In-memory set of lowercased sponsor names
let sponsorSet = null;
let lastFetchedAt = null;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

function loadFromCache() {
  if (!existsSync(CACHE_PATH)) return null;
  try {
    const data = JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
    return data;
  } catch {
    return null;
  }
}

function saveToCache(names, fetchedAt) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify({ names, fetchedAt }), 'utf8');
}

async function resolveLatestCsvUrl() {
  // Use the GOV.UK Content API (JSON) — more reliable than HTML scraping
  const apiUrl = 'https://www.gov.uk/api/content/government/publications/register-of-licensed-sponsors-workers';
  const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GOV.UK Content API error: HTTP ${res.status}`);

  const data = await res.json();

  // details.documents is an array of HTML strings, each containing an attachment link
  const docs = data.details?.documents ?? [];
  const CSV_RE = /https:\/\/assets\.publishing\.service\.gov\.uk\/[^\s"'<>]+Worker[^\s"'<>]*\.csv/i;

  for (const doc of docs) {
    const match = doc.match(CSV_RE);
    if (match) return match[0];
  }

  throw new Error('Could not find Worker and Temporary Worker CSV in GOV.UK API response');
}

async function downloadAndParse() {
  console.log('[Sponsors] Downloading UK visa sponsor register...');

  const csvUrl = await resolveLatestCsvUrl();
  console.log(`[Sponsors] Resolved CSV URL: ${csvUrl}`);

  const res = await fetch(csvUrl);

  if (!res.ok) {
    throw new Error(`Failed to download sponsor CSV: HTTP ${res.status}`);
  }

  const csvText = await res.text();

  // csv-parse/sync
  const records = parse(csvText, {
    skip_empty_lines: true,
    trim: true,
    from_line: 2, // skip header row
  });

  // First column is the organisation name
  const names = records
    .map((row) => row[0])
    .filter(Boolean)
    .map((name) => name.toLowerCase().trim());

  console.log(`[Sponsors] Parsed ${names.length} sponsor companies.`);
  return names;
}

export async function loadSponsorList() {
  const now = Date.now();
  const cached = loadFromCache();

  if (cached && cached.fetchedAt && now - cached.fetchedAt < CACHE_TTL_MS) {
    sponsorSet = new Set(cached.names);
    lastFetchedAt = cached.fetchedAt;
    console.log(`[Sponsors] Loaded ${sponsorSet.size} sponsors from cache.`);
    return;
  }

  try {
    const names = await downloadAndParse();
    sponsorSet = new Set(names);
    lastFetchedAt = now;
    saveToCache(names, now);
    console.log(`[Sponsors] Sponsor list refreshed. ${sponsorSet.size} companies cached.`);
  } catch (err) {
    console.error(`[Sponsors] Failed to download sponsor list: ${err.message}`);
    // Fall back to cached data even if stale
    if (cached && cached.names) {
      sponsorSet = new Set(cached.names);
      console.warn(`[Sponsors] Using stale cache with ${sponsorSet.size} entries.`);
    } else {
      sponsorSet = new Set();
      console.warn('[Sponsors] No sponsor data available. All checks will return false.');
    }
  }
}

// Phrases that indicate a job explicitly offers visa sponsorship
const SPONSORSHIP_KEYWORDS = [
  'visa sponsorship', 'visa sponsored', 'sponsor visa', 'sponsoring visa',
  'work permit sponsorship', 'certificate of sponsorship', 'skilled worker visa',
  'global talent visa', 'sponsorship available', 'sponsorship provided',
  'we sponsor', 'will sponsor', 'can sponsor', 'able to sponsor',
  'visa support', 'relocation support', 'right to work sponsorship',
  'h1b', 'h-1b', 'tier 2', 'tier2',
];

/**
 * Check if a job description explicitly mentions visa sponsorship.
 * Works for any country worldwide.
 */
export function checkSponsorshipFromText(description = '') {
  const lower = description.toLowerCase();
  return SPONSORSHIP_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Check if a company is on the UK visa sponsor register.
 * Tries exact match, then stripped suffix match, then substring match.
 */
export function checkSponsorship(companyName) {
  if (!sponsorSet || sponsorSet.size === 0) return false;

  const name = companyName.toLowerCase().trim();

  if (sponsorSet.has(name)) return true;

  const cleaned = name
    .replace(/\s+(ltd|limited|plc|llp|llc|inc|corp|uk|group|holdings?)\.?$/i, '')
    .trim();

  if (cleaned !== name && sponsorSet.has(cleaned)) return true;

  for (const sponsor of sponsorSet) {
    if (sponsor.includes(cleaned) || cleaned.includes(sponsor)) {
      if (cleaned.length >= 4 && sponsor.length >= 4) return true;
    }
  }

  return false;
}

/**
 * Global sponsorship check: UK register match OR explicit mention in description.
 */
export function checkSponsorshipGlobal(companyName, description = '') {
  return checkSponsorship(companyName) || checkSponsorshipFromText(description);
}
