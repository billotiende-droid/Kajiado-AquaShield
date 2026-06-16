"""
AquaShield FastAPI Backend - Main Orchestrator
"""
import asyncio
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from .database import init_database, seed_initial_data, get_latest_weather, insert_weather_data, insert_risk_assessment
from .risk_engine import analyze_risk
from .weather_service import fetch_weather
from .risk_engine import KAJIADO_ZONES
from . import weather, risk, alerts, dashboard

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

async def _background_fetch_loop():
    """Periodically fetch Stormglass weather for all zones every 5 minutes."""
    locations = list(KAJIADO_ZONES.keys())
    logger.info("Fetching initial Stormglass data for %d zones...", len(locations))
    for location in locations:
        try:
            weather = await fetch_weather(location)
            if weather:
                history = get_latest_weather(location, limit=6)
                risk = analyze_risk(weather, history)
                insert_weather_data(location, weather)
                insert_risk_assessment(location, risk)
                logger.info("Fetched Stormglass data for %s: risk=%s", location, risk["risk_level"])
        except Exception as e:
            logger.warning("Initial Stormglass fetch failed for %s: %s", location, e)

    # Then every 5 minutes
    while True:
        await asyncio.sleep(300)
        logger.info("Periodic Stormglass refresh starting...")
        for location in locations:
            try:
                weather = await fetch_weather(location)
                if weather:
                    history = get_latest_weather(location, limit=6)
                    risk = analyze_risk(weather, history)
                    insert_weather_data(location, weather)
                    insert_risk_assessment(location, risk)
            except Exception as e:
                logger.warning("Periodic Stormglass fetch failed for %s: %s", location, e)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: init DB, seed, start background weather fetcher."""
    init_database()
    seed_initial_data()
    # Kick off background fetch loop without blocking startup
    task = asyncio.create_task(_background_fetch_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="AquaShield",
    description="Flash-flood risk assessment engine for Kajiado County, Kenya",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "AquaShield Backend"
    }

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

app.include_router(weather.router, prefix="/api/v1")
app.include_router(risk.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
