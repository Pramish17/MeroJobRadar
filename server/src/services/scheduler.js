import cron from 'node-cron';
import { scrapeReed } from './reedScraper.js';
import { scrapeAdzuna } from './adzunaScraper.js';
import { loadSponsorList, checkSponsorship } from './sponsorChecker.js';
import { insertJob, cleanOldJobs, getDb } from '../db/database.js';

let isRunning = false;
let lastRunAt = null;

export async function runJobFetch() {
  if (isRunning) {
    console.log('[Scheduler] Fetch already in progress. Skipping.');
    return { skipped: true };
  }

  isRunning = true;
  const startTime = Date.now();
  console.log('[Scheduler] Starting job fetch...');

  const summary = {
    reed: { fetched: 0, inserted: 0, duplicates: 0 },
    adzuna: { fetched: 0, inserted: 0, duplicates: 0 },
    sponsors: 0,
    cleaned: 0,
    elapsed: 0,
  };

  try {
    // 1. Load/refresh sponsor list
    await loadSponsorList();

    // 2. Fetch from both sources in parallel (one failing doesn't block the other)
    const [reedResult, adzunaResult] = await Promise.allSettled([
      scrapeReed(),
      scrapeAdzuna(),
    ]);

    const reedJobs = reedResult.status === 'fulfilled' ? reedResult.value : [];
    const adzunaJobs = adzunaResult.status === 'fulfilled' ? adzunaResult.value : [];

    if (reedResult.status === 'rejected') {
      console.error('[Scheduler] Reed scraper failed:', reedResult.reason?.message);
    }
    if (adzunaResult.status === 'rejected') {
      console.error('[Scheduler] Adzuna scraper failed:', adzunaResult.reason?.message);
    }

    summary.reed.fetched = reedJobs.length;
    summary.adzuna.fetched = adzunaJobs.length;

    // 3. Check sponsorship + insert all jobs
    const allJobs = [...reedJobs, ...adzunaJobs];

    for (const job of allJobs) {
      job.sponsorship = checkSponsorship(job.company);
      if (job.sponsorship) summary.sponsors++;

      const inserted = insertJob(job);

      if (job.source === 'reed') {
        if (inserted) summary.reed.inserted++;
        else summary.reed.duplicates++;
      } else {
        if (inserted) summary.adzuna.inserted++;
        else summary.adzuna.duplicates++;
      }
    }

    // 4. Clean old jobs
    summary.cleaned = cleanOldJobs(30);

    summary.elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    lastRunAt = new Date().toISOString();

    console.log(
      `[Scheduler] Done in ${summary.elapsed}s | ` +
      `Reed: ${summary.reed.inserted} new / ${summary.reed.duplicates} dupes | ` +
      `Adzuna: ${summary.adzuna.inserted} new / ${summary.adzuna.duplicates} dupes | ` +
      `Sponsors: ${summary.sponsors} | Cleaned: ${summary.cleaned}`
    );

    return summary;
  } catch (err) {
    console.error('[Scheduler] Unexpected error during job fetch:', err);
    throw err;
  } finally {
    isRunning = false;
  }
}

export function getSchedulerStatus() {
  return { isRunning, lastRunAt };
}

export function startScheduler() {
  // Run at 7 AM and 6 PM UK time
  cron.schedule('0 7 * * *', () => {
    console.log('[Scheduler] 7 AM cron triggered');
    runJobFetch().catch(console.error);
  }, { timezone: 'Europe/London' });

  cron.schedule('0 18 * * *', () => {
    console.log('[Scheduler] 6 PM cron triggered');
    runJobFetch().catch(console.error);
  }, { timezone: 'Europe/London' });

  console.log('[Scheduler] Cron jobs scheduled (7 AM + 6 PM Europe/London).');

  // On startup: check if we have recent data; if not, trigger immediate fetch
  checkAndFetchOnStartup();
}

async function checkAndFetchOnStartup() {
  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const recentJob = db.prepare(
      `SELECT id FROM jobs WHERE fetched_date > ? LIMIT 1`
    ).get(cutoff);

    if (!recentJob) {
      console.log('[Scheduler] No recent jobs found. Triggering startup fetch...');
      // Small delay to let the server finish booting
      setTimeout(() => {
        runJobFetch().catch(console.error);
      }, 3000);
    } else {
      console.log('[Scheduler] Recent jobs found. Skipping startup fetch.');
    }
  } catch (err) {
    console.error('[Scheduler] Startup check failed:', err.message);
  }
}
