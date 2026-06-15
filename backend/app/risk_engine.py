"""
Flash-flood risk calculation engine for Kajiado County, Kenya.
"""
from typing import Dict, List, Tuple
from datetime import datetime, timedelta
import math

# Kajiado County geographical coordinates
KAJIADO_ZONES = {
    "Kajiado Central": {"lat": -1.9992, "lon": 36.7764},
    "Magadi": {"lat": -2.2850, "lon": 36.3425},
    "Loitokitok": {"lat": -3.2833, "lon": 37.6000},
    "Namanga": {"lat": -2.5000, "lon": 37.1333},
    "Isinya": {"lat": -2.0000, "lon": 37.0000},
}

class RiskCalculator:
    """Calculate flash-flood risk based on weather conditions."""
    
    def __init__(self):
        # Risk thresholds
        self.rainfall_threshold = 50.0  # mm in 24 hours
        self.high_rainfall_threshold = 100.0  # mm in 24 hours
        self.wind_speed_threshold = 50.0  # km/h
        
        # Weighting factors
        self.rainfall_weight = 0.5
        self.humidity_weight = 0.2
        self.wind_speed_weight = 0.15
        self.temperature_weight = 0.15
    
    def calculate_risk(self, weather_data: Dict, historical_data: List[Dict] = None) -> Dict:
        """
        Calculate flash-flood risk based on weather conditions.
        """
        # Extract weather components
        rainfall = weather_data.get('rainfall', 0)
        humidity = weather_data.get('humidity', 50)
        wind_speed = weather_data.get('wind_speed', 0)
        temperature = weather_data.get('temperature', 20)
        
        # Calculate individual risk scores (0-1)
        rainfall_score = self._calculate_rainfall_score(rainfall)
        humidity_score = self._calculate_humidity_score(humidity)
        wind_score = self._calculate_wind_score(wind_speed)
        temperature_score = self._calculate_temperature_score(temperature)
        
        # Apply trend analysis if historical data provided
        trend_multiplier = 1.0
        if historical_data:
            trend_multiplier = self._calculate_trend_multiplier(historical_data)
        
        # Calculate weighted risk score
        risk_score = (
            rainfall_score * self.rainfall_weight +
            humidity_score * self.humidity_weight +
            wind_score * self.wind_speed_weight +
            temperature_score * self.temperature_weight
        ) * trend_multiplier
        
        # Clamp to 0-1 range
        risk_score = max(0.0, min(1.0, risk_score))
        
        # Determine risk level
        risk_level = self._determine_risk_level(risk_score)
        
        # Determine affected areas based on wind direction and geography
        affected_areas = self._determine_affected_areas(wind_speed, temperature)
        
        # Generate recommended action
        recommended_action = self._generate_action(risk_level, rainfall)
        
        return {
            "risk_score": round(risk_score, 3),
            "risk_level": risk_level,
            "flash_flood_probability": round(rainfall_score, 3),
            "rainfall_score": round(rainfall_score, 3),
            "humidity_score": round(humidity_score, 3),
            "wind_score": round(wind_score, 3),
            "temperature_score": round(temperature_score, 3),
            "trend_multiplier": round(trend_multiplier, 3),
            "affected_areas": affected_areas,
            "recommended_action": recommended_action,
            "timestamp": datetime.now().isoformat(),
        }
    
    def _calculate_rainfall_score(self, rainfall: float) -> float:
        """Calculate rainfall risk component."""
        if rainfall <= 0:
            return 0.0
        elif rainfall < self.rainfall_threshold:
            return rainfall / self.rainfall_threshold * 0.6
        elif rainfall < self.high_rainfall_threshold:
            return 0.6 + (rainfall - self.rainfall_threshold) / (self.high_rainfall_threshold - self.rainfall_threshold) * 0.3
        else:
            return min(1.0, 0.9 + (rainfall - self.high_rainfall_threshold) / 50.0 * 0.1)
    
    def _calculate_humidity_score(self, humidity: float) -> float:
        """Calculate humidity risk component."""
        if humidity < 50:
            return humidity / 50 * 0.3
        elif humidity < 75:
            return 0.3 + (humidity - 50) / 25 * 0.4
        else:
            return 0.7 + (humidity - 75) / 25 * 0.3
    
    def _calculate_wind_score(self, wind_speed: float) -> float:
        """Calculate wind speed risk component."""
        if wind_speed < 20:
            return wind_speed / 20 * 0.2
        elif wind_speed < self.wind_speed_threshold:
            return 0.2 + (wind_speed - 20) / 30 * 0.5
        else:
            return 0.7 + (wind_speed - self.wind_speed_threshold) / 30 * 0.3
    
    def _calculate_temperature_score(self, temperature: float) -> float:
        """Calculate temperature risk component."""
        if temperature < 15:
            return (15 - temperature) / 10 * 0.3
        elif temperature < 25:
            return 0.3 + (25 - temperature) / 10 * 0.4
        else:
            return min(0.7, 0.7 + (temperature - 25) / 10 * 0.1)
    
    def _calculate_trend_multiplier(self, historical_data: List[Dict]) -> float:
        """Calculate trend multiplier from historical data."""
        if not historical_data or len(historical_data) < 2:
            return 1.0
        
        sorted_data = sorted(historical_data, key=lambda x: x.get('timestamp', ''), reverse=True)
        
        recent_rainfall = sum(d.get('rainfall', 0) for d in sorted_data[:3]) / 3
        older_rainfall = sum(d.get('rainfall', 0) for d in sorted_data[3:6]) / 3 if len(sorted_data) > 3 else recent_rainfall
        
        if older_rainfall == 0:
            return 1.0
        
        trend = recent_rainfall / older_rainfall
        
        if trend > 1.5:
            return 1.3
        elif trend > 1.2:
            return 1.2
        elif trend > 1.0:
            return 1.1
        else:
            return 1.0
    
    def _determine_risk_level(self, risk_score: float) -> str:
        """Determine risk level from risk score."""
        if risk_score < 0.2:
            return "LOW"
        elif risk_score < 0.4:
            return "MODERATE"
        elif risk_score < 0.6:
            return "HIGH"
        elif risk_score < 0.8:
            return "VERY_HIGH"
        else:
            return "CRITICAL"
    
    def _determine_affected_areas(self, wind_speed: float, temperature: float) -> List[str]:
        """Determine affected areas based on wind and other factors."""
        affected = []
        if wind_speed > 20:
            if temperature < 20:
                affected.extend(["Kajiado Central", "Isinya"])
            else:
                affected.extend(["Magadi", "Namanga"])
        affected.extend(["Low-lying areas", "Stream valleys", "Community settlements"])
        return list(set(affected)) if affected else ["General flood risk areas"]
    
    def _generate_action(self, risk_level: str, rainfall: float) -> str:
        """Generate recommended action based on risk level."""
        actions = {
            "LOW": "Monitor weather conditions. No immediate action required.",
            "MODERATE": "Stay alert. Prepare emergency supplies. Monitor rainfall updates.",
            "HIGH": "Issue yellow alert. Advise movement away from flood-prone areas. Monitor closely.",
            "VERY_HIGH": "Issue orange alert. Evacuate vulnerable populations. Activate emergency response.",
            "CRITICAL": "Issue red alert. Execute full evacuation. Deploy emergency services immediately.",
        }
        return actions.get(risk_level, "Unknown risk level")

calculator = RiskCalculator()

def analyze_risk(weather_data: Dict, historical_data: List[Dict] = None) -> Dict:
    """Analyze flash-flood risk."""
    return calculator.calculate_risk(weather_data, historical_data)