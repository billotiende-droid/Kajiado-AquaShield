import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List

# Database path: backend/data/aquashield.db
DB_PATH = Path(__file__).parent.parent / "data" / "aquashield.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def init_database():
    """Initialize SQLite database with required tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Weather data table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS weather_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            location TEXT NOT NULL,
            temperature REAL,
            humidity REAL,
            rainfall REAL,
            wind_speed REAL,
            weather_condition TEXT,
            raw_data TEXT
        )
    """)
    
    # Risk assessment table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS risk_assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            location TEXT NOT NULL,
            risk_level TEXT,
            risk_score REAL,
            flash_flood_probability REAL,
            affected_areas TEXT,
            recommended_action TEXT,
            details TEXT
        )
    """)
    
    # SMS alerts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sms_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            recipient TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            location TEXT,
            risk_level TEXT
        )
    """)
    
    conn.commit()
    conn.close()

def get_connection():
    """Get database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def insert_weather_data(location: str, data: Dict) -> int:
    """Insert weather data into database."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO weather_data 
        (location, temperature, humidity, rainfall, wind_speed, weather_condition, raw_data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        location,
        data.get('temperature'),
        data.get('humidity'),
        data.get('rainfall'),
        data.get('wind_speed'),
        data.get('weather_condition'),
        json.dumps(data)
    ))
    
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return record_id

def insert_risk_assessment(location: str, assessment: Dict) -> int:
    """Insert risk assessment into database."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO risk_assessments 
        (location, risk_level, risk_score, flash_flood_probability, affected_areas, recommended_action, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        location,
        assessment.get('risk_level'),
        assessment.get('risk_score'),
        assessment.get('flash_flood_probability'),
        json.dumps(assessment.get('affected_areas', [])),
        assessment.get('recommended_action'),
        json.dumps(assessment)
    ))
    
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return record_id

def insert_sms_alert(recipient: str, message: str, location: str, risk_level: str, status: str = 'pending') -> int:
    """Insert SMS alert into database."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO sms_alerts (recipient, message, location, risk_level, status)
        VALUES (?, ?, ?, ?, ?)
    """, (recipient, message, location, risk_level, status))
    
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return record_id

def _resolve_location(location: str) -> str:
    if location == "Kajiado Central":
        return location
    if location == "Kajiado":
        return "Kajiado Central"
    return location

def get_latest_weather(location: str, limit: int = 10) -> List[Dict]:
    """Get latest weather data for a location."""
    conn = get_connection()
    cursor = conn.cursor()
    canonical = _resolve_location(location)
    fallback = "Kajiado" if canonical == "Kajiado Central" else ("Kajiado Central" if canonical == "Kajiado" else None)
    candidates = [canonical] + ([fallback] if fallback else [])
    placeholders = ",".join("?" * len(candidates))
    cursor.execute(f"""
        SELECT * FROM weather_data 
        WHERE location IN ({placeholders}) 
        ORDER BY timestamp DESC 
        LIMIT ?
    """, (*candidates, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_latest_risk_assessment(location: str) -> Optional[Dict]:
    """Get latest risk assessment for a location."""
    conn = get_connection()
    cursor = conn.cursor()
    canonical = _resolve_location(location)
    fallback = "Kajiado" if canonical == "Kajiado Central" else ("Kajiado Central" if canonical == "Kajiado" else None)
    candidates = [canonical] + ([fallback] if fallback else [])
    placeholders = ",".join("?" * len(candidates))
    cursor.execute(f"""
        SELECT * FROM risk_assessments 
        WHERE location IN ({placeholders}) 
        ORDER BY timestamp DESC 
        LIMIT 1
    """, tuple(candidates))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def seed_initial_data():
    """Seed database with initial baseline data if empty. Prevents 404 on fresh deploy."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM risk_assessments")
    count = cursor.fetchone()[0]
    if count > 0:
        conn.close()
        return
    
    from datetime import datetime
    now = datetime.now().isoformat()
    
    baseline = [
        {
            "location": "Kajiado Central",
            "risk_level": "LOW",
            "risk_score": 0.12,
            "flash_flood_probability": 0.08,
            "rainfall": 5.2, "humidity": 58, "wind_speed": 12.0, "temperature": 23.0,
        },
        {
            "location": "Magadi",
            "risk_level": "LOW",
            "risk_score": 0.08,
            "flash_flood_probability": 0.05,
            "rainfall": 2.1, "humidity": 52, "wind_speed": 10.5, "temperature": 27.0,
        },
        {
            "location": "Loitokitok",
            "risk_level": "MODERATE",
            "risk_score": 0.25,
            "flash_flood_probability": 0.18,
            "rainfall": 15.8, "humidity": 65, "wind_speed": 18.0, "temperature": 20.0,
        },
        {
            "location": "Namanga",
            "risk_level": "LOW",
            "risk_score": 0.06,
            "flash_flood_probability": 0.03,
            "rainfall": 1.0, "humidity": 48, "wind_speed": 8.0, "temperature": 25.0,
        },
        {
            "location": "Isinya",
            "risk_level": "LOW",
            "risk_score": 0.10,
            "flash_flood_probability": 0.06,
            "rainfall": 4.5, "humidity": 55, "wind_speed": 11.0, "temperature": 24.0,
        },
    ]
    
    for b in baseline:
        # Insert weather data
        cursor.execute("""
            INSERT INTO weather_data 
            (location, timestamp, temperature, humidity, rainfall, wind_speed, weather_condition, raw_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            b["location"], now,
            b["temperature"], b["humidity"], b["rainfall"], b["wind_speed"],
            "Fair", json.dumps(b)
        ))
        
        # Insert risk assessment
        cursor.execute("""
            INSERT INTO risk_assessments 
            (location, timestamp, risk_level, risk_score, flash_flood_probability, affected_areas, recommended_action, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            b["location"], now,
            b["risk_level"], b["risk_score"], b["flash_flood_probability"],
            json.dumps(["Low-lying areas", "Stream valleys"]),
            "Monitor weather conditions. No immediate action required.",
            json.dumps(b)
        ))
    
    conn.commit()
    conn.close()

def get_sms_alerts(location: str = None, limit: int = 50) -> List[Dict]:
    """Get SMS alerts, optionally filtered by location."""
    conn = get_connection()
    cursor = conn.cursor()
    
    if location:
        cursor.execute("""
            SELECT * FROM sms_alerts 
            WHERE location = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        """, (location, limit))
    else:
        cursor.execute("""
            SELECT * FROM sms_alerts 
            ORDER BY timestamp DESC 
            LIMIT ?
        """, (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def update_sms_alert_status(alert_id: int, status: str):
    """Update SMS alert status."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE sms_alerts 
        SET status = ? 
        WHERE id = ?
    """, (status, alert_id))
    
    conn.commit()
    conn.close()
