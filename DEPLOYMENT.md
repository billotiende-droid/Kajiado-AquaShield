# Kajiado AquaShield - Complete Deployment Guide

This guide walks you through deploying the Kajiado AquaShield application to production using **Vercel** (frontend) and **Railway** (backend).

## Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Your Users                             │
└──────────────────────────────────────────────────────────┘
                           ↓
            ┌──────────────────────────────┐
            │   Vercel (Frontend)          │
            │   - Next.js App              │
            │   - Static Assets            │
            │   - Automatic SSL/CDN        │
            └──────────────────────────────┘
                           ↓
                    (HTTP Requests)
                           ↓
            ┌──────────────────────────────┐
            │   Railway (Backend)          │
            │   - FastAPI Server           │
            │   - SQLite Database          │
            │   - Weather-AI Integration   │
            └──────────────────────────────┘
                           ↓
            ┌──────────────────────────────┐
            │   Weather-AI API             │
            │   (External Service)         │
            └──────────────────────────────┘
```

## Prerequisites

- GitHub account (for code hosting)
- Vercel account (free tier available)
- Railway account (free tier available)
- Weather-AI API credentials
- Git installed locally

## Step-by-Step Deployment

### Phase 1: Prepare Your Repository

#### 1.1 Initialize Git Repository

If you haven't already:

```bash
cd kajiado-aquashield
git init
git add .
git commit -m "Initial commit: Kajiado AquaShield application"
```

#### 1.2 Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click **New Repository**
3. Name: `kajiado-aquashield` (or your preferred name)
4. Description: "Weather monitoring and flood alert system for Kajiado"
5. Choose **Public** (for easier collaboration)
6. Click **Create Repository**

#### 1.3 Push Code to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/kajiado-aquashield.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Phase 2: Deploy Backend to Railway

#### 2.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended for easier integration)
3. Authorize Railway to access your GitHub account

#### 2.2 Deploy the Backend

1. Click **New Project** → **Deploy from GitHub**
2. Select your `kajiado-aquashield` repository
3. Choose the repository name when prompted
4. Wait for Railway to detect the project structure

#### 2.3 Configure Environment Variables

In the Railway dashboard:

1. Click on your project
2. Go to **Variables** tab
3. Add the following variables:

```
WEATHER_AI_ENDPOINT = https://api.weather-ai.example.com/v1/current
WEATHER_AI_KEY = YOUR_ACTUAL_API_KEY_HERE
DATABASE_PATH = /data/aquashield.db
FRONTEND_URL = https://your-vercel-app.vercel.app
PORT = (Railway auto-assigns, leave empty or remove)
```

**Important**: Replace the values with your actual Weather-AI credentials.

#### 2.4 Get Your Backend URL

1. In Railway dashboard, click your project
2. Go to **Deployments** tab
3. Click the **Settings** icon
4. Look for **Public URL** or **Domain**
5. Copy the URL (e.g., `https://your-app.railway.app`)
6. This is your `BACKEND_URL` for the next phase

#### 2.5 Verify Backend is Running

Open your browser and visit:
- `https://your-app.railway.app/health` → should show `{"status": "healthy", ...}`
- `https://your-app.railway.app/docs` → FastAPI interactive API docs

If you see errors, check Railway logs:
1. Go to Railway project
2. Click **Logs** tab
3. Look for error messages

### Phase 3: Deploy Frontend to Vercel

#### 3.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your GitHub account

#### 3.2 Deploy the Frontend

1. Click **Add New...** → **Project**
2. Select your `kajiado-aquashield` repository
3. Vercel auto-detects Next.js configuration
4. Click **Deploy**

#### 3.3 Configure Environment Variables

Before final deployment:

1. In Vercel dashboard, go to **Settings** → **Environment Variables**
2. Add the variable:

```
NEXT_PUBLIC_API_BASE_URL = https://your-railway-app.railway.app
```

Use the Backend URL from Phase 2.4.

3. Click **Save**

#### 3.4 Redeploy with Environment Variables

1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Select **Redeploy**
4. This will rebuild with the new environment variables

#### 3.5 Get Your Frontend URL

1. In Vercel dashboard, you'll see your deployment
2. The URL appears at the top (e.g., `https://kajiado-aquashield.vercel.app`)
3. Copy this URL

#### 3.6 Update Backend CORS

Go back to Railway and update:

```
FRONTEND_URL = https://kajiado-aquashield.vercel.app
```

### Phase 4: Testing

#### 4.1 Test Frontend Access

1. Visit your Vercel URL: `https://kajiado-aquashield.vercel.app`
2. You should see the AquaShield dashboard
3. Check the browser console for any errors

#### 4.2 Test API Connection

1. On the dashboard, click **Refresh**
2. You should see weather data load
3. Check that the risk level displays correctly

