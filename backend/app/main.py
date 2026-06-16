"""
AquaShield FastAPI Backend - Main Orchestrator
"""
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from .database import init_database, seed_initial_data
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
    seed_initial_data()

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
