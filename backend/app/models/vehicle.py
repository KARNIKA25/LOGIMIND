from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class VehicleType(str, enum.Enum):
    HEAVY_TRUCK = "HEAVY_TRUCK"
    MEDIUM_TRUCK = "MEDIUM_TRUCK"
    VAN = "VAN"
    EV_VAN = "EV_VAN"
    CONTAINER_CARRIER = "CONTAINER_CARRIER"
    REFRIGERATED_TRUCK = "REFRIGERATED_TRUCK"

class VehicleStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ON_TRIP = "ON_TRIP"
    IN_MAINTENANCE = "IN_MAINTENANCE"
    OUT_OF_SERVICE = "OUT_OF_SERVICE"

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    registration_number = Column(String(50), unique=True, index=True, nullable=False)
    vin = Column(String(100), unique=True, nullable=True)
    model = Column(String(100), nullable=False)
    make = Column(String(100), nullable=False)
    year = Column(Integer, default=2024)
    
    vehicle_type = Column(Enum(VehicleType), default=VehicleType.HEAVY_TRUCK, nullable=False)
    capacity_kg = Column(Float, default=5000.0, nullable=False)
    volume_capacity_cbm = Column(Float, default=30.0, nullable=False)
    fuel_type = Column(String(50), default="DIESEL") # DIESEL, ELECTRIC, HYBRID, CNG
    fuel_efficiency_kmpl = Column(Float, default=6.5)
    
    current_odometer_km = Column(Float, default=0.0)
    current_latitude = Column(Float, default=37.7749)
    current_longitude = Column(Float, default=-122.4194)
    
    insurance_policy_number = Column(String(100), nullable=True)
    insurance_expiry = Column(DateTime, nullable=True)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.AVAILABLE, nullable=False)
    
    last_maintenance_date = Column(DateTime, nullable=True)
    next_maintenance_due = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle", cascade="all, delete-orphan")
    assigned_drivers = relationship("Driver", back_populates="assigned_vehicle")
    shipments = relationship("Shipment", back_populates="vehicle")

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    service_type = Column(String(100), nullable=False) # OIL_CHANGE, BRAKE_INSPECTION, TIRE_ROTATION, ENGINE_OVERHAUL
    service_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    cost = Column(Float, default=0.0)
    odometer_reading = Column(Float, nullable=False)
    performed_by = Column(String(150), nullable=True)
    notes = Column(Text, nullable=True)
    next_service_km = Column(Float, nullable=True)

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")
