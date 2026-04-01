# Mero Job Radar

A production-ready full-stack job aggregator for Software Engineering / IT roles in London. Automatically scrapes Reed and Adzuna daily, cross-references companies against the UK Government's visa sponsor register, and displays everything in a polished dashboard.

![Mero Job Radar Dashboard](docs/screenshot-placeholder.png)

## Features

- **Live job scraping** — Reed.co.uk + Adzuna, 8 keyword searches per source, twice daily (7 AM & 6 PM UK time)
- **Visa sponsorship tracking** — Companies cross-referenced against the UK Home Office sponsor register
- **Full-text search** — Search across title, company, and tech tags
- **Smart filtering** — Filter by source, date posted, sponsorship status, and saved jobs
- **AI Career Advisor** — Claude-powered Q&A about the job listings (optional)
- **Auto-deduplication** — Levenshtein distance matching prevents duplicate listings
- **Auto-cleanup** — Jobs older than 30 days are removed on each fetch cycle
- **Dark mode** — Automatic system preference detection
- **Production-ready** — Single Node.js process serves both API + static frontend

## Prerequisites

- Node.js 20+
- API keys (see below)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/mero-job-radar.git
cd mero-job-radar

# 2. Install all dependencies (root + server + client)
npm install

# 3. Configure environment variables
cp server/.env.example server/.env
# Edit server/.env and add your API keys

# 4. Start development (server + client with hot reload)
npm run dev
```

Open http://localhost:5173 — the frontend proxies API calls to port 3001.

## API Key Setup

### Reed API (free, 5,000 req/day)
1. Sign up at https://www.reed.co.uk/developers
2. Get your API key from the dashboard
3. Add to `server/.env`: `REED_API_KEY=your_key_here`

### Adzuna API (free, 250 req/day)
1. Register at https://developer.adzuna.com/
2. Create an app to get `App ID` and `App Key`
3. Add to `server/.env`:
   ```
   ADZUNA_APP_ID=your_app_id
   ADZUNA_APP_KEY=your_app_key
   ```

### Anthropic API (optional — for AI Advisor)
1. Get a key at https://console.anthropic.com/
2. Add to `server/.env`: `ANTHROPIC_API_KEY=your_key_here`
3. Also add to `client/.env`: `VITE_ANTHROPIC_API_KEY=your_key_here`
   > Note: The AI Advisor calls Anthropic directly from the browser. Only do this in a private/personal deployment.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server + client in dev mode (hot reload) |
| `npm run dev:server` | Start server only |
| `npm run dev:client` | Start Vite dev server only |
| `npm run build` | Build React frontend for production |
| `npm start` | Start production server (serves API + built frontend) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check + API key status |
| `GET` | `/api/jobs` | List jobs with filters |
| `GET` | `/api/jobs/stats` | Dashboard statistics |
| `GET` | `/api/jobs/:id` | Single job detail |
| `POST` | `/api/jobs/:id/save` | Toggle bookmark |
| `POST` | `/api/jobs/refresh` | Manually trigger a job fetch |

### Query Parameters for `GET /api/jobs`

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search (title, company, tags) |
| `source` | `reed` \| `adzuna` | Filter by source |
| `sponsorship` | `true` | Show only visa sponsors |
| `dateFrom` | `YYYY-MM-DD` | Jobs posted on or after date |
| `saved` | `true` | Show only saved jobs |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 30, max: 100) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Backend | Node.js, Express 4 (ES modules) |
| Database | SQLite via better-sqlite3 |
| Scheduler | node-cron |
| Fonts | DM Sans + Space Mono |

## Deployment

See [hostinger-deploy.md](hostinger-deploy.md) for step-by-step Hostinger deployment instructions.

## Project Structure

```
mero-job-radar/
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # useJobs data hook
│       └── utils/        # API client
├── server/           # Express backend
│   └── src/
│       ├── db/           # SQLite database
│       ├── routes/       # API routes
│       ├── services/     # Scrapers + scheduler
│       └── utils/        # Tag extraction + deduplication
└── package.json      # Root monorepo scripts
```
