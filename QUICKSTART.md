
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

1. Open `http://localhost:3000`
2. Navigate to the dashboard.
3. The dashboard should automatically fetch weather data and display risk.
4. To submit new weather data, use the `/api/weather` POST endpoint (e.g., via `curl` or FastAPI's `/docs`).
5. To create an SMS alert, use the `/api/sms-alert` POST endpoint.
6. To view SMS alerts, use the `/api/sms-alerts` GET endpoint.

Done! 🎉

---

## API Endpoints Reference (Updated)

### Weather & Risk
```bash
# Submit new weather data
curl -X POST http://localhost:8000/api/weather \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Kajiado Central",
    "temperature": 22.5,
    "humidity": 75,
    "rainfall": 45.2,
    "wind_speed": 35.5,
    "weather_condition": "Rainy"
  }'

# Get latest weather data for a location
curl http://localhost:8000/api/weather/Kajiado%20Central

# Get latest risk assessment for a location
curl http://localhost:8000/api/risk/Kajiado%20Central

# Simulate fetching weather from external API (and process)
curl -X POST http://localhost:8000/api/weather/fetch \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Kajiado Central"
  }'
```

### SMS Alerts
```bash
# Create an SMS alert
curl -X POST http://localhost:8000/api/sms-alert \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "+254712345678",
    "message": "Flash flood alert: Evacuate immediately from low-lying areas",
    "location": "Kajiado Central",
    "risk_level": "CRITICAL"
  }'

# Get all SMS alerts
curl http://localhost:8000/api/sms-alerts

# Update SMS alert status
curl -X POST http://localhost:8000/api/sms-alert/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "alert_id": 1,
    "status": "sent"
  }'
```

### Dashboard
```bash
# Get overall dashboard summary
curl http://localhost:8000/api/dashboard/summary
```

### Health
```bash
curl http://localhost:8000/health
```

### Interactive API Docs
```bash
curl http://localhost:8000/docs
```

---

## Environment Variables Checklist

### Frontend (.env.local)
- [ ] `NEXT_PUBLIC_API_BASE_URL` set to backend URL (e.g., `http://localhost:8000` for local, `https://your-railway-app.railway.app` for production)

### Backend (.env)
- [ ] `WEATHER_API_ENDPOINT` set to actual API endpoint (e.g., `https://api.weather-ai.example.com/data`)
- [ ] `WEATHER_API_KEY` set to your API key
- [ ] `DATABASE_PATH` set to writable location (e.g., `/data/aquashield.db`)
- [ ] `FRONTEND_URL` set to frontend URL (e.g., `http://localhost:3000` for local, `https://your-vercel-app.vercel.app` for production)

---

## Common Issues

| Issue | Solution |
|-------|----------|
| CORS Error | Check `NEXT_PUBLIC_API_BASE_URL` in frontend is correct and `FRONTEND_URL` in backend is correct. |
| API not responding | Verify backend is running and check `WEATHER_API_ENDPOINT` and `WEATHER_API_KEY` in backend. |
| Alerts not saving | Check `DATABASE_PATH` is writable and database initialization was successful. |
| Blank frontend page | Check browser console and Vercel logs. |
| Auto-refresh not working | Verify backend URL is accessible from frontend. |

---

## File Structure Overview

```
kajiado-aquashield/
├── app/                    # Next.js pages
├── components/             # React components
├── backend/                # FastAPI server
│   ├── app/                # FastAPI application modules
│   │   ├── main.py         # Main API entry point
│   │   ├── database.py     # Database operations
│   │   ├── risk_engine.py  # Risk calculation logic
│   │   ├── schemas.py      # Pydantic models
│   │   ├── weather.py      # Weather API routes
│   │   ├── risk.py         # Risk API routes
│   │   ├── alerts.py       # SMS alerts API routes
│   │   └── dashboard.py    # Dashboard API routes
│   ├── requirements.txt    # Python dependencies
│   ├── Procfile            # Railway deployment config
│   ├── .env                # Environment config
│   └── initialize_db.py    # Script to manually initialize DB
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
