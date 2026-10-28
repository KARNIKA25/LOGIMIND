from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class POILocation(BaseModel):
    id: str
    name: str
    category: str # "PORT", "HARBOUR", "FUEL_STATION", "REPAIR_CENTER", "REST_STOP", "TOLL_PLAZA", "WAREHOUSE"
    latitude: float
    longitude: float
    distance_km: float
    address: str
    contact: Optional[str] = None
    amenities: List[str] = []
    rating: Optional[float] = 4.5
    open_now: bool = True
    metadata: Dict[str, Any] = {}

class NearbySearchRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 50.0
    categories: Optional[List[str]] = None
