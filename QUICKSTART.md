# Kajiado AquaShield - Quick Start Guide

Get up and running in 5 minutes! 🚀

## Local Development (5 minutes)

### 1. Install Dependencies

```bash
# Frontend
pnpm install

# Backend
cd backend && pip install -r requirements.txt && cd ..
```

### 2. Set Environment Variables

```bash
# Frontend
echo 'NEXT_PUBLIC_API_BASE_URL=http://localhost:8000' > .env.local

# Backend
cd backend
echo 'WEATHER_AI_ENDPOINT=https://api.weather-ai.example.com/v1/current
WEATHER_AI_KEY=your-api-key-here
DATABASE_PATH=/tmp/aquashield.db
FRONTEND_URL=http://localhost:3000
PORT=8000' > .env
cd ..
```

### 3. Start Backend (Terminal 1)

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend ready at: http://localhost:8000

### 4. Start Frontend (Terminal 2)

```bash
pnpm dev
```

✅ Frontend ready at: http://localhost:3000

### 5. Test the App

1. Open http://localhost:3000
2. Click **Refresh** to fetch weather data
3. Click **SMS** tab and send a test alert
4. View alerts in the **Alert Log** panel

Done! 🎉

---

## Production Deployment (15 minutes)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy Backend to Railway (5 min)

1. Go to [railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub**
3. Select your repository
4. Add environment variables:
   ```
   WEATHER_AI_ENDPOINT=your-api-endpoint
   WEATHER_AI_KEY=your-api-key
   DATABASE_PATH=/data/aquashield.db
   FRONTEND_URL=https://your-vercel-url.vercel.app
   ```
5. Click Deploy
6. Copy your Railway URL (e.g., `https://app.railway.app`)

### Step 3: Deploy Frontend to Vercel (5 min)

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Select your repository
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-railway-url
   ```
5. Click Deploy

### Step 4: Update Backend CORS

1. Go back to Railway dashboard
2. Update `FRONTEND_URL` to your Vercel URL
3. Save and redeploy

✅ Your app is live!

---

## API Endpoints Reference

### Telemetry
```bash
# Get current weather and risk level
curl http://localhost:8000/api/v1/telemetry

# Get historical data
curl http://localhost:8000/api/v1/telemetry/history?limit=10
```

### Alerts
```bash
# Send SMS alert
curl -X POST http://localhost:8000/api/v1/sms/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+254123456789",
    "message": "Maji yanazidi!"
  }'

# Send webhook alert
curl -X POST http://localhost:8000/api/v1/webhook/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "event": "flood_alert",
      "severity": "critical"
    }
  }'

# Get all alert logs
curl http://localhost:8000/api/v1/logs
```

### Health
```bash
curl http://localhost:8000/health
```

---

## Swahili Messages

### Critical Risk
```
🚨 ONYO MKUBWA: Hali ya maji ni hatari sana. 
Jua maji yenyewe katika nyumba yako na ujihadari.
```

### Moderate Risk
```
⚠️ ONYO: Hakuna kulingana. Kuwa na ujihadari 
kwa sababu ya mvua inayoweza kuwa na hatari.
```

### Low Risk
```
✅ SALAMA: Hali ya maji ni salama kwa sasa. 
Endelea kusoma habari za sasa.
```

---

## Environment Variables Checklist

### Frontend (.env.local)
- [ ] `NEXT_PUBLIC_API_BASE_URL` set to backend URL

### Backend (.env)
- [ ] `WEATHER_AI_ENDPOINT` set to actual API endpoint
- [ ] `WEATHER_AI_KEY` set to your API key
- [ ] `DATABASE_PATH` set to writable location
- [ ] `FRONTEND_URL` set to frontend URL (production)

---

## Common Issues

| Issue | Solution |
|-------|----------|
| CORS Error | Check `NEXT_PUBLIC_API_BASE_URL` in frontend is correct |
| API not responding | Verify `WEATHER_AI_ENDPOINT` and `WEATHER_AI_KEY` in backend |
| Alerts not saving | Check `DATABASE_PATH` is writable |
| Blank frontend page | Check browser console and Vercel logs |
| Auto-refresh not working | Verify backend URL is accessible from frontend |

---

## File Structure Overview

```
kajiado-aquashield/
├── app/                    # Next.js pages
├── components/             # React components
├── backend/                # FastAPI server
│   ├── app/main.py        # Main API
│   ├── requirements.txt    # Dependencies
│   └── .env               # Environment config
├── .env.local             # Frontend env (local)
├── vercel.json            # Vercel config
├── railway.json           # Railway config
└── README.md              # Full documentation
```

---

## Next Steps

1. ✅ Run locally and test
2. ✅ Add Weather-AI credentials
3. ✅ Push to GitHub
4. ✅ Deploy to Vercel + Railway
5. ✅ Share with team

---

**Questions?** Check `README.md` for detailed documentation or `DEPLOYMENT.md` for step-by-step deployment guide.

Happy monitoring! 🌦️💧
