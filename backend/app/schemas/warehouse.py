from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.warehouse import WarehouseStatus

class StorageZoneBase(BaseModel):
    zone_code: str
    zone_name: str
    zone_type: str = "DRY_STORAGE"
    capacity: float = 2500.0
    current_load: float = 0.0
    temperature_celsius: Optional[float] = None
    humidity_percentage: Optional[float] = None

class StorageZoneCreate(StorageZoneBase):
    pass

class StorageZoneResponse(StorageZoneBase):
    id: int
    warehouse_id: int

    class Config:
        from_attributes = True

class WarehouseBase(BaseModel):
    warehouse_code: str
    name: str
    address: str
    city: str
    state: Optional[str] = None
    country: str = "Global"
    postal_code: Optional[str] = None
    latitude: float
    longitude: float
    total_capacity: float = 10000.0
    current_utilization: float = 0.0
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    status: WarehouseStatus = WarehouseStatus.ACTIVE
    operating_hours: str = "24/7"
    amenities: List[str] = Field(default_factory=lambda: ["Cold Storage", "HazMat Approved", "Dock Levelers"])

class WarehouseCreate(WarehouseBase):
    manager_id: Optional[int] = None
    initial_zones: Optional[List[StorageZoneCreate]] = None

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_capacity: Optional[float] = None
    current_utilization: Optional[float] = None
    manager_id: Optional[int] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    status: Optional[WarehouseStatus] = None
    operating_hours: Optional[str] = None
    amenities: Optional[List[str]] = None

class WarehouseResponse(WarehouseBase):
    id: int
    manager_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    storage_zones: List[StorageZoneResponse] = []

    class Config:
        from_attributes = True
