from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.inventory import StockTransferStatus
from app.schemas.product import ProductResponse

class InventoryBase(BaseModel):
    warehouse_id: int
    product_id: int
    current_stock: int = 0
    reserved_stock: int = 0
    minimum_stock: int = 50
    maximum_stock: int = 1000
    reorder_level: int = 150
    bin_location: str = "A-01-01"
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    current_stock: Optional[int] = None
    reserved_stock: Optional[int] = None
    minimum_stock: Optional[int] = None
    maximum_stock: Optional[int] = None
    reorder_level: Optional[int] = None
    bin_location: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None

class InventoryResponse(InventoryBase):
    id: int
    available_stock: int
    last_counted_at: Optional[datetime] = None
    updated_at: datetime
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True

class StockTransferCreate(BaseModel):
    product_id: int
    source_warehouse_id: int
    destination_warehouse_id: int
    quantity: int
    notes: Optional[str] = None

class StockTransferResponse(BaseModel):
    id: int
    transfer_number: str
    product_id: int
    source_warehouse_id: int
    destination_warehouse_id: int
    quantity: int
    status: StockTransferStatus
    initiated_by_id: Optional[int] = None
    approved_by_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StockAuditCreate(BaseModel):
    warehouse_id: int
    product_id: int
    physical_count: int
    remarks: Optional[str] = None

class StockAuditResponse(BaseModel):
    id: int
    audit_code: str
    warehouse_id: int
    product_id: int
    system_stock: int
    physical_count: int
    variance: int
    audited_by_id: Optional[int] = None
    remarks: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class StockHistoryResponse(BaseModel):
    id: int
    warehouse_id: int
    product_id: int
    change_type: str
    quantity_changed: int
    balance_after: int
    reference_id: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
