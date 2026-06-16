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
    location = _resolve_location(location)
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM weather_data 
        WHERE location = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    """, (location, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def get_latest_risk_assessment(location: str) -> Optional[Dict]:
    """Get latest risk assessment for a location."""
    location = _resolve_location(location)
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM risk_assessments 
        WHERE location = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
    """, (location,))
    
    row = cursor.fetchone()
    conn.close()
    
    return dict(row) if row else None

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