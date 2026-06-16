from fastapi import APIRouter, HTTPException
from datetime import datetime
from .schemas import WeatherData, WeatherAPIRequest
from .database import insert_weather_data, get_latest_weather, insert_risk_assessment, insert_sms_alert
from .risk_engine import analyze_risk

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

@router.get("")
def get_current_telemetry(location: str = "Kajiado Central"):
    try:
        data = get_latest_weather(location, limit=1)
        if not data:
            raise HTTPException(status_code=404, detail="No telemetry data found")
        return data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
def get_telemetry_history(location: str = "Kajiado Central", limit: int = 20):
    try:
        return get_latest_weather(location, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit")
def submit_weather(weather: WeatherData):
    try:
        weather_id = insert_weather_data(weather.location, weather.dict())
        history = get_latest_weather(weather.location, limit=6)
        risk_assessment = analyze_risk(weather.dict(), history)
        assessment_id = insert_risk_assessment(weather.location, risk_assessment)
        
        if risk_assessment['risk_level'] in ['HIGH', 'VERY_HIGH', 'CRITICAL']:
            alert_message = f"ALERT: {risk_assessment['risk_level']} flood risk in {weather.location}. {risk_assessment['recommended_action']}"
            insert_sms_alert(
                recipient="alert_queue",
                message=alert_message,
                location=weather.location,
                risk_level=risk_assessment['risk_level']
            )
        
        return {
            "status": "success",
            "weather_id": weather_id,
            "assessment_id": assessment_id,
            "risk_assessment": risk_assessment,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{location}")
def get_weather(location: str, limit: int = 10):
    try:
        weather_data = get_latest_weather(location, limit)
        return {"location": location, "count": len(weather_data), "data": weather_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fetch")
def fetch_from_weather_api(request: WeatherAPIRequest):
    try:
        # Simulated external API response
        simulated_weather = {
            "location": request.location,
            "temperature": 24.5,
            "humidity": 72,
            "rainfall": 35.2,
            "wind_speed": 28.5,
            "weather_condition": "Partly Cloudy"
        }
        risk_assessment = analyze_risk(simulated_weather, get_latest_weather(request.location, limit=6))
        insert_weather_data(request.location, simulated_weather)
        insert_risk_assessment(request.location, risk_assessment)
        return {"status": "success", "weather_data": simulated_weather, "risk_assessment": risk_assessment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))