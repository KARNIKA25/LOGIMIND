from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.purchase_order_service import PurchaseOrderService
from app.schemas.purchase_order import PurchaseOrderResponse, PurchaseOrderCreate, PurchaseOrderUpdate
from app.api.deps import get_current_active_user, require_manager
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List purchase orders with line-items, invoices, and approval status."""
    service = PurchaseOrderService(db)
    return service.get_all(skip=skip, limit=limit)

@router.get("/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(
    po_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve detailed purchase order with items and supplier details."""
    service = PurchaseOrderService(db)
    return service.get_by_id(po_id)

@router.post("/", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_manager)])
def create_purchase_order(
    po_in: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new procurement purchase order."""
    service = PurchaseOrderService(db)
    return service.create(po_in, user_id=current_user.id)

@router.post("/{po_id}/approve", response_model=PurchaseOrderResponse, dependencies=[Depends(require_manager)])
def approve_purchase_order(
    po_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Approve a submitted purchase order for fulfillment."""
    service = PurchaseOrderService(db)
    return service.approve(po_id, user_id=current_user.id)

@router.post("/{po_id}/receive", response_model=PurchaseOrderResponse, dependencies=[Depends(require_manager)])
def receive_and_inward_po(
    po_id: int,
    invoice_num: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Fulfill purchase order and automatically inward inventory into warehouse."""
    service = PurchaseOrderService(db)
    return service.mark_completed_and_receive(po_id, invoice_num=invoice_num)

@router.put("/{po_id}", response_model=PurchaseOrderResponse, dependencies=[Depends(require_manager)])
def update_purchase_order(
    po_id: int,
    po_in: PurchaseOrderUpdate,
    db: Session = Depends(get_db)
):
    """Update purchase order delivery schedule, terms, or invoice numbers."""
    service = PurchaseOrderService(db)
    return service.update(po_id, po_in)
