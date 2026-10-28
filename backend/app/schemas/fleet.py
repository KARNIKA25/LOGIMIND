from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.models.vehicle import VehicleType, VehicleStatus
from app.models.driver import DriverStatus
from app.schemas.user import UserResponse

class MaintenanceLogBase(BaseModel):
    service_type: str
    cost: float = 0.0
    odometer_reading: float
    performed_by: Optional[str] = None
    notes: Optional[str] = None
    next_service_km: Optional[float] = None

class MaintenanceLogCreate(MaintenanceLogBase):
    pass

class MaintenanceLogResponse(MaintenanceLogBase):
    id: int
    vehicle_id: int
    service_date: datetime

    class Config:
        from_attributes = True

class VehicleBase(BaseModel):
    registration_number: str
    vin: Optional[str] = None
    model: str
    make: str
    year: int = 2024
    vehicle_type: VehicleType = VehicleType.HEAVY_TRUCK
    capacity_kg: float = 5000.0
    volume_capacity_cbm: float = 30.0
    fuel_type: str = "DIESEL"
    fuel_efficiency_kmpl: float = 6.5
    current_odometer_km: float = 0.0
    current_latitude: float = 37.7749
    current_longitude: float = -122.4194
    insurance_policy_number: Optional[str] = None
    insurance_expiry: Optional[datetime] = None
    status: VehicleStatus = VehicleStatus.AVAILABLE
    last_maintenance_date: Optional[datetime] = None
    next_maintenance_due: Optional[datetime] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    model: Optional[str] = None
    make: Optional[str] = None
    year: Optional[int] = None
    vehicle_type: Optional[VehicleType] = None
    capacity_kg: Optional[float] = None
    volume_capacity_cbm: Optional[float] = None
    fuel_type: Optional[str] = None
    fuel_efficiency_kmpl: Optional[float] = None
    current_odometer_km: Optional[float] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    insurance_policy_number: Optional[str] = None
    insurance_expiry: Optional[datetime] = None
    status: Optional[VehicleStatus] = None
    last_maintenance_date: Optional[datetime] = None
    next_maintenance_due: Optional[datetime] = None

class VehicleResponse(VehicleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    maintenance_logs: List[MaintenanceLogResponse] = []

    class Config:
        from_attributes = True

# Driver Schemas
class DrivingIncidentBase(BaseModel):
    incident_type: str
    severity: str = "LOW"
    description: Optional[str] = None
    location: Optional[str] = None

class DrivingIncidentCreate(DrivingIncidentBase):
    pass

class DrivingIncidentResponse(DrivingIncidentBase):
    id: int
    driver_id: int
    incident_date: datetime

    class Config:
        from_attributes = True

class DriverBase(BaseModel):
    driver_license_number: str
    license_type: str = "COMMERCIAL_HEAVY"
    license_expiry: datetime
    years_of_experience: int = 5
    assigned_vehicle_id: Optional[int] = None
    status: DriverStatus = DriverStatus.AVAILABLE
    current_latitude: float = 37.7749
    current_longitude: float = -122.4194
    safety_rating: float = 4.9
    total_trips_completed: int = 0
    total_km_driven: float = 0.0
    medical_fitness_expiry: Optional[datetime] = None
    emergency_contact: Optional[Dict[str, Any]] = None

class DriverCreate(DriverBase):
    user_id: int

class DriverUpdate(BaseModel):
    license_type: Optional[str] = None
    license_expiry: Optional[datetime] = None
    years_of_experience: Optional[int] = None
    assigned_vehicle_id: Optional[int] = None
    status: Optional[DriverStatus] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    safety_rating: Optional[float] = None
    total_trips_completed: Optional[int] = None
    total_km_driven: Optional[float] = None
    medical_fitness_expiry: Optional[datetime] = None
    emergency_contact: Optional[Dict[str, Any]] = None

class DriverResponse(DriverBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
    assigned_vehicle: Optional[VehicleResponse] = None
    incidents: List[DrivingIncidentResponse] = []

    class Config:
        from_attributes = True
