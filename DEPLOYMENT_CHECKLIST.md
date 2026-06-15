# Kajiado AquaShield - Deployment Checklist

Complete this checklist to ensure your application is properly deployed and configured.

## Pre-Deployment (Local Testing)

- [ ] **Backend running locally**
  ```bash
  cd backend && source venv/bin/activate && \
  python -m uvicorn app.main:app --reload
  ```
  Expected: Server runs on `http://localhost:8000`

- [ ] **Frontend running locally**
  ```bash
  pnpm dev
  ```
  Expected: App loads at `http://localhost:3000`

- [ ] **API connectivity**

  - [ ] Frontend can fetch weather data (dashboard loads)
  - [ ] SMS alert creation works (via `/api/sms-alert`)
  - [ ] SMS alerts can be listed (via `/api/sms-alerts`)

- [ ] **Environment variables**
  - [ ] `.env.local` exists with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` (or the correct local backend URL)
  - [ ] `backend/.env` exists with Weather-AI credentials
  - [ ] All required vars set (see `.env.example` files)

- [ ] **Database initialization**
  - [ ] SQLite database creates on first API call
  - [ ] Alert logs persist after alert simulation
  - [ ] Can retrieve logs via `/api/v1/logs`

## GitHub Setup

- [ ] **GitHub account created**
  - Go to https://github.com/join

- [ ] **Repository created**
  - Name: `kajiado-aquashield`
  - Visibility: Public
  - Initialize without README (we have our own)

- [ ] **Code pushed to GitHub**
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/kajiado-aquashield.git
  git branch -M main
  git push -u origin main
  ```

- [ ] **Verify files on GitHub**
  - [ ] All source files visible
  - [ ] `README.md`, `DEPLOYMENT.md`, `QUICKSTART.md` present
  - [ ] `backend/` folder visible
  - [ ] `app/` and `components/` folders visible

## Railway Backend Deployment

- [ ] **Railway account created**
  - Go to https://railway.app
  - Sign up with GitHub

- [ ] **Railway project created**
  - Click "New Project"
  - Select "Deploy from GitHub"
  - Authorize Railway to access your GitHub
  - Select `kajiado-aquashield` repository

- [ ] **Environment variables set in Railway**
  - [ ] `WEATHER_AI_ENDPOINT` = your Weather-AI API endpoint
  - [ ] `WEATHER_API_KEY` = your Weather-AI API key
  - [ ] `DATABASE_PATH` = `/data/aquashield.db`
  - [ ] `FRONTEND_URL` = (leave blank for now, will update after Vercel)

- [ ] **Backend deployment successful**
  - [ ] Railway shows "Deployment Succeeded"
  - [ ] Check logs for errors (should see Uvicorn startup message)

- [ ] **Backend publicly accessible**
  - [ ] Copy public URL from Railway dashboard
  - [ ] Visit `https://your-railway-url/health`
  - [ ] Should return: `{"status": "healthy", "timestamp": "..."}`

- [ ] **API documentation accessible**
  - [ ] Visit `https://your-railway-url/docs`
  - [ ] Should show FastAPI interactive API docs

## Vercel Frontend Deployment

- [ ] **Vercel account created**
  - Go to https://vercel.com
  - Sign up with GitHub

- [ ] **Vercel project created**
  - Click "Add New"
  - Select "Project"
  - Select `kajiado-aquashield` from GitHub repos
  - Framework automatically detected as Next.js

- [ ] **Environment variable set in Vercel**
  - [ ] `NEXT_PUBLIC_API_BASE_URL` = your Railway public URL
  - [ ] Example: `https://kajiado-aquashield.railway.app`

- [ ] **Frontend deployment successful**
  - [ ] Vercel shows "Ready"
  - [ ] Click the preview URL
  - [ ] Dashboard loads successfully

- [ ] **Frontend publicly accessible**
  - [ ] Visit your Vercel URL
  - [ ] Click "Refresh" - should see weather data
  - [ ] Try SMS/webhook alerts
  - [ ] Verify alerts appear in log with JSON formatting

## Cross-Platform Testing

- [ ] **Frontend → Backend connectivity**
  - [ ] Open Vercel URL
  - [ ] Dashboard loads weather data
  - [ ] No CORS errors in browser console (check DevTools)
  - [ ] Auto-refresh works (data updates periodically)

- [ ] **Alerts in production**
  - [ ] Create SMS alert via API - appears in `/api/sms-alerts`
  - [ ] Update SMS alert status via API

- [ ] **Swahili content displays**
  - [ ] Water safety message shows in Swahili
  - [ ] Risk levels display correctly (CRITICAL/MODERATE/LOW)
  - [ ] Messages change based on risk level

