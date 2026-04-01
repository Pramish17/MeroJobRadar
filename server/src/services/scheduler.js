import cron from 'node-cron';
import { scrapeAdzuna }   from './adzunaScraper.js';
import { scrapeRemotive } from './remotiveScraper.js';
import { scrapeArbeitnow } from './arbeitnowScraper.js';
import { scrapeRemoteOk } from './remoteOkScraper.js';
import { loadSponsorList, checkSponsorshipGlobal } from './sponsorChecker.js';
import { insertJob, cleanOldJobs, updateSponsorships, getDb } from '../db/database.js';

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
    adzuna:    { fetched: 0, inserted: 0, duplicates: 0 },
    remotive:  { fetched: 0, inserted: 0, duplicates: 0 },
    arbeitnow: { fetched: 0, inserted: 0, duplicates: 0 },
    remoteok:  { fetched: 0, inserted: 0, duplicates: 0 },
    sponsors: 0,
    cleaned: 0,
    elapsed: 0,
  };

  try {
    // 1. Load/refresh sponsor list, then backfill existing jobs
    await loadSponsorList();
    const backfilled = updateSponsorships(checkSponsorshipGlobal);
    if (backfilled > 0) {
      console.log(`[Scheduler] Backfilled sponsorship for ${backfilled} existing companies.`);
    }

    // 2. Fetch from all sources in parallel
    const [adzunaResult, remotiveResult, arbeitnowResult, remoteOkResult] = await Promise.allSettled([
      scrapeAdzuna(),
      scrapeRemotive(),
      scrapeArbeitnow(),
      scrapeRemoteOk(),
    ]);

    const adzunaJobs    = adzunaResult.status    === 'fulfilled' ? adzunaResult.value    : [];
    const remotiveJobs  = remotiveResult.status  === 'fulfilled' ? remotiveResult.value  : [];
    const arbeitnowJobs = arbeitnowResult.status === 'fulfilled' ? arbeitnowResult.value : [];
    const remoteOkJobs  = remoteOkResult.status  === 'fulfilled' ? remoteOkResult.value  : [];

    if (adzunaResult.status    === 'rejected') console.error('[Scheduler] Adzuna failed:',    adzunaResult.reason?.message);
    if (remotiveResult.status  === 'rejected') console.error('[Scheduler] Remotive failed:',  remotiveResult.reason?.message);
    if (arbeitnowResult.status === 'rejected') console.error('[Scheduler] Arbeitnow failed:', arbeitnowResult.reason?.message);
    if (remoteOkResult.status  === 'rejected') console.error('[Scheduler] RemoteOK failed:',  remoteOkResult.reason?.message);

    summary.adzuna.fetched    = adzunaJobs.length;
    summary.remotive.fetched  = remotiveJobs.length;
    summary.arbeitnow.fetched = arbeitnowJobs.length;
    summary.remoteok.fetched  = remoteOkJobs.length;

    // 3. Check sponsorship + insert all jobs
    const allJobs = [...adzunaJobs, ...remotiveJobs, ...arbeitnowJobs, ...remoteOkJobs];

    for (const job of allJobs) {
      job.sponsorship = checkSponsorshipGlobal(job.company, job.description);
      if (job.sponsorship) summary.sponsors++;

      const inserted = insertJob(job);
      const bucket = summary[job.source] ?? summary.arbeitnow;
      if (inserted) bucket.inserted++;
      else bucket.duplicates++;
    }

    // 4. Clean old jobs
    summary.cleaned = cleanOldJobs(30);

    summary.elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    lastRunAt = new Date().toISOString();

    console.log(
      `[Scheduler] Done in ${summary.elapsed}s | ` +
      `Adzuna: ${summary.adzuna.inserted} new / ${summary.adzuna.duplicates} dupes | ` +
      `Remotive: ${summary.remotive.inserted} new / ${summary.remotive.duplicates} dupes | ` +
      `Arbeitnow: ${summary.arbeitnow.inserted} new / ${summary.arbeitnow.duplicates} dupes | ` +
      `RemoteOK: ${summary.remoteok.inserted} new / ${summary.remoteok.duplicates} dupes | ` +
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
  cron.schedule('0 7 * * *', () => {
    console.log('[Scheduler] 7 AM cron triggered');
    runJobFetch().catch(console.error);
  }, { timezone: 'Europe/London' });

  cron.schedule('0 18 * * *', () => {
    console.log('[Scheduler] 6 PM cron triggered');
    runJobFetch().catch(console.error);
  }, { timezone: 'Europe/London' });

  console.log('[Scheduler] Cron jobs scheduled (7 AM + 6 PM Europe/London).');
  checkAndFetchOnStartup();
}

async function checkAndFetchOnStartup() {
  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const recentJob = db.prepare(`SELECT id FROM jobs WHERE fetched_date > ? LIMIT 1`).get(cutoff);

    if (!recentJob) {
      console.log('[Scheduler] No recent jobs found. Triggering startup fetch...');
      setTimeout(() => runJobFetch().catch(console.error), 3000);
    } else {
      console.log('[Scheduler] Recent jobs found. Skipping startup fetch.');
    }
  } catch (err) {
    console.error('[Scheduler] Startup check failed:', err.message);
  }
}