#### 4.3 Test SMS Alert Simulation

1. Go to the **Alert Simulator** panel (bottom left)
2. Make sure **SMS** tab is active
3. Keep default values or customize the message
4. Click **Send SMS Alert**
5. Check the **Alert Log** panel (right side) for the alert

#### 4.4 Test Webhook Simulation

1. Click the **Webhook** tab in Alert Simulator
2. Keep default JSON payload or customize
3. Click **Send Webhook Alert**
4. Verify it appears in the Alert Log

#### 4.5 Test Auto-Refresh

1. Dashboard should auto-fetch new weather data every 30 seconds
2. You'll see "Last updated" timestamp at bottom
3. Verify it updates periodically

### Phase 5: Monitor and Maintain

#### 5.1 Set Up Monitoring

**Railway:**
- Go to project → **Deployments**
- Monitor current status
- Check logs for errors

**Vercel:**
- Go to project → **Analytics**
- Monitor page performance
- Check deployment logs

#### 5.2 Update Weather-AI Credentials

If your API credentials change:

1. Go to Railway dashboard
2. Click your project → **Variables**
3. Update `WEATHER_AI_KEY` and `WEATHER_AI_ENDPOINT`
4. Railway auto-redeploys with new credentials

#### 5.3 Update Frontend

When you push changes to GitHub:

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

Both Vercel and Railway automatically redeploy on push.

#### 5.4 Database Persistence (Important!)

SQLite on Railway is ephemeral by default. To persist data:

1. Go to Railway dashboard
2. Click your project
3. Go to **Plugins** → **Add Plugin**
4. Add **PostgreSQL** (recommended) or mount persistent volume
5. Update backend `DATABASE_PATH` to PostgreSQL connection string

Or use persistent volume:

1. In Railway, go to **Settings**
2. Add **Volume Mount**
3. Mount to `/data` directory
4. Update `DATABASE_PATH = /data/aquashield.db`

## Troubleshooting

### Issue: "CORS Error" in browser console

**Solution:**
1. Check `FRONTEND_URL` is set correctly in Railway
2. Ensure URL has `https://` prefix
3. Check that `NEXT_PUBLIC_API_BASE_URL` in Vercel points to Railway
4. Wait 5 minutes for Railway to redeploy with new settings

### Issue: "Failed to fetch telemetry"

**Solution:**
1. Verify Weather-AI credentials are correct in Railway
2. Check if API endpoint is accessible: Visit `WEATHER_AI_ENDPOINT` in browser
3. Check Railway logs for error details
4. Fallback should show mock data

### Issue: Frontend shows blank page

**Solution:**
1. Check browser console for JavaScript errors
2. Verify `NEXT_PUBLIC_API_BASE_URL` is set in Vercel
3. Check Vercel deployment logs
4. Try clearing browser cache and hard refresh (Ctrl+Shift+R)

### Issue: Alerts not appearing in log

**Solution:**
1. Check browser console for form errors
2. Verify backend is running: Check Railway logs
3. Confirm `DATABASE_PATH` is writable
4. Check `/docs` endpoint on Railway for API testing

### Issue: Auto-refresh not working

**Solution:**
1. Check browser console for errors
2. Ensure `NEXT_PUBLIC_API_BASE_URL` is correct
3. Check network tab in DevTools for failed requests
4. Verify backend is responding to requests

## Performance Optimization

### Frontend (Vercel)

- ✅ Automatic image optimization
- ✅ Code splitting and lazy loading
- ✅ Global CDN distribution
- ✅ Automatic minification
- Monitor with Vercel Analytics

### Backend (Railway)

- ✅ Uvicorn production mode auto-enabled
- ✅ Async database operations
- Monitor with Railway logs and metrics

## Security Best Practices

✅ **Implemented:**
- API key stored in environment variables (not in code)
- CORS configured for specific origins
- HTTPS enforced on both Vercel and Railway
- Pydantic validation on all API inputs

✅ **Recommended:**
- Add rate limiting to API endpoints
- Use API key rotation regularly
- Monitor Railway and Vercel logs for suspicious activity
- Set up email alerts for deployment failures
- Use GitHub branch protection rules

## Costs

**Vercel**: Free tier includes 100 GB bandwidth/month (sufficient for most use cases)

**Railway**: Free tier includes $5 credit/month
- Estimate: ~$0-5/month for this application

Total estimated cost: **Free to $5/month**

## Support

- **Vercel Support**: https://vercel.com/help
- **Railway Support**: https://railway.app/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Next.js Docs**: https://nextjs.org/docs

---

**Deployment Status**: Your application is now live! 🎉

Next steps:
1. Share your frontend URL with stakeholders
2. Set up monitoring and alerts
3. Plan for data persistence if needed
4. Consider adding authentication for production
