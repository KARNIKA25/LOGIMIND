from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.warehouse_service import WarehouseService
from app.schemas.warehouse import WarehouseResponse, WarehouseCreate, WarehouseUpdate, StorageZoneCreate, StorageZoneResponse
from app.api.deps import get_current_active_user, require_warehouse_manager
from app.models.warehouse import WarehouseStatus

router = APIRouter()

@router.get("/", response_model=List[WarehouseResponse])
def list_warehouses(
    search: Optional[str] = None,
    status: Optional[WarehouseStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """List all warehouses with capacity metrics, zones, and GPS coordinates."""
    service = WarehouseService(db)
    return service.get_all(search=search, status=status, skip=skip, limit=limit)

@router.get("/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Retrieve detailed warehouse information and storage zones."""
    service = WarehouseService(db)
    return service.get_by_id(warehouse_id)

@router.post("/", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_warehouse_manager)])
def create_warehouse(
    wh_in: WarehouseCreate,
    db: Session = Depends(get_db)
):
    """Create a new warehouse facility and initialize default storage zones."""
    service = WarehouseService(db)
    return service.create(wh_in)

@router.put("/{warehouse_id}", response_model=WarehouseResponse, dependencies=[Depends(require_warehouse_manager)])
def update_warehouse(
    warehouse_id: int,
    wh_in: WarehouseUpdate,
    db: Session = Depends(get_db)
):
    """Update warehouse details, manager assignment, or capacity."""
    service = WarehouseService(db)
    return service.update(warehouse_id, wh_in)

@router.delete("/{warehouse_id}", response_model=WarehouseResponse, dependencies=[Depends(require_warehouse_manager)])
def delete_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db)
):
    """Decommission and remove a warehouse record."""
    service = WarehouseService(db)
    return service.delete(warehouse_id)

@router.post("/{warehouse_id}/recalculate-utilization")
def recalculate_utilization(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Recalculate warehouse space utilization percentage from zone telemetry."""
    service = WarehouseService(db)
    util = service.recalculate_utilization(warehouse_id)
    return {"warehouse_id": warehouse_id, "current_utilization_percentage": util}
