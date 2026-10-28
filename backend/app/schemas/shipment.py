from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.models.shipment import ShipmentStatus, ShipmentPriority
from app.schemas.warehouse import WarehouseResponse
from app.schemas.fleet import VehicleResponse, DriverResponse

class ShipmentEventBase(BaseModel):
    status: str
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    event_details: Optional[str] = None

class ShipmentEventCreate(ShipmentEventBase):
    pass

class ShipmentEventResponse(ShipmentEventBase):
    id: int
    shipment_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class ShipmentBase(BaseModel):
    origin_warehouse_id: int
    destination_warehouse_id: Optional[int] = None
    recipient_name: str
    recipient_phone: str
    recipient_email: Optional[str] = None
    destination_address: str
    destination_latitude: float
    destination_longitude: float
    cargo_description: str = "General Merchandise"
    total_weight_kg: float = 100.0
    total_volume_cbm: float = 2.0
    items_list: List[Dict[str, Any]] = []
    priority: ShipmentPriority = ShipmentPriority.STANDARD
    scheduled_dispatch_time: Optional[datetime] = None

class ShipmentCreate(ShipmentBase):
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None

class ShipmentUpdate(BaseModel):
    destination_warehouse_id: Optional[int] = None
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    recipient_email: Optional[str] = None
    destination_address: Optional[str] = None
    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None
    cargo_description: Optional[str] = None
    total_weight_kg: Optional[float] = None
    total_volume_cbm: Optional[float] = None
    items_list: Optional[List[Dict[str, Any]]] = None
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    status: Optional[ShipmentStatus] = None
    priority: Optional[ShipmentPriority] = None
    actual_dispatch_time: Optional[datetime] = None
    estimated_delivery_time: Optional[datetime] = None
    actual_delivery_time: Optional[datetime] = None
    ai_risk_score: Optional[float] = None
    ai_predicted_delay_mins: Optional[int] = None
    ai_recommendation: Optional[str] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    signature_url: Optional[str] = None
    proof_of_delivery_url: Optional[str] = None

class ShipmentResponse(ShipmentBase):
    id: int
    tracking_number: str
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    status: ShipmentStatus
    actual_dispatch_time: Optional[datetime] = None
    estimated_delivery_time: Optional[datetime] = None
    actual_delivery_time: Optional[datetime] = None
    ai_risk_score: float = 0.05
    ai_predicted_delay_mins: int = 0
    ai_recommendation: Optional[str] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    last_location_update: Optional[datetime] = None
    signature_url: Optional[str] = None
    proof_of_delivery_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    origin_warehouse: Optional[WarehouseResponse] = None
    destination_warehouse: Optional[WarehouseResponse] = None
    vehicle: Optional[VehicleResponse] = None
    driver: Optional[DriverResponse] = None
    events: List[ShipmentEventResponse] = []

    class Config:
        from_attributes = True
