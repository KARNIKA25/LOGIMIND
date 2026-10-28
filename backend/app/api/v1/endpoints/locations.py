from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.location_service import LocationService
from app.schemas.location import POILocation
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/nearby", response_model=List[POILocation])
def get_nearby_logistics_nodes(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius_km: float = Query(75.0, description="Search radius in kilometers"),
    category: Optional[List[str]] = Query(None, description="Categories filter: PORT, HARBOUR, FUEL_STATION, REPAIR_CENTER, REST_STOP, TOLL_PLAZA, WAREHOUSE"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Find nearby freight hubs, ports, harbours, fast fueling plazas, truck repair facilities, rest areas, and toll plazas."""
    service = LocationService(db)
    return service.get_nearby_pois(lat, lng, radius_km, category)

@router.get("/geocode")
def geocode_location(
    q: str = Query(..., description="Location name, city, port, or address to geocode"),
    limit: int = Query(6, ge=1, le=15, description="Maximum number of suggestions"),
    db: Session = Depends(get_db)
):
    """
    Search and geocode locations by name or address.
    Searches internal warehouses, international freight hubs, Google Geocoding, and OpenStreetMap.
    Eliminates the need for users to manually enter latitude and longitude.
    """
    service = LocationService(db)
    return service.geocode_query(q, limit=limit)