## Update Backend CORS

Once Vercel frontend is deployed:

- [ ] **Get Vercel URL**
  - [ ] Copy from Vercel dashboard (e.g., `https://kajiado-aquashield.vercel.app`)

- [ ] **Update Railway FRONTEND_URL**
  - [ ] Go to Railway project settings
  - [ ] Update `FRONTEND_URL` = your Vercel URL
  - [ ] Save and trigger redeploy

- [ ] **Test CORS again**
  - [ ] Visit Vercel URL
  - [ ] Verify no CORS errors
  - [ ] Verify all API calls work

## Database Persistence (Optional but Recommended)

- [ ] **Decide on persistence strategy**
  - [ ] Option A: Keep ephemeral SQLite (data resets on deploy)
  - [ ] Option B: Mount persistent volume in Railway
  - [ ] Option C: Migrate to PostgreSQL plugin

If Option B or C:
- [ ] **Configure Railway storage/database**
  - [ ] Add volume mount or PostgreSQL plugin
  - [ ] Update `DATABASE_PATH` or connection string
  - [ ] Test alert persistence after redeploy

## Monitoring & Maintenance

- [ ] **Set up monitoring**
  - [ ] Railway: Enable email notifications for failed deployments
  - [ ] Vercel: Enable email notifications for failed deployments
  - [ ] Consider adding error tracking (Sentry optional)

- [ ] **Test auto-deployment**
  - [ ] Make small change to code
  - [ ] Push to GitHub
  - [ ] Verify both Vercel and Railway auto-deploy
  - [ ] Confirm changes live in production

- [ ] **Document your setup**
  - [ ] Write down URLs:
    - [ ] Frontend URL: ___________________
    - [ ] Backend URL: ___________________
    - [ ] GitHub repo: ___________________
  - [ ] Save this checklist for future reference

- [ ] **Share with team**
  - [ ] Share frontend URL with stakeholders
  - [ ] Provide README link for documentation
  - [ ] Explain where to check system status (Railway/Vercel dashboards)

## Security Checklist

- [ ] **API keys secure**
  - [ ] Weather-AI key only in Railway env vars (NOT in code)
  - [ ] No sensitive credentials in GitHub commits
  - [ ] `.env.example` has placeholders, not actual keys

- [ ] **CORS configured**
  - [ ] Backend only allows requests from Vercel domain
  - [ ] No `allow_origins=["*"]` in production (use specific domain)

- [ ] **HTTPS enabled**
  - [ ] Vercel auto-provides HTTPS
  - [ ] Railway auto-provides HTTPS
  - [ ] No HTTP (unencrypted) URLs in production

- [ ] **Rate limiting (optional)**
  - [ ] Consider adding rate limiting to API endpoints
  - [ ] Protect against abuse

## Final Verification

Before considering deployment complete:

- [ ] Visit frontend URL and test all features:
  - [ ] Dashboard loads
  - [ ] Weather data displays
  - [ ] Risk indicator works (based on fetched data)
  - [ ] SMS alert creation works (via API)
  - [ ] SMS alerts display correctly (via API)
  - [ ] Auto-refresh works (30-second interval)
  - [ ] Manual refresh works
  - [ ] Swahili messages display correctly

- [ ] Test on different devices:
  - [ ] Desktop (Chrome, Firefox, Safari)
  - [ ] Mobile (iOS Safari, Chrome mobile)
  - [ ] Tablet (if applicable)

- [ ] Performance check:
  - [ ] Page loads quickly
  - [ ] No console errors
  - [ ] No memory leaks (open DevTools, watch memory)

## Success!

If all items are checked, your Kajiado AquaShield application is successfully deployed! 🎉

### Next Steps

1. **Promote Usage**
   - Share the dashboard URL with stakeholders
   - Train users on how to interpret risk levels
   - Explain SMS/webhook alert features

2. **Monitor Operations**
   - Check Railway logs daily for errors
   - Review alert log for activity patterns
   - Monitor API performance

3. **Plan Enhancements**
   - Real SMS integration (beyond simulation)
   - Real webhook integration with external systems
   - User authentication and roles
   - Historical data analysis
   - Email alerts in addition to SMS

4. **Maintenance Schedule**
   - Weekly: Check deployment logs
   - Monthly: Review Weather-AI API changes
   - Quarterly: Update dependencies

---

**Deployment Date**: ________________
**Deployed By**: ________________
**Environment**: Production

For troubleshooting, see `DEPLOYMENT.md` for detailed guidance.
