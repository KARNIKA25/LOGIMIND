from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.supplier_service import SupplierService
from app.schemas.supplier import SupplierResponse, SupplierCreate, SupplierUpdate
from app.api.deps import get_current_active_user, require_manager

router = APIRouter()

@router.get("/", response_model=List[SupplierResponse])
def list_suppliers(
    query_str: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """List suppliers with ratings, GST numbers, and reliability metrics."""
    service = SupplierService(db)
    return service.get_all(query_str=query_str, skip=skip, limit=limit)

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get supplier details by ID."""
    service = SupplierService(db)
    return service.get_by_id(supplier_id)

@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_manager)])
def create_supplier(
    s_in: SupplierCreate,
    db: Session = Depends(get_db)
):
    """Register a new enterprise supplier."""
    service = SupplierService(db)
    return service.create(s_in)

@router.put("/{supplier_id}", response_model=SupplierResponse, dependencies=[Depends(require_manager)])
def update_supplier(
    supplier_id: int,
    s_in: SupplierUpdate,
    db: Session = Depends(get_db)
):
    """Update supplier rating, contacts, or tax credentials."""
    service = SupplierService(db)
    return service.update(supplier_id, s_in)

@router.delete("/{supplier_id}", response_model=SupplierResponse, dependencies=[Depends(require_manager)])
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    """Delete a supplier profile."""
    service = SupplierService(db)
    return service.delete(supplier_id)
