from typing import Optional, List
from pydantic import BaseModel

class WeatherCondition(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    temperature_celsius: float
    feels_like_celsius: float
    humidity_percentage: float
    wind_speed_kmh: float
    precipitation_probability: float
    condition_text: str
    condition_code: str # "CLEAR", "RAIN", "HEAVY_RAIN", "THUNDERSTORM", "FOG", "SNOW"
    visibility_km: float
    is_safe_for_transit: bool = True
    active_alerts: List[str] = []

class WeatherRouteImpact(BaseModel):
    origin_weather: WeatherCondition
    destination_weather: WeatherCondition
    midpoint_weather: Optional[WeatherCondition] = None
    route_risk_level: str = "LOW" # LOW, MODERATE, SEVERE
    speed_reduction_pct: float = 0.0
    advisories: List[str] = []
