from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class ProductSupplierMapBase(BaseModel):
    supplier_id: int
    supplier_sku: Optional[str] = None
    supplier_cost: float = 0.0
    lead_time_days: int = 7
    is_primary: str = "YES"

class ProductSupplierMapCreate(ProductSupplierMapBase):
    pass

class ProductSupplierMapResponse(ProductSupplierMapBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    product_code: str
    name: str
    description: Optional[str] = None
    category: str
    brand: Optional[str] = None
    sku: str
    barcode: Optional[str] = None
    weight_kg: float = 1.0
    dimensions_cm: Dict[str, float] = Field(default_factory=lambda: {"length": 10.0, "width": 10.0, "height": 10.0})
    unit_price: float = 0.0
    cost_price: float = 0.0
    currency: str = "USD"
    requires_cold_chain: str = "NO"
    hazard_class: str = "NONE"
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    supplier_mappings: Optional[List[ProductSupplierMapCreate]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    weight_kg: Optional[float] = None
    dimensions_cm: Optional[Dict[str, float]] = None
    unit_price: Optional[float] = None
    cost_price: Optional[float] = None
    currency: Optional[str] = None
    requires_cold_chain: Optional[str] = None
    hazard_class: Optional[str] = None
    image_url: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    supplier_mappings: List[ProductSupplierMapResponse] = []

    class Config:
        from_attributes = True
