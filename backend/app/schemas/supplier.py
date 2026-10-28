from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr

class SupplierBase(BaseModel):
    supplier_code: str
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    gst_number: Optional[str] = None
    tax_number: Optional[str] = None
    address: str
    city: str
    country: str
    rating: float = 4.5
    reliability_score: float = 95.0
    payment_terms: str = "Net 30"
    status: str = "ACTIVE"
    performance_metrics: Dict[str, Any] = {"total_orders": 0, "on_time_deliveries": 0, "defect_rate": 0.01}

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    tax_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    rating: Optional[float] = None
    reliability_score: Optional[float] = None
    payment_terms: Optional[str] = None
    status: Optional[str] = None
    performance_metrics: Optional[Dict[str, Any]] = None

class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
