# Kajiado AquaShield - Weather Monitoring & Flood Alert System

A comprehensive real-time weather monitoring and flood alert system for the Kajiado region, featuring AI-powered risk assessment, SMS/webhook alert simulation, and bilingual (English/Swahili) interface.

## Features

- **Real-time Weather Monitoring**: Live weather data from Weather-AI API
- **Intelligent Risk Assessment**: Automatic flood risk calculation (Critical/Moderate/Low)
- **SMS Alert Simulation**: Test SMS alerts with Swahili language support
- **Webhook Integration**: Simulate webhook alert delivery for external systems
- **Live Alert Console**: View all simulated alerts in real-time with JSON logging
- **Auto-refresh Data**: 30-second auto-polling with manual refresh option
- **Bilingual Interface**: English dashboard + Swahili water safety messages
- **Emergency Operations UI**: Dark-themed, high-contrast interface optimized for crisis management

## Project Structure

```
├── app/                          # Next.js frontend
│   ├── page.tsx                 # Home page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── dashboard.tsx            # Main dashboard
│   ├── telemetry-card.tsx       # Weather metric cards
│   ├── risk-indicator.tsx       # Risk level display
│   ├── alert-simulator.tsx      # SMS/webhook simulator
│   └── alert-console.tsx        # Alert log viewer
├── backend/                      # FastAPI backend
│   ├── app/
│   │   └── main.py              # FastAPI application
│   ├── requirements.txt          # Python dependencies
│   ├── Procfile                 # Railway deployment config
│   └── .env.example             # Environment variables template
├── .env.example                 # Frontend env template
├── vercel.json                  # Vercel deployment config
├── railway.json                 # Railway deployment config
└── package.json                 # Node.js dependencies
```

## Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client for API calls
- **Lucide React** - Icon library

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI web server
- **SQLite** - Lightweight database for alert logging
- **Httpx** - Async HTTP client
- **Pydantic** - Data validation

### Deployment
- **Vercel** - Frontend hosting (Next.js optimized)
- **Railway** - Backend hosting (Python/Uvicorn)
- **GitHub** - Version control (auto-deploy on push)

## Local Development

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.9+ (for backend)
- pnpm (recommended) or npm

### Setup

#### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

#### 2. Create Environment Files

```bash
# Frontend environment
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_BASE_URL if needed

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env and add your Weather-AI credentials
```

#### 3. Start the Backend

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

#### 4. Start the Frontend (in a new terminal)

```bash
pnpm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Telemetry
- **GET** `/api/v1/telemetry` - Get current weather data and flood risk level
- **GET** `/api/v1/telemetry/history?limit=20` - Get historical telemetry data

### Alert Simulation
- **POST** `/api/v1/sms/simulate` - Simulate SMS alert
- **POST** `/api/v1/webhook/simulate` - Simulate webhook alert
- **GET** `/api/v1/logs?limit=50` - Get all simulated alerts

### Health Check
- **GET** `/health` - API health status
- **GET** `/` - API root with endpoint list

## Configuration

### Frontend Environment Variables

```env
# Required: Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# For production (Vercel)
NEXT_PUBLIC_API_BASE_URL=https://your-railway-app.railway.app
```

### Backend Environment Variables

```env
# Weather-AI API Configuration (REQUIRED)
WEATHER_AI_ENDPOINT=https://api.weather-ai.example.com/v1/current
WEATHER_AI_KEY=your-api-key-here

# Database Configuration
DATABASE_PATH=/tmp/aquashield.db

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Server Configuration
PORT=8000
```

## Deployment

### Deploy Frontend to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Set environment variables:
   - `NEXT_PUBLIC_API_BASE_URL`: Your Railway backend URL
5. Click Deploy

**Automatic deployments**: Every push to main branch will auto-deploy

### Deploy Backend to Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Create new project → Deploy from GitHub
4. Select your repository
5. Configure environment variables:
   - `WEATHER_AI_ENDPOINT`: Your Weather-AI API endpoint
   - `WEATHER_AI_KEY`: Your Weather-AI API key
   - `DATABASE_PATH`: `/data/aquashield.db` (or use Railway's ephemeral storage)
   - `PORT`: Leave blank (Railway manages this)
   - `FRONTEND_URL`: Your Vercel frontend URL

6. Click Deploy

**Automatic deployments**: Every push to main branch will auto-deploy

### Production Checklist

- [ ] Add Weather-AI API credentials to Railway
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` in Vercel to Railway backend URL
- [ ] Configure CORS in backend for production frontend URL
- [ ] Test SMS/webhook simulation on production
- [ ] Monitor application logs
- [ ] Set up error tracking (optional)

## Risk Calculation Logic

```python
if precipitation > 40mm OR cloud_density > 85%:
    risk_level = "CRITICAL"
elif precipitation > 25mm OR cloud_density > 65%:
    risk_level = "MODERATE"
else:
    risk_level = "LOW"
```

## Database Schema

### `alert_logs` Table
```sql
CREATE TABLE alert_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT NOT NULL,           -- "sms" or "webhook"
    content TEXT NOT NULL,              -- JSON payload
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'simulated'
)
```

### `telemetry_cache` Table
```sql
CREATE TABLE telemetry_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temperature REAL NOT NULL,
    precipitation REAL NOT NULL,
    cloud_density REAL NOT NULL,
    wind_speed REAL NOT NULL,
    humidity REAL NOT NULL,
    risk_level TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Kajiado'
)
```

## SMS Alert Example (Swahili)

```
🚨 ONYO: Maji yanazidi kwa Kajiado. Jua mafuta yako na utulie.

Joto: 26.5°C | Mvua: 45.2mm | Unyevu: 78%
Hatari: CRITICAL
```

## Webhook Payload Example

```json
{
  "event": "flood_alert",
  "region": "Kajiado",
  "severity": "critical",
  "temperature": 26.5,
  "precipitation": 45.2,
  "cloud_density": 85.5,
  "wind_speed": 12.5,
  "humidity": 78,
  "risk_level": "CRITICAL",
  "message": "Flood risk detected",
  "timestamp": "2024-06-15T14:30:00.000Z"
}
```

## API Fallback Behavior

If the Weather-AI API is unavailable or returns an error:
- Backend returns mock weather data (demo values)
- Risk level is calculated as normal
- Alert notifications continue to function
- Errors are logged but don't crash the service

This ensures the application remains operational during API outages.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## License

This project is licensed under the MIT License.
