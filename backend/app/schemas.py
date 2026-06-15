from pydantic import BaseModel
from typing import Optional, List, Dict

class WeatherData(BaseModel):
    location: str
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: float
    weather_condition: Optional[str] = None

class RiskAssessmentRequest(BaseModel):
    location: str
    include_history: bool = True

class SMSAlert(BaseModel):
    recipient: str
    message: str
    location: str
    risk_level: str

class AlertUpdate(BaseModel):
    alert_id: int
    status: str

class WeatherAPIRequest(BaseModel):
    api_key: Optional[str] = None
    location: str = "Kajiado"