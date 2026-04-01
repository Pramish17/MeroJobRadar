import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { getDb } from './db/database.js';
import jobsRouter from './routes/jobs.js';
import { startScheduler } from './services/scheduler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3001', 10);

// Ensure data directory exists
mkdirSync(join(__dirname, '..', 'data'), { recursive: true });

const app = express();

// Middleware
app.use(cors({
  origin: IS_PROD ? false : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging in dev
if (!IS_PROD) {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    keys: {
      reed: !!process.env.REED_API_KEY,
      adzuna: !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY),
      anthropic: !!process.env.ANTHROPIC_API_KEY,
    },
  });
});

// API routes
app.use('/api/jobs', jobsRouter);

// Serve built React frontend in production
if (IS_PROD) {
  const clientDist = join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));

  // SPA fallback — all non-API routes serve index.html
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(join(clientDist, 'index.html'));
  });
}

// Initialize DB
getDb();

// Start cron scheduler
startScheduler();

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Mero Job Radar running on port ${PORT} (${IS_PROD ? 'production' : 'development'})`);
  if (!IS_PROD) {
    console.log(`[Server] API: http://localhost:${PORT}/api/health`);
  }
});

export default app;
