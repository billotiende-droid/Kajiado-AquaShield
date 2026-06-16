# Kajiado AquaShield

**Real-time flash-flood risk assessment and alert system for Kajiado County, Kenya.**

Live weather data from [Stormglass.io](https://stormglass.io) feeds a multi-factor risk engine that computes flood probability across five Kajiado sub-counties. Risk assessments are stored in SQLite, served via a FastAPI REST API, and displayed on a Next.js emergency operations dashboard with bilingual (English/Swahili) support.

---

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────────────────┐     ┌──────────────────┐
│                     │     │                                  │     │                  │
│  Stormglass.io API  │────▶│  FastAPI Backend (Railway)       │────▶│  SQLite Database  │
│  (weather data)     │     │                                  │     │                  │
│                     │     │  ┌────────────────────────────┐  │     ├──────────────────┤
└─────────────────────┘     │  │ weather_service.py         │  │     │ weather_data     │
                            │  │   ↳ async Stormglass client│  │     │ risk_assessments │
                            │  │   ↳ fallback → simulated    │  │     │ sms_alerts       │
                            │  └────────────────────────────┘  │     └──────────────────┘
                            │                                  │
                            │  ┌────────────────────────────┐  │
                            │  │ risk_engine.py              │  │
                            │  │   ↳ rainfall/humidity/wind │  │
                            │  │   ↳ trend analysis          │  │
                            │  │   ↳ risk_level → LOW-       │  │
                            │  │     CRITICAL                │  │
                            │  └────────────────────────────┘  │
                            │                                  │
                            │  ┌────────────────────────────┐  │
                            │  │ main.py (lifespan)          │  │
                            │  │   ↳ init_database()         │  │
                            │  │   ↳ seed_initial_data()     │  │
                            │  │   ↳ background 5-min fetch  │  │
                            │  └────────────────────────────┘  │
                            │                                  │
                            └──────┬───────────────────────────┘
                                   │
                                   │ REST API (JSON)
                                   │
                            ┌──────▼───────────────────────────┐
                            │                                  │
                            │  Next.js Frontend (Vercel)        │
                            │    ↳ real-time dashboard          │
                            │    ↳ SMS alert simulator          │
                            │    ↳ risk map                     │
                            │    ↳ 30-second auto-refresh       │
                            │                                  │
                            └──────────────────────────────────┘
```

---

## Fallback Design (Production Hardening)

Every data path has at least one fallback to prevent 404s and service degradation:

| Layer | Primary | Fallback | Trigger |
|-------|---------|----------|---------|
| **Weather data** | Stormglass.io API (`weather_service.py`) | Simulated baseline data (hardcoded realistic values) | API key missing, network error, HTTP 4xx/5xx, timeout |
| **Risk assessments** | Stored in SQLite (`risk_assessments` table) | Computed on-the-fly from weather data (`_ensure_risk_assessment()`) | No row in DB for requested location |
| **Database seeding** | OR skip if data exists (`seed_initial_data()`) | Static baseline for all 5 zones | DB empty (fresh deploy on Railway's ephemeral storage) |
| **Background fetch** | Async task on startup + every 5 minutes | Silent skip; risk assessments remain at their last-known state | Stormglass API unavailable |

### The self-healing endpoint (`risk.py`)

```python
def _ensure_risk_assessment(location: str) -> dict:
    # Tier 1 — return stored assessment (fast path)
    risk = get_latest_risk_assessment(location)
    if risk:
        return risk

    # Tier 2 — compute from weather data if any exists
    weather_list = get_latest_weather(location, limit=5)
    if weather_list:
        computed = analyze_risk(weather_list[0], weather_list)
        insert_risk_assessment(location, computed)
        return computed

    # Tier 3 — seed the database and retry
    seed_initial_data()
    risk = get_latest_risk_assessment(location)
    if risk:
        return risk

    # Last resort — explicit 404
    raise HTTPException(status_code=404, ...)
```

No path in the app returns a bare 404 or crashes the process on transient API failure.

---

## Technology Stack

### Frontend (Vercel)
- **Next.js 15** — React framework with App Router
- **TypeScript** — type-safe JavaScript
- **Tailwind CSS** — utility-first styling
- **Framer Motion** — animations
- **Axios** — HTTP client
- **Lucide React** — icons

### Backend (Railway)
- **FastAPI** — async Python web framework
- **Uvicorn** — ASGI server
- **SQLite 3** — embedded database (ephemeral on Railway)
- **httpx** — async HTTP client for Stormglass
- **Pydantic v2** — request/response validation

### External APIs
- **Stormglass.io** — marine weather API (temperature, humidity, precipitation, wind speed, cloud cover)

---

## Backend Modules

| Module | File | Responsibility |
|--------|------|----------------|
| **Orchestrator** | `main.py` | App lifecycle, CORS, router registration, background fetch loop |
| **Database** | `database.py` | SQLite schema (3 tables), CRUD, `_resolve_location` aliasing, `seed_initial_data()` |
| **Weather service** | `weather_service.py` | Async Stormglass client with coords lookup & fallback mapping |
| **Weather router** | `weather.py` | `GET /telemetry`, `POST /telemetry/fetch`, `POST /telemetry/fetch-all`, `POST /telemetry/submit` |
| **Risk router** | `risk.py` | `GET /risk/{location}`, `POST /risk/assessment` — both use `_ensure_risk_assessment()` |
| **Alert router** | `alerts.py` | `POST /sms/alert`, `GET /sms/alerts`, `POST /sms/alert/{id}/status` |
| **Dashboard router** | `dashboard.py` | `GET /dashboard/summary` — aggregates risk across all 5 zones |
| **Risk engine** | `risk_engine.py` | Weighted multi-factor flood risk calculator (rainfall 50%, humidity 20%, wind 15%, temperature 15%) |

### Database Schema

```sql
-- Weather observations
weather_data (id, timestamp, location, temperature, humidity, rainfall, wind_speed, weather_condition, raw_data)

-- Computed risk assessments
risk_assessments (id, timestamp, location, risk_level, risk_score, flash_flood_probability, affected_areas, recommended_action, details)

-- Queued SMS alerts
sms_alerts (id, timestamp, recipient, message, status, location, risk_level)
```

**Location aliasing**: `_resolve_location("Kajiado")` → `"Kajiado Central"`. Empty DB triggers `seed_initial_data()` which inserts baseline observations and risk assessments for all five sub-counties.

### Kajiado Monitoring Zones

| Sub-county | Latitude | Longitude |
|------------|----------|-----------|
| **Kajiado Central** | -1.9992 | 36.7764 |
| **Magadi** | -2.2850 | 36.3425 |
| **Loitokitok** | -3.2833 | 37.6000 |
| **Namanga** | -2.5000 | 37.1333 |
| **Isinya** | -2.0000 | 37.0000 |

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Health & Discovery

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service health (returns `{"status":"healthy",...}`) |
| `GET` | `/` | Redirects to Swagger `/docs` |

### Weather / Telemetry

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/telemetry?location=Kajiado Central` | Latest weather reading for a location |
| `GET` | `/telemetry/{location}?limit=10` | Weather history for a location |
| `GET` | `/telemetry/history?location=...&limit=20` | Same as above (alias) |
| `POST` | `/telemetry/submit` | Submit manual weather reading (triggers risk calc) |
| `POST` | `/telemetry/fetch` | **Fetch live from Stormglass** for a single location (falls back to simulated on error) |
| `POST` | `/telemetry/fetch-all` | Fetch live Stormglass data for **all 5 Kajiado zones** |

**Request body** for `POST /telemetry/fetch`:
```json
{
  "location": "Kajiado Central",
  "api_key": null
}
```

### Risk Assessment

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/risk/{location}` | Risk assessment for a location (self-healing — computes on-the-fly if missing) |
| `POST` | `/risk/assessment` | Risk assessment by location (same as GET) |

### Alerts

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sms/alert` | Send an SMS alert into the queue |
| `GET` | `/sms/alerts?location=...&limit=50` | List SMS alerts |
| `POST` | `/sms/alert/{id}/status` | Update alert status |

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard/summary` | Aggregated risk summary across all zones |

---

## Risk Calculation Engine

The `RiskCalculator` in `risk_engine.py` computes a weighted risk score:

| Factor | Weight | Score Ranges |
|--------|--------|-------------|
| Rainfall | **50%** | 0.0 (no rain) → 1.0 (≥125mm) |
| Humidity | **20%** | 0.0 (<50%) → 1.0 (>100%) |
| Wind speed | **15%** | 0.0 (<20 km/h) → 1.0 (>80 km/h) |
| Temperature | **15%** | 0.0 (moderate) → max 0.8 (extreme) |

Final risk score is clamped to `[0.0, 1.0]` and mapped to a level:

| Score | Level | Colour |
|-------|-------|--------|
| < 0.2 | **LOW** | 🟢 Green |
| 0.2 – 0.4 | **MODERATE** | 🟡 Yellow |
| 0.4 – 0.6 | **HIGH** | 🟠 Orange |
| 0.6 – 0.8 | **VERY HIGH** | 🔴 Red |
| ≥ 0.8 | **CRITICAL** | 🔴 Pulsing Red |

A **trend multiplier** (1.0 – 1.3) is applied when historical data shows rising rainfall over the last 3–6 observations.

---

## Local Development

### Prerequisites
- Python 3.9+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Stormglass credentials:
#   WEATHER_AI_ENDPOINT=https://api.stormglass.io/v2/weather/point
#   WEATHER_AI_KEY=your-key-here

# Start the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server starts at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

**What happens on startup**:
1. `init_database()` — creates SQLite tables (`backend/data/aquashield.db`)
2. `seed_initial_data()` — inserts baseline weather + risk data if DB is empty
3. Background async loop — fetches Stormglass for all 5 zones immediately, then every 5 minutes

### Frontend

```bash
pnpm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

pnpm run dev
```

Frontend at `http://localhost:3000`.

---

## Deployment

### Backend (Railway)

The repo includes `railway.json` and `Procfile`. Railway auto-deploys on push to `main`.

**Required environment variables on Railway:**

| Variable | Example | Notes |
|----------|---------|-------|
| `WEATHER_AI_ENDPOINT` | `https://api.stormglass.io/v2/weather/point` | Stormglass API endpoint |
| `WEATHER_AI_KEY` | `your-key` | Stormglass API key |
| `DATABASE_PATH` | `/tmp/aquashield.db` | Railway ephemeral storage — reset on each deploy |
| `FRONTEND_URL` | `https://your-app.vercel.app` | For CORS |

### Frontend (Vercel)

Set `NEXT_PUBLIC_API_BASE_URL` to your Railway backend URL.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Stormglass.io weather API
WEATHER_AI_ENDPOINT=
WEATHER_AI_KEY=

# SQLite database path (ephemeral on Railway)
DATABASE_PATH=/tmp/aquashield.db

# CORS origin
FRONTEND_URL=http://localhost:3000

# Server port
PORT=8000
```

### Frontend (`app/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# For production:
# NEXT_PUBLIC_API_BASE_URL=
```

---

## SMS Alert Templates (Swahili)

```text
🚨 ONYO: Maji yanazidi kwa Kajiado. Jua mafuta yako na utulie.
🚨 ONYO MKUBWA: Hamia haraka! Maafa ya maji yanayokuja. Endelea kwa salama.
✅ SALAMA: Hali ya maji imebaki salama. Endelea na shughuli zako kama kawaida.
```

---

## Production Notes

- **SQLite is ephemeral** on Railway — every deploy creates a fresh database. The `seed_initial_data()` and background fetch loop ensure the DB is never empty for more than a few seconds.
- **Stormglass API key** must be set in Railway environment variables. Without it, the system falls back to simulated weather data (service remains fully operational).
- **Automatic refresh**: The frontend polls every 30 seconds. The backend fetches Stormglass every 5 minutes (configurable by changing `asyncio.sleep(300)` in `main.py`).
- **CORS**: Set to allow all origins in development. For production, restrict `allow_origins` in `main.py` to your frontend domain.

---

## Project Structure

```
├── app/                          # Next.js frontend
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Entry point (renders Dashboard)
├── components/                   # React components
│   ├── dashboard.tsx            # Main dashboard orchestration
│   ├── telemetry-card.tsx       # Weather metric cards
│   ├── risk-indicator.tsx       # Animated risk level indicator
│   ├── alert-simulator.tsx      # SMS/webhook simulator panel
│   ├── risk-score-display.tsx   # Risk score with progress bar
│   ├── risk-assessment-map.tsx  # Clickable location map
│   ├── affected-areas-list.tsx  # Flood-affected area list
│   ├── warning-banner.tsx       # Warning/info/alert banners
│   ├── alert-console.tsx        # Alert log viewer
│   ├── footer-section.tsx       # Footer with status
│   └── location-selector.tsx    # Location picker
├── backend/                      # FastAPI backend
│   ├── Procfile                 # Railway deployment entrypoint
│   ├── railway.json             # Railway build config
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment template
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # App orchestrator, lifespan, background fetch
│   │   ├── database.py          # SQLite CRUD, location aliasing, seed data
│   │   ├── schemas.py           # Pydantic models
│   │   ├── risk_engine.py       # Flood risk calculator
│   │   ├── weather_service.py   # Async Stormglass API client
│   │   ├── weather.py           # /api/v1/telemetry endpoints
│   │   ├── risk.py              # /api/v1/risk endpoints
│   │   ├── alerts.py            # /api/v1/sms endpoints
│   │   └── dashboard.py         # /api/v1/dashboard endpoint
│   └── data/                    # SQLite database (gitignored)
└── [config files]               # vercel.json, railway.json, tsconfig.json, etc.
