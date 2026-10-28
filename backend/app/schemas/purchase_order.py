from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.purchase_order import POStatus
from app.schemas.supplier import SupplierResponse
from app.schemas.warehouse import WarehouseResponse
from app.schemas.product import ProductResponse

class PurchaseOrderItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    id: int
    po_id: int
    received_quantity: int
    total_price: float
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True

class PurchaseOrderBase(BaseModel):
    supplier_id: int
    warehouse_id: int
    expected_delivery_date: Optional[datetime] = None
    terms_and_conditions: Optional[str] = "Standard enterprise procurement terms apply."
    invoice_number: Optional[str] = None
    invoice_url: Optional[str] = None
    payment_status: str = "UNPAID"

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderUpdate(BaseModel):
    status: Optional[POStatus] = None
    expected_delivery_date: Optional[datetime] = None
    actual_delivery_date: Optional[datetime] = None
    invoice_number: Optional[str] = None
    invoice_url: Optional[str] = None
    payment_status: Optional[str] = None
    terms_and_conditions: Optional[str] = None

class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    po_number: str
    total_amount: float
    tax_amount: float
    grand_total: float
    status: POStatus
    order_date: datetime
    actual_delivery_date: Optional[datetime] = None
    created_by_id: Optional[int] = None
    approved_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    items: List[PurchaseOrderItemResponse] = []
    supplier: Optional[SupplierResponse] = None

    class Config:
        from_attributes = True
