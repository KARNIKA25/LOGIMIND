from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.inventory_service import InventoryService
from app.schemas.inventory import (
    InventoryResponse, InventoryCreate, InventoryUpdate,
    StockTransferCreate, StockTransferResponse,
    StockAuditCreate, StockAuditResponse, StockHistoryResponse
)
from app.api.deps import get_current_active_user, require_warehouse_manager
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[InventoryResponse])
def list_inventory(
    warehouse_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List inventory stock levels across facilities with available and reserved counts."""
    service = InventoryService(db)
    return service.get_all(warehouse_id=warehouse_id, skip=skip, limit=limit)

@router.get("/low-stock", response_model=List[InventoryResponse])
def get_low_stock_alerts(
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve all items that have reached or dropped below reorder threshold."""
    service = InventoryService(db)
    return service.get_low_stock(warehouse_id=warehouse_id)

@router.post("/", response_model=InventoryResponse, dependencies=[Depends(require_warehouse_manager)])
def upsert_inventory_stock(
    inv_in: InventoryCreate,
    db: Session = Depends(get_db)
):
    """Upsert stock location, reorder thresholds, and bin assignment."""
    service = InventoryService(db)
    return service.upsert_inventory(inv_in)

@router.put("/{inventory_id}", response_model=InventoryResponse, dependencies=[Depends(require_warehouse_manager)])
def update_inventory_record(
    inventory_id: int,
    inv_in: InventoryUpdate,
    db: Session = Depends(get_db)
):
    """Update stock level or threshold definitions with audit logging."""
    service = InventoryService(db)
    return service.update_stock(inventory_id, inv_in)

@router.post("/transfers", response_model=StockTransferResponse, dependencies=[Depends(require_warehouse_manager)])
def initiate_stock_transfer(
    transfer_in: StockTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Initiate an inter-warehouse stock transfer with automated reservation."""
    service = InventoryService(db)
    return service.initiate_transfer(transfer_in, user_id=current_user.id)

@router.post("/transfers/{transfer_id}/complete", response_model=StockTransferResponse, dependencies=[Depends(require_warehouse_manager)])
def complete_stock_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Acknowledge receipt and complete inter-warehouse transfer."""
    service = InventoryService(db)
    return service.complete_transfer(transfer_id, user_id=current_user.id)

@router.post("/audits", response_model=StockAuditResponse, dependencies=[Depends(require_warehouse_manager)])
def submit_stock_audit(
    audit_in: StockAuditCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Record physical stock count audit and calculate system variance."""
    service = InventoryService(db)
    return service.conduct_audit(audit_in, user_id=current_user.id)

@router.get("/audits", response_model=List[StockAuditResponse])
def list_stock_audits(
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List historical audit records."""
    service = InventoryService(db)
    return service.get_audit_records(warehouse_id=warehouse_id)

@router.get("/history", response_model=List[StockHistoryResponse])
def get_inventory_history(
    product_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve immutable stock change ledger."""
    service = InventoryService(db)
    return service.get_stock_history(product_id=product_id, warehouse_id=warehouse_id)
