from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.shipment_service import ShipmentService
from app.schemas.shipment import ShipmentResponse, ShipmentCreate, ShipmentUpdate, ShipmentEventResponse, ShipmentEventCreate
from app.api.deps import get_current_active_user, require_warehouse_manager
from app.models.shipment import ShipmentStatus

router = APIRouter()

@router.get("/", response_model=List[ShipmentResponse])
def list_shipments(
    query_str: Optional[str] = None,
    status: Optional[ShipmentStatus] = None,
    driver_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """List shipments with real-time telematics, status filtering, and risk indicators."""
    service = ShipmentService(db)
    return service.get_all(
        query_str=query_str,
        status_filter=status,
        driver_id=driver_id,
        warehouse_id=warehouse_id,
        skip=skip,
        limit=limit
    )

@router.get("/track/{tracking_number}", response_model=ShipmentResponse)
def track_shipment_by_number(
    tracking_number: str,
    db: Session = Depends(get_db)
):
    """Public/authorized shipment tracking by tracking number."""
    service = ShipmentService(db)
    return service.get_by_tracking(tracking_number)

@router.get("/{shipment_id}", response_model=ShipmentResponse)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Retrieve full shipment record with event checkpoint history."""
    service = ShipmentService(db)
    return service.get_by_id(shipment_id)

@router.post("/", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_warehouse_manager)])
def create_shipment(
    s_in: ShipmentCreate,
    db: Session = Depends(get_db)
):
    """Create a new shipment consignment."""
    service = ShipmentService(db)
    return service.create(s_in)

@router.post("/{shipment_id}/dispatch", response_model=ShipmentResponse, dependencies=[Depends(require_warehouse_manager)])
def dispatch_shipment(
    shipment_id: int,
    vehicle_id: int,
    driver_id: int,
    db: Session = Depends(get_db)
):
    """Dispatch shipment with assigned driver and commercial vehicle."""
    service = ShipmentService(db)
    return service.dispatch(shipment_id, vehicle_id=vehicle_id, driver_id=driver_id)

@router.post("/{shipment_id}/telemetry-ping", response_model=ShipmentResponse)
def update_shipment_telemetry(
    shipment_id: int,
    latitude: float,
    longitude: float,
    location_name: str,
    status_str: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Update shipment IoT live coordinates and generate timeline checkpoint."""
    service = ShipmentService(db)
    return service.update_location_and_telemetry(shipment_id, latitude, longitude, location_name, status_str)

@router.post("/{shipment_id}/deliver", response_model=ShipmentResponse)
def mark_shipment_delivered(
    shipment_id: int,
    signature_url: Optional[str] = None,
    pod_url: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Mark shipment as delivered with Proof of Delivery and liberate fleet resources."""
    service = ShipmentService(db)
    return service.mark_delivered(shipment_id, signature_url, pod_url)

@router.put("/{shipment_id}", response_model=ShipmentResponse, dependencies=[Depends(require_warehouse_manager)])
def update_shipment(
    shipment_id: int,
    s_in: ShipmentUpdate,
    db: Session = Depends(get_db)
):
    """Update shipment specifications or metadata."""
    service = ShipmentService(db)
    return service.update(shipment_id, s_in)

@router.post("/{shipment_id}/events", response_model=ShipmentEventResponse, status_code=status.HTTP_201_CREATED)
def add_shipment_event(
    shipment_id: int,
    event_in: ShipmentEventCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Add a status checkpoint event to shipment timeline."""
    service = ShipmentService(db)
    shipment = service.get_by_id(shipment_id)
    event = service.repo.add_event(
        shipment_id=shipment.id,
        status=event_in.status,
        location_name=event_in.location_name,
        lat=event_in.latitude,
        lng=event_in.longitude,
        details=event_in.event_details
    )
    return event
