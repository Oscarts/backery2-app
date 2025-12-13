# =============================================================================
#                    🚀 RAPIDPRO DEPLOYMENT GUIDE
#                    Professional Production Setup
# =============================================================================
#
# Architecture: Vercel (Frontend) + Render (Backend) + Neon (Database)
# 
# Total Monthly Cost: $0 (Free Tier)
# Estimated Setup Time: 30-45 minutes
#
# =============================================================================

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Phase 1: Database Setup (Neon)](#phase-1-database-setup-neon)
3. [Phase 2: Backend Deployment (Render)](#phase-2-backend-deployment-render)
4. [Phase 3: Frontend Deployment (Vercel)](#phase-3-frontend-deployment-vercel)
5. [Phase 4: Configure Backups](#phase-4-configure-backups)
6. [Phase 5: Final Configuration](#phase-5-final-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Disaster Recovery](#disaster-recovery)

---

## 📋 PREREQUISITES

Before starting, ensure you have:

- [ ] GitHub account (repository: `Oscarts/backery2-app`)
- [ ] Node.js 20.x installed locally
- [ ] Git configured with your GitHub credentials

Create accounts on (all free):
- [ ] [Neon](https://neon.tech) - PostgreSQL database
- [ ] [Render](https://render.com) - Backend hosting
- [ ] [Vercel](https://vercel.com) - Frontend hosting

---

## 🗄️ PHASE 1: DATABASE SETUP (NEON)

### Step 1.1: Create Neon Account & Project

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up with GitHub (recommended for easy integration)
3. Click **"Create Project"**
4. Configure:
   - **Project Name**: `rapidpro-production`
   - **Region**: Select closest to your users (e.g., `aws-us-east-1` or `aws-eu-central-1`)
   - **PostgreSQL Version**: 16 (latest)

### Step 1.2: Get Connection String

1. In your Neon dashboard, go to **"Connection Details"**
2. Select **"Connection String"** tab
3. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this securely** - you'll need it for Render

### Step 1.3: Configure Database Settings

1. Go to **Settings → Compute**
2. Set **Auto-suspend delay**: 5 minutes (saves resources)
3. Go to **Settings → Storage**
4. Enable **Point-in-time recovery** (free for 7 days)

### Step 1.4: Run Database Migrations

From your local machine:

```bash
# Set the Neon DATABASE_URL
export DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Navigate to backend
cd backend

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional but recommended)
npx prisma db seed

# Verify with Prisma Studio
npx prisma studio
```

✅ **Checkpoint**: You should see tables in Neon dashboard

---

## 🖥️ PHASE 2: BACKEND DEPLOYMENT (RENDER)

### Step 2.1: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub

### Step 2.2: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `Oscarts/backery2-app`
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `rapidpro-api` |
| **Region** | Oregon (or closest to Neon) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free |

### Step 2.3: Set Environment Variables

In Render dashboard → Environment:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `8000` |
| `DATABASE_URL` | `[Your Neon connection string]` |
| `JWT_SECRET` | `[Generate: openssl rand -base64 32]` |
| `JWT_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | `https://rapidpro.vercel.app` (update after Vercel setup) |

### Step 2.4: Deploy

1. Click **"Create Web Service"**
2. Wait for build to complete (3-5 minutes)
3. Note your backend URL: `https://rapidpro-api.onrender.com`

### Step 2.5: Get Deploy Hook (for CI/CD)

1. Go to **Settings → Build & Deploy**
2. Copy the **Deploy Hook URL**
3. Save for GitHub secrets later

✅ **Checkpoint**: Visit `https://rapidpro-api.onrender.com/health` - should return `{"status":"ok"}`

---

## 🌐 PHASE 3: FRONTEND DEPLOYMENT (VERCEL)

### Step 3.1: Create Vercel Account

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with GitHub

### Step 3.2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Import from GitHub: `Oscarts/backery2-app`
3. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 3.3: Set Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://rapidpro-api.onrender.com` |

### Step 3.4: Deploy

1. Click **"Deploy"**
2. Wait for build (1-2 minutes)
3. Note your frontend URL: `https://rapidpro-xxx.vercel.app`

### Step 3.5: Configure Custom Domain (Optional)

1. Go to **Settings → Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

✅ **Checkpoint**: Visit your Vercel URL and login should work

---

## 💾 PHASE 4: CONFIGURE BACKUPS

### Step 4.1: Enable GitHub Actions

The backup workflow is already configured in `.github/workflows/backup-database.yml`

### Step 4.2: Add GitHub Secrets for Backups

1. Go to GitHub → Repository → **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

| Secret Name | Required | Description |
|-------------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | Your Neon PostgreSQL connection string |
| `SLACK_WEBHOOK_URL` | Optional | Slack incoming webhook for notifications |
| `DISCORD_WEBHOOK_URL` | Optional | Discord webhook for notifications |

### Step 4.3: Configure Slack Notifications (Optional)

1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app → "From scratch"
3. Enable **Incoming Webhooks**
4. Create a webhook for your channel
5. Copy the webhook URL and add as `SLACK_WEBHOOK_URL` secret

### Step 4.4: Configure Discord Notifications (Optional)

1. In Discord, go to **Server Settings → Integrations → Webhooks**
2. Create a new webhook
3. Copy the webhook URL and add as `DISCORD_WEBHOOK_URL` secret

### Step 4.5: Test Backup Manually

1. Go to **Actions** tab in GitHub
2. Select **"📦 Database Backup (Enhanced)"** workflow
3. Click **"Run workflow"**
4. Verify:
   - ✅ Backup job completes
   - ✅ Verification job passes (test restore)
   - ✅ Release created in GitHub Releases
   - ✅ Notification received (if configured)

### Step 4.6: Backup Schedule & Features

| Feature | Description |
|---------|-------------|
| **Frequency** | Weekly (Sunday 2:00 AM UTC) |
| **Retention** | Last 4 backups kept |
| **Verification** | Automatic test restore to temp database |
| **Checksum** | SHA256 integrity verification |
| **Alerting** | Slack, Discord, or GitHub Issues |

| Backup Type | Frequency | Retention | Recovery Time |
|-------------|-----------|-----------|---------------|
| Neon PITR | Continuous | 7 days | ~5 min |
| GitHub Releases | Weekly | 4 backups | ~15 min |
| Manual Script | On-demand | Unlimited | ~15 min |

### Step 4.7: Alert Behavior

| Event | Slack/Discord | GitHub Issue |
|-------|---------------|--------------|
| ✅ Success | Notification sent | No |
| ⚠️ Warning | Notification sent | No |
| ❌ Failure | Notification sent | **Auto-created** with label `backup-failure` |

✅ **Checkpoint**: Run manual backup and verify notification received

---

## ⚙️ PHASE 5: FINAL CONFIGURATION

### Step 5.1: Update CORS on Render

1. Go to Render dashboard
2. Update `CORS_ORIGIN` environment variable to your actual Vercel URL
3. Trigger redeploy

### Step 5.2: Add CI/CD Deploy Hook

1. Go to GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Add secret:
   - **Name**: `RENDER_DEPLOY_HOOK_URL`
   - **Value**: `[Your Render deploy hook URL]`

### Step 5.3: Test Full Deployment

1. Make a small change to the code
2. Commit and push to `main`
3. Verify:
   - GitHub Actions workflow runs ✅
   - Vercel deploys automatically ✅
   - Render deploys via webhook ✅

---

## 📊 MONITORING & MAINTENANCE

### Daily Checks
- [ ] Check Render dashboard for errors
- [ ] Review Vercel deployment status
- [ ] Monitor Neon database usage

### Weekly Tasks
- [ ] Verify backup was created (GitHub Releases)
- [ ] Check Neon storage usage
- [ ] Review error logs

### Monthly Tasks
- [ ] Test backup restoration procedure
- [ ] Review and update dependencies
- [ ] Check for security updates

### Useful Commands

```bash
# Check backend health
curl https://rapidpro-api.onrender.com/health

# View recent logs (Render dashboard)
# Go to: Render → rapidpro-api → Logs

# Connect to database locally
export DATABASE_URL="your-neon-connection-string"
npx prisma studio

# Manual backup
./scripts/backup-database.sh

# Restore from backup
./scripts/restore-backup.sh --latest
```

---

## 🆘 DISASTER RECOVERY

### Scenario 1: Database Corruption

**Recovery Time**: ~10 minutes

1. **Use Neon Point-in-time Recovery**:
   - Go to Neon dashboard
   - Click **"Restore"** → Select a point in time
   - Create new branch from that point
   - Update `DATABASE_URL` in Render

### Scenario 2: Accidental Data Deletion

**Recovery Time**: ~15 minutes

1. **Restore from GitHub backup**:
   ```bash
   export DATABASE_URL="your-neon-connection-string"
   ./scripts/restore-backup.sh --latest
   ```

### Scenario 3: Complete Service Outage

**Recovery Time**: ~30 minutes

1. Create new Neon project
2. Restore database from GitHub backup
3. Update Render environment variables
4. Verify Vercel is pointing to correct backend

---

## 📞 SUPPORT RESOURCES

| Service | Documentation | Status Page |
|---------|--------------|-------------|
| Neon | [docs.neon.tech](https://docs.neon.tech) | [status.neon.tech](https://status.neon.tech) |
| Render | [docs.render.com](https://docs.render.com) | [status.render.com](https://status.render.com) |
| Vercel | [vercel.com/docs](https://vercel.com/docs) | [vercel-status.com](https://vercel-status.com) |

---

## ✅ DEPLOYMENT CHECKLIST

```
□ Phase 1: Database (Neon)
  □ Created Neon account and project
  □ Copied connection string
  □ Enabled point-in-time recovery
  □ Ran migrations successfully
  □ Seeded initial data

□ Phase 2: Backend (Render)
  □ Created Render web service
  □ Set all environment variables
  □ Deployed successfully
  □ Health check passes

□ Phase 3: Frontend (Vercel)
  □ Imported project to Vercel
  □ Set VITE_API_URL
  □ Deployed successfully
  □ Can login to app

□ Phase 4: Backups
  □ Added DATABASE_URL to GitHub secrets
  □ Tested manual backup workflow
  □ Verified backup in Releases

□ Phase 5: Final Setup
  □ Updated CORS_ORIGIN
  □ Added deploy hook secret
  □ Tested full CI/CD pipeline

🎉 DEPLOYMENT COMPLETE!
```

---

**Last Updated**: December 2025
**Version**: 1.0.0
