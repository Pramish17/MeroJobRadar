import { Router } from 'express';
import { getJobs, getJobById, toggleSaveJob, getStats } from '../db/database.js';
import { runJobFetch, getSchedulerStatus } from '../services/scheduler.js';

const router = Router();

// GET /api/jobs — paginated, filtered job list
router.get('/', (req, res) => {
  try {
    const {
      search,
      source,
      sponsorship,
      dateFrom,
      saved,
      page = '1',
      limit = '30',
    } = req.query;

    const result = getJobs({
      search,
      source,
      sponsorship: sponsorship === 'true',
      dateFrom,
      saved: saved === 'true',
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.min(100, parseInt(limit, 10) || 30),
    });

    res.json(result);
  } catch (err) {
    console.error('[API] GET /jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/stats — dashboard statistics
router.get('/stats', (req, res) => {
  try {
    const stats = getStats();
    const schedulerStatus = getSchedulerStatus();
    res.json({ ...stats, scheduler: schedulerStatus });
  } catch (err) {
    console.error('[API] GET /jobs/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// POST /api/jobs/refresh — manually trigger a fetch
router.post('/refresh', async (req, res) => {
  const { isRunning } = getSchedulerStatus();

  if (isRunning) {
    return res.status(409).json({ message: 'A fetch is already in progress.' });
  }

  // Respond immediately, run fetch in background
  res.json({ message: 'Job fetch started.', started: true });

  try {
    await runJobFetch();
  } catch (err) {
    console.error('[API] Manual refresh failed:', err);
  }
});

// GET /api/jobs/:id — single job detail
router.get('/:id', (req, res) => {
  try {
    const job = getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (err) {
    console.error('[API] GET /jobs/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /api/jobs/:id/save — toggle bookmark
router.post('/:id/save', (req, res) => {
  try {
    const newState = toggleSaveJob(req.params.id);
    if (newState === null) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ saved: newState });
  } catch (err) {
    console.error('[API] POST /jobs/:id/save error:', err);
    res.status(500).json({ error: 'Failed to toggle save' });
  }
});

export default router;
