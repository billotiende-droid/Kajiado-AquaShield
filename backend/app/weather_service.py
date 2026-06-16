"""
Stormglass.io weather API integration for real-time data fetching.
"""
import os
import logging
from typing import Optional, Dict, List
from datetime import datetime, timezone
import httpx

from .risk_engine import KAJIADO_ZONES

logger = logging.getLogger(__name__)

STORMGLASS_BASE = os.environ.get(
    "WEATHER_AI_ENDPOINT",
    "https://api.stormglass.io/v2/weather/point"
)
STORMGLASS_KEY = os.environ.get("WEATHER_AI_KEY", "")

# Stormglass params we request — matches our schema
REQUESTED_PARAMS = [
    "airTemperature",
    "humidity",
    "precipitation",
    "windSpeed",
    "cloudCover",
]

def _get_coords(location: str) -> tuple[float, float]:
    """Get lat/lon for a Kajiado location. Falls back to Kajiado Central."""
    zone = KAJIADO_ZONES.get(location)
    if zone:
        return (zone["lat"], zone["lon"])
    # Default: Kajiado Central
    return (KAJIADO_ZONES["Kajiado Central"]["lat"], KAJIADO_ZONES["Kajiado Central"]["lon"])

def _map_condition(cloud_cover: float, humidity: float, precipitation: float) -> str:
    """Map numeric weather to a human-readable condition string."""
    if precipitation > 10:
        return "Heavy Rain"
    elif precipitation > 2:
        return "Rain"
    elif cloud_cover > 70:
        return "Cloudy"
    elif cloud_cover > 30:
        return "Partly Cloudy"
    elif humidity > 80:
        return "Misty"
    else:
        return "Fair"

async def fetch_weather(location: str) -> Optional[Dict]:
    """
    Fetch current weather from Stormglass API for a Kajiado location.
    Returns a dict matching WeatherData schema, or None on failure.
    """
    if not STORMGLASS_KEY:
        logger.warning("WEATHER_AI_KEY not set — cannot fetch from Stormglass")
        return None

    lat, lon = _get_coords(location)

    params = {
        "lat": lat,
        "lng": lon,
        "params": ",".join(REQUESTED_PARAMS),
        "start": datetime.now(timezone.utc).isoformat(),
        "end": datetime.now(timezone.utc).isoformat(),
        "source": "sg",  # prefer Stormglass own model
    }

    headers = {
        "Authorization": STORMGLASS_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(STORMGLASS_BASE, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        logger.error("Stormglass HTTP error %s: %s", e.response.status_code, e.response.text[:200])
        return None
    except httpx.RequestError as e:
        logger.error("Stormglass request failed: %s", e)
        return None
    except Exception as e:
        logger.error("Stormglass parse error: %s", e)
        return None

    hours = data.get("hours", [])
    if not hours:
        logger.warning("Stormglass returned no hourly data for %s", location)
        return None

    latest = hours[0]

    # Extract values — prefer "sg" source, fallback to first available
    def _val(key: str) -> float:
        entry = latest.get(key, {})
        if isinstance(entry, dict):
            return entry.get("sg") or entry.get("noaa") or next(iter(entry.values()), 0.0)
        return float(entry) if entry else 0.0

    temperature = _val("airTemperature")
    humidity = _val("humidity")
    rainfall = _val("precipitation")
    wind_speed = _val("windSpeed")
    cloud_cover = _val("cloudCover")

    weather_condition = _map_condition(cloud_cover, humidity, rainfall)

    return {
        "location": location,
        "temperature": round(temperature, 2),
        "humidity": round(humidity, 1),
        "rainfall": round(rainfall, 2),
        "wind_speed": round(wind_speed, 2),
        "weather_condition": weather_condition,
    }
