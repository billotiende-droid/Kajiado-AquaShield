"""
AquaShield FastAPI Backend - Main Orchestrator
"""
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_database # Keep this import
from . import weather, risk, alerts, dashboard # Corrected import for routers

app = FastAPI(
    title="AquaShield",
    description="Flash-flood risk assessment engine for Kajiado County, Kenya",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_database()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "AquaShield Backend"
    }

@app.get("/")
def read_root():
    return {
        "name": "AquaShield",
        "endpoints": {
            "health": "/health",
            "weather": "/api/weather",
            "risk": "/api/risk",
            "sms": "/api/sms",
            "dashboard": "/api/dashboard"
        },
        "docs": "/docs"
    }

app.include_router(weather.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
