from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.fleet_service import FleetService
from app.schemas.fleet import DriverResponse, DriverCreate, DriverUpdate, DrivingIncidentCreate, DrivingIncidentResponse
from app.api.deps import get_current_active_user, require_manager

router = APIRouter()

@router.get("/", response_model=List[DriverResponse])
def list_drivers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """List commercial drivers with license details and safety ratings."""
    service = FleetService(db)
    return service.get_all_drivers(skip=skip, limit=limit)

@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get single driver profile."""
    service = FleetService(db)
    return service.get_driver_by_id(driver_id)

@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_manager)])
def create_driver(
    d_in: DriverCreate,
    db: Session = Depends(get_db)
):
    """Create a driver profile for an employee user."""
    service = FleetService(db)
    return service.create_driver(d_in)

@router.put("/{driver_id}", response_model=DriverResponse, dependencies=[Depends(require_manager)])
def update_driver(
    driver_id: int,
    d_in: DriverUpdate,
    db: Session = Depends(get_db)
):
    """Update driver availability status or vehicle assignment."""
    service = FleetService(db)
    return service.update_driver(driver_id, d_in)

@router.post("/{driver_id}/incidents", response_model=DrivingIncidentResponse, dependencies=[Depends(require_manager)])
def report_driver_incident(
    driver_id: int,
    inc_in: DrivingIncidentCreate,
    db: Session = Depends(get_db)
):
    """Log driving safety incidents and adjust safety rating score."""
    service = FleetService(db)
    return service.log_incident(driver_id, inc_in)
