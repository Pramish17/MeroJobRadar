import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const CACHE_PATH = join(DATA_DIR, 'sponsors.json');

const SPONSOR_CSV_URL =
  'https://assets.publishing.service.gov.uk/media/67c5880ce2fb1b24a76c3683/2025-03-03_-_Worker_and_Temporary_Worker.csv';

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

async function downloadAndParse() {
  console.log('[Sponsors] Downloading UK visa sponsor register...');
  const res = await fetch(SPONSOR_CSV_URL);

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

/**
 * Check if a company is likely a UK visa sponsor.
 * Tries exact match first, then substring match.
 */
export function checkSponsorship(companyName) {
  if (!sponsorSet || sponsorSet.size === 0) return false;

  const name = companyName.toLowerCase().trim();

  // Exact match
  if (sponsorSet.has(name)) return true;

  // Strip common suffixes for a cleaner match
  const cleaned = name
    .replace(/\s+(ltd|limited|plc|llp|llc|inc|corp|uk|group|holdings?)\.?$/i, '')
    .trim();

  if (cleaned !== name && sponsorSet.has(cleaned)) return true;

  // Partial match: sponsor name contains company or vice versa
  for (const sponsor of sponsorSet) {
    if (sponsor.includes(cleaned) || cleaned.includes(sponsor)) {
      // Avoid false positives from very short strings
      if (cleaned.length >= 4 && sponsor.length >= 4) {
        return true;
      }
    }
  }

  return false;
}
