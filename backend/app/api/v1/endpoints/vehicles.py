from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.fleet_service import FleetService
from app.schemas.fleet import VehicleResponse, VehicleCreate, VehicleUpdate, MaintenanceLogCreate, MaintenanceLogResponse
from app.api.deps import get_current_active_user, require_manager

router = APIRouter()

@router.get("/", response_model=List[VehicleResponse])
def list_vehicles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """List fleet vehicles with fuel economy, maintenance schedule, and status."""
    service = FleetService(db)
    return service.get_all_vehicles(skip=skip, limit=limit)

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get vehicle specifications and service log."""
    service = FleetService(db)
    return service.get_vehicle_by_id(vehicle_id)

@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_manager)])
def create_vehicle(
    v_in: VehicleCreate,
    db: Session = Depends(get_db)
):
    """Register a new vehicle into the fleet."""
    service = FleetService(db)
    return service.create_vehicle(v_in)

@router.put("/{vehicle_id}", response_model=VehicleResponse, dependencies=[Depends(require_manager)])
def update_vehicle(
    vehicle_id: int,
    v_in: VehicleUpdate,
    db: Session = Depends(get_db)
):
    """Update vehicle operational status, odometer, or telemetry."""
    service = FleetService(db)
    return service.update_vehicle(vehicle_id, v_in)

@router.post("/{vehicle_id}/maintenance", response_model=MaintenanceLogResponse, dependencies=[Depends(require_manager)])
def log_vehicle_maintenance(
    vehicle_id: int,
    log_in: MaintenanceLogCreate,
    db: Session = Depends(get_db)
):
    """Log a scheduled maintenance or repair event for a vehicle."""
    service = FleetService(db)
    return service.log_maintenance(vehicle_id, log_in)
