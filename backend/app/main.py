"""
Kajiado AquaShield API - Production Ready
FastAPI service for telemetry ingestion and alert simulation.
"""
import os
import sqlite3
import json
from datetime import datetime
from typing import Optional, Dict, Any
from contextlib import contextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import logging

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Kajiado AquaShield API",
    description="Weather monitoring and alert system for Kajiado region",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
WEATHER_AI_ENDPOINT = os.getenv("WEATHER_AI_ENDPOINT", "https://api.weather-ai.example.com/v1/current")
WEATHER_AI_KEY = os.getenv("WEATHER_AI_KEY", "your-api-key-here")
DATABASE_PATH = os.getenv("DATABASE_PATH", "/tmp/aquashield.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Request/Response Models
class TelemetryResponse(BaseModel):
    temperature: float
    precipitation: float
    cloud_density: float
    wind_speed: float
    humidity: float
    risk_level: str
    timestamp: str
    location: str = "Kajiado"

class SMSSimulationRequest(BaseModel):
    message: str
    phone_number: Optional[str] = "+254XXXXXXXXX"

class WebhookSimulationRequest(BaseModel):
    webhook_url: Optional[str] = None
    payload: Dict[str, Any]

class AlertLog(BaseModel):
    id: Optional[int] = None
    alert_type: str  # "sms" or "webhook"
    content: str
    timestamp: str
    status: str = "simulated"

# Database initialization
def init_database():
    """Initialize SQLite database with required tables."""
    os.makedirs(os.path.dirname(DATABASE_PATH) if os.path.dirname(DATABASE_PATH) else ".", exist_ok=True)
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Alert logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alert_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_type TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'simulated'
        )
    """)
    
    # Telemetry cache table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry_cache (
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
    """)
    
    conn.commit()
    conn.close()

@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def calculate_risk_level(precipitation: float, cloud_density: float) -> str:
    """Calculate flood risk level based on weather metrics."""
    if precipitation > 40 or cloud_density > 85:
        return "CRITICAL"
    elif precipitation > 25 or cloud_density > 65:
        return "MODERATE"
    else:
        return "LOW"

async def fetch_weather_data() -> Optional[Dict[str, Any]]:
    """Fetch weather data from Weather-AI API with error handling."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {"Authorization": f"Bearer {WEATHER_AI_KEY}"}
            response = await client.get(WEATHER_AI_ENDPOINT, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Weather API response received: {data}")
                return data
            else:
                logger.warning(f"Weather API returned status {response.status_code}")
                return None
    except Exception as e:
        logger.error(f"Weather API error: {str(e)}")
        return None

def get_mock_weather_data() -> Dict[str, Any]:
    """Return mock weather data for fallback/demo purposes."""
    return {
        "temperature": 26.5,
        "precipitation": 15.3,
        "cloud_density": 62.0,
        "wind_speed": 12.5,
        "humidity": 68.0
    }

# API Endpoints

@app.on_event("startup")
async def startup():
    """Initialize database on startup."""
    init_database()
    logger.info("Database initialized")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/v1/telemetry", response_model=TelemetryResponse)
async def get_telemetry():
    """
    Get current weather telemetry and calculate risk level.
    Falls back to mock data if API fails.
    """
    logger.info("Fetching telemetry data")
    
    # Try to fetch from Weather-AI API
    weather_data = await fetch_weather_data()
    
    # Fallback to mock data if API fails
    if not weather_data:
        logger.info("Using mock weather data")
        weather_data = get_mock_weather_data()
    
    # Extract and normalize data
    temperature = float(weather_data.get("temperature", 26.5))
    precipitation = float(weather_data.get("precipitation", 15.3))
    cloud_density = float(weather_data.get("cloud_density", 62.0))
    wind_speed = float(weather_data.get("wind_speed", 12.5))
    humidity = float(weather_data.get("humidity", 68.0))
    
    # Calculate risk level
    risk_level = calculate_risk_level(precipitation, cloud_density)
    timestamp = datetime.utcnow().isoformat()
    
    # Cache telemetry
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO telemetry_cache 
            (temperature, precipitation, cloud_density, wind_speed, humidity, risk_level, timestamp, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (temperature, precipitation, cloud_density, wind_speed, humidity, risk_level, timestamp, "Kajiado"))
        conn.commit()
    
    logger.info(f"Telemetry: Risk={risk_level}, Temp={temperature}°C, Rain={precipitation}mm")
    
    return TelemetryResponse(
        temperature=temperature,
        precipitation=precipitation,
        cloud_density=cloud_density,
        wind_speed=wind_speed,
        humidity=humidity,
        risk_level=risk_level,
        timestamp=timestamp,
        location="Kajiado"
    )

@app.post("/api/v1/sms/simulate")
async def simulate_sms(request: SMSSimulationRequest):
    """
    Simulate an SMS alert to a phone number.
    Logs the alert to the database.
    """
    logger.info(f"SMS Simulation: {request.phone_number}")
    
    timestamp = datetime.utcnow().isoformat()
    
    # Create JSON payload
    payload = {
        "type": "SMS",
        "recipient": request.phone_number,
        "message": request.message,
        "timestamp": timestamp,
        "language": "sw",  # Swahili
        "status": "simulated"
    }
    
    # Log to database
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO alert_logs (alert_type, content, timestamp, status)
            VALUES (?, ?, ?, ?)
        """, ("sms", json.dumps(payload), timestamp, "simulated"))
        conn.commit()
    
    logger.info(f"SMS logged: {json.dumps(payload)}")
    
    return {
        "success": True,
        "message": "SMS alert simulated",
        "payload": payload,
        "timestamp": timestamp
    }

