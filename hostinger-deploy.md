# Hostinger Deployment Guide

## Option A: GitHub Integration (Recommended)

This is the easiest method — Hostinger auto-deploys every time you push to `main`.

### Step 1: Push to GitHub

```bash
# In your project root
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/mero-job-radar.git
git push -u origin main
```

### Step 2: Set Up Node.js App in Hostinger

1. Log into **hPanel** (hpanel.hostinger.com)
2. Go to **Websites** → select your hosting plan → **Manage**
3. In the left sidebar, find **Advanced** → **Node.js**
4. Click **Create Application**

### Step 3: Configure the App

| Setting | Value |
|---------|-------|
| Node.js version | `20.x` |
| Application root | `/` (project root) |
| Application URL | your domain or subdomain |
| Application startup file | `server/src/index.js` |

### Step 4: Connect GitHub

1. In the Node.js app settings, find **Git Deployment**
2. Click **Connect GitHub Account** and authorise Hostinger
3. Select your **mero-job-radar** repository
4. Set branch to `main`
5. Set **Build command**:
   ```
   npm install && npm run build
   ```
6. Set **Start command**:
   ```
   cd server && node src/index.js
   ```

### Step 5: Add Environment Variables

In the Node.js app settings → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `REED_API_KEY` | your Reed API key |
| `ADZUNA_APP_ID` | your Adzuna App ID |
| `ADZUNA_APP_KEY` | your Adzuna App Key |
| `ANTHROPIC_API_KEY` | your Anthropic key (optional) |

### Step 6: Deploy

1. Click **Deploy** — Hostinger will:
   - Clone your repo
   - Run `npm install && npm run build`
   - Start the server with `cd server && node src/index.js`
2. Wait 2-3 minutes for the build to complete
3. Click **Open** to visit your live app

### Step 7: Auto-Redeploy (CI/CD)

Every `git push` to `main` now triggers an automatic redeploy. No manual action needed.

```bash
# Make changes, then:
git add .
git commit -m "Update something"
git push origin main
# → Hostinger detects the push and redeploys automatically
```

---

## Option B: ZIP Upload

Use this if you prefer not to use GitHub integration.

### Step 1: Build Locally

```bash
# In your project root
npm install
npm run build
```

### Step 2: Prepare the ZIP

Exclude `node_modules` and the database file:

```bash
# On Linux/Mac:
zip -r mero-job-radar.zip . \
  --exclude "*/node_modules/*" \
  --exclude "server/data/*" \
  --exclude "client/dist/.git*" \
  --exclude ".git/*"

# On Windows (PowerShell):
Compress-Archive -Path . -DestinationPath mero-job-radar.zip `
  -CompressionLevel Optimal
# Then manually remove node_modules from the zip
```

### Step 3: Upload to Hostinger

1. In hPanel → **Node.js** → **Upload ZIP**
2. Select your `mero-job-radar.zip`
3. Set the same environment variables as in Option A
4. Click **Start Application**

---

## Domain & SSL Setup

### Point a Custom Domain

1. In hPanel → **Domains** → **Add Domain** (or **Subdomains**)
2. Create a subdomain like `jobs.yourdomain.com`
3. In the Node.js app settings, set the **Application URL** to `jobs.yourdomain.com`
4. SSL is automatically provisioned by Hostinger (Let's Encrypt) — no action needed

### Use the Main Domain

1. In hPanel → **Websites** → **Manage** → **Node.js**
2. Set **Application URL** to your main domain
3. SSL auto-configured

---

## Monitoring

### Check Deployment Logs

1. hPanel → **Node.js** → click your app → **Logs**
2. Look for:
   - `[Server] Mero Job Radar running on port 3000 (production)` ✓
   - `[DB] Initialized at ...` ✓
   - `[Scheduler] Cron jobs scheduled` ✓

### CPU/RAM Usage

hPanel → **Websites** → **Statistics** — shows CPU and RAM graphs

### If Cron Jobs Don't Work on Shared Hosting

Some Hostinger shared plans restrict background processes. Add an external cron trigger as a fallback:

1. Go to **cron-job.org** (free)
2. Create two cron jobs:
   - `0 7 * * *` → POST to `https://yourdomain.com/api/jobs/refresh`
   - `0 18 * * *` → POST to `https://yourdomain.com/api/jobs/refresh`
3. This ensures jobs are fetched twice daily even if the internal cron fails

### Health Check URL

Monitor your app uptime at: `https://yourdomain.com/api/health`

The response includes:
```json
{
  "status": "ok",
  "keys": {
    "reed": true,
    "adzuna": true,
    "anthropic": false
  }
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App won't start | Check logs for missing env vars. Ensure `PORT=3000` is set. |
| No jobs showing | Check API keys are correct. Hit `POST /api/jobs/refresh` manually. |
| `better-sqlite3` build error | Ensure Node 20.x is selected. The package needs native compilation. |
| Static files not serving | Ensure `npm run build` ran successfully (check logs). |
| CORS errors | In production `NODE_ENV=production` must be set — this disables the dev CORS config. |
