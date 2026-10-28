from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.product_service import ProductService
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate, ProductSupplierMapCreate, ProductSupplierMapResponse
from app.api.deps import get_current_active_user, require_manager

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def list_products(
    query_str: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """List products with catalog search, filtering, and supplier mappings."""
    service = ProductService(db)
    return service.get_all(query_str=query_str, category=category, skip=skip, limit=limit)

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get single product details by ID."""
    service = ProductService(db)
    return service.get_by_id(product_id)

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_manager)])
def create_product(
    p_in: ProductCreate,
    db: Session = Depends(get_db)
):
    """Create a new product SKU in the master catalog."""
    service = ProductService(db)
    return service.create(p_in)

@router.put("/{product_id}", response_model=ProductResponse, dependencies=[Depends(require_manager)])
def update_product(
    product_id: int,
    p_in: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update product dimensions, pricing, or specifications."""
    service = ProductService(db)
    return service.update(product_id, p_in)

@router.delete("/{product_id}", response_model=ProductResponse, dependencies=[Depends(require_manager)])
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Delete a product from the catalog."""
    service = ProductService(db)
    return service.delete(product_id)

@router.post("/{product_id}/suppliers", response_model=ProductSupplierMapResponse, dependencies=[Depends(require_manager)])
def link_supplier(
    product_id: int,
    sm_in: ProductSupplierMapCreate,
    db: Session = Depends(get_db)
):
    """Map a supplier to this product with procurement cost and lead time."""
    service = ProductService(db)
    return service.link_supplier(product_id, sm_in)