@app.post("/api/v1/webhook/simulate")
async def simulate_webhook(request: WebhookSimulationRequest):
    """
    Simulate a webhook alert delivery.
    Logs the webhook payload to the database.
    """
    logger.info("Webhook Simulation")
    
    timestamp = datetime.utcnow().isoformat()
    
    # Add metadata to payload
    webhook_payload = {
        **request.payload,
        "timestamp": timestamp,
        "source": "aquashield",
        "status": "simulated"
    }
    
    # Log to database
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO alert_logs (alert_type, content, timestamp, status)
            VALUES (?, ?, ?, ?)
        """, ("webhook", json.dumps(webhook_payload), timestamp, "simulated"))
        conn.commit()
    
    logger.info(f"Webhook logged: {json.dumps(webhook_payload)}")
    
    return {
        "success": True,
        "message": "Webhook alert simulated",
        "payload": webhook_payload,
        "timestamp": timestamp
    }

@app.get("/api/v1/logs")
async def get_alert_logs(limit: int = 50):
    """
    Retrieve all simulated alert logs.
    Returns SMS and webhook simulation history.
    """
    logger.info(f"Fetching alert logs (limit={limit})")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, alert_type, content, timestamp, status
            FROM alert_logs
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
    
    logs = []
    for row in rows:
        try:
            content = json.loads(row[2])
        except json.JSONDecodeError:
            content = {"raw": row[2]}
        
        logs.append({
            "id": row[0],
            "alert_type": row[1],
            "content": content,
            "timestamp": row[3],
            "status": row[4]
        })
    
    logger.info(f"Returning {len(logs)} alert logs")
    
    return {
        "success": True,
        "count": len(logs),
        "logs": logs
    }

@app.get("/api/v1/telemetry/history")
async def get_telemetry_history(limit: int = 20):
    """Retrieve telemetry history from cache."""
    logger.info(f"Fetching telemetry history (limit={limit})")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT temperature, precipitation, cloud_density, wind_speed, humidity, risk_level, timestamp, location
            FROM telemetry_cache
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
    
    history = [
        {
            "temperature": row[0],
            "precipitation": row[1],
            "cloud_density": row[2],
            "wind_speed": row[3],
            "humidity": row[4],
            "risk_level": row[5],
            "timestamp": row[6],
            "location": row[7]
        }
        for row in rows
    ]
    
    return {
        "success": True,
        "count": len(history),
        "data": history
    }

@app.get("/")
async def root():
    """Root endpoint with API documentation."""
    return {
        "name": "Kajiado AquaShield API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "telemetry": "/api/v1/telemetry",
            "sms_simulate": "POST /api/v1/sms/simulate",
            "webhook_simulate": "POST /api/v1/webhook/simulate",
            "alert_logs": "/api/v1/logs",
            "telemetry_history": "/api/v1/telemetry/history"
        },
        "docs": "/docs"
    }
