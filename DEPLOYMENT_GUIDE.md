# 🚀 Deployment Guide - Bakery Inventory Management System

## ⚠️ Official Production Deployment

**For production deployments, use:** [DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md)

This guide documents our **official production architecture**:
- **Frontend**: Vercel (static hosting)
- **Backend**: Render (Node.js web service)
- **Database**: Neon PostgreSQL (serverless, automatic backups)

**Why this setup?**
- ✅ Independent database (safer for production data)
- ✅ Free automatic backups on Neon
- ✅ 750 compute hours/month on Render (vs 500 on alternatives)
- ✅ Professional separation of concerns
- ✅ Easy to scale components independently

---

## Quick Deploy Options (Development/Testing)

⚠️ **Note**: The options below are for development/testing environments only. For production, see [DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md).

### Option 1: Railway (Development/Testing Only)

Railway provides free PostgreSQL database and hosting with automatic deployments. Good for development branches.

#### Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   ```bash
   # Push your code to GitHub
   git push origin your-feature-branch
   ```

3. **Create New Project on Railway**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `backery2-app` repository
   - Select your branch

4. **Add PostgreSQL Database**
   - In your Railway project, click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically create a database

5. **Configure Environment Variables**
   
   Go to your service settings and add these variables:
   
   **Backend Service:**
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   NODE_ENV=production
   PORT=8000
   FRONTEND_URL=https://your-frontend-url.railway.app
   ```

6. **Configure Build & Start Commands**
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Root Directory: `/backend`

7. **Run Database Migrations**
   - In Railway, go to your backend service
   - Click "Settings" → "Deploy" → "Custom Start Command"
   - Add: `npx prisma migrate deploy && npm start`

8. **Deploy Frontend**
   - Add another service for frontend
   - Root Directory: `/frontend`
   - Build Command: `npm run build`
   - Start Command: `npm run preview` (or use Vercel for frontend)
   
   Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```

---

### Option 2: Vercel (Frontend) + Railway (Backend)

Best for optimal frontend performance.

#### Backend on Railway:
Follow steps 1-7 from Option 1 above.

#### Frontend on Vercel:

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import `backery2-app` from GitHub
   - Root Directory: `frontend`
   - Framework: Vite

3. **Configure Environment Variables**
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy

---

### Option 3: Render (Full Stack)

Free tier with PostgreSQL included.

#### Steps:

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Name: `bakery-db`
   - Region: Choose closest to you
   - Instance Type: Free
   - Copy the Internal Database URL

3. **Deploy Backend**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Name: `bakery-backend`
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && npm start`
   
   Environment Variables:
   ```
   DATABASE_URL=[paste internal database URL]
   NODE_ENV=production
   PORT=8000
   ```

4. **Deploy Frontend**
   - Click "New +" → "Static Site"
   - Connect GitHub repository
   - Name: `bakery-frontend`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   
   Environment Variable:
   ```
   VITE_API_URL=https://bakery-backend.onrender.com/api
   ```

---

## Environment Variables Reference

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:5432/database
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-frontend-url.com
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
```

---

## Pre-Deployment Checklist

- [x] Code committed and pushed to GitHub
- [ ] Database migrations are up to date
- [ ] Environment variables configured
- [ ] Build scripts work locally
- [ ] API endpoints are tested
- [ ] Frontend connects to backend API

---

## Testing Your Deployment

1. **Backend Health Check**
   ```bash
   curl https://your-backend-url.com/health
   ```
   Should return: `{"status":"OK","timestamp":"..."}`

2. **Frontend Access**
   - Open: `https://your-frontend-url.com`
   - Login and test customer orders
   - Test Word export functionality

3. **Database Check**
   - Create a customer order
   - Export as Word document
   - Confirm the order
   - Verify inventory updates

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correctly set
- Check PostgreSQL is running
- Run: `npx prisma migrate deploy`

### Build Failures
- Check Node version (should be 18+)
- Clear cache and rebuild
- Verify all dependencies are installed

### CORS Errors
- Add frontend URL to backend CORS configuration
- Update `FRONTEND_URL` environment variable

### Migration Issues
- Run migrations manually in Railway/Render shell:
  ```bash
  npx prisma migrate deploy
  ```

---

## Post-Deployment

### Custom Domain (Optional)
1. Purchase domain from Namecheap, Google Domains, etc.
2. Add domain in Railway/Vercel/Render settings
3. Update DNS records (CNAME or A record)
4. Update environment variables with new URLs

### Monitoring
- Railway: Built-in metrics dashboard
- Vercel: Analytics in dashboard
- Render: Logs and metrics available

### Automatic Deployments
All platforms support automatic deployments on git push to your branch!

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Prisma Deploy: https://www.prisma.io/docs/guides/deployment

---

**Estimated Setup Time:** 15-30 minutes
**Cost:** Free tier available on all platforms (Railway, Vercel, Render)

🎉 **Your bakery management system is ready to go live!**
