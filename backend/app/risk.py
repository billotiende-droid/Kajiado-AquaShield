from fastapi import APIRouter, HTTPException
from datetime import datetime
from .schemas import RiskAssessmentRequest
from .database import get_latest_risk_assessment, get_latest_weather, insert_risk_assessment, insert_weather_data
from .risk_engine import analyze_risk

router = APIRouter(prefix="/risk", tags=["risk"])

def _ensure_risk_assessment(location: str) -> dict:
    """Get risk assessment, computing one on-the-fly if none exists."""
    risk = get_latest_risk_assessment(location)
    if risk:
        return risk
    
    # No stored assessment — try to compute from available weather data
    weather_list = get_latest_weather(location, limit=5)
    if weather_list:
        latest = weather_list[0]
        weather_data = {
            "temperature": latest.get("temperature", 25),
            "humidity": latest.get("humidity", 60),
            "rainfall": latest.get("rainfall", 0),
            "wind_speed": latest.get("wind_speed", 10),
            "weather_condition": latest.get("weather_condition", "Fair"),
        }
        computed = analyze_risk(weather_data, weather_list)
        insert_risk_assessment(location, computed)
        return computed
    
    # No weather data either — return baseline assessment
    from .database import seed_initial_data
    seed_initial_data()
    risk = get_latest_risk_assessment(location)
    if risk:
        return risk
    
    raise HTTPException(status_code=404, detail=f"No risk assessment found for {location}")

@router.post("/assessment")
def submit_risk_assessment(request: RiskAssessmentRequest):
    try:
        risk = _ensure_risk_assessment(request.location)
        return {"location": request.location, "risk_assessment": risk, "timestamp": datetime.now().isoformat()}
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@router.get("/{location}")
def get_risk(location: str):
    try:
        risk = _ensure_risk_assessment(location)
        return {"location": location, "risk_assessment": risk, "timestamp": datetime.now().isoformat()}
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))
