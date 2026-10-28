from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class WarehouseStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    MAINTENANCE = "MAINTENANCE"
    INACTIVE = "INACTIVE"
    FULL = "FULL"

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    warehouse_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=True)
    country = Column(String(100), default="Global")
    postal_code = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    total_capacity = Column(Float, default=10000.0)  # in cubic meters or pallet count
    current_utilization = Column(Float, default=0.0) # in percentage (0 - 100)
    
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(100), nullable=True)
    
    status = Column(Enum(WarehouseStatus), default=WarehouseStatus.ACTIVE, nullable=False)
    operating_hours = Column(String(100), default="24/7")
    amenities = Column(JSON, default=lambda: ["Cold Storage", "HazMat Approved", "Dock Levelers", "CCTV", "EV Charging"])
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    manager = relationship("User", back_populates="managed_warehouses")
    storage_zones = relationship("StorageZone", back_populates="warehouse", cascade="all, delete-orphan")
    inventories = relationship("Inventory", back_populates="warehouse", cascade="all, delete-orphan")
    origin_shipments = relationship("Shipment", foreign_keys="[Shipment.origin_warehouse_id]", back_populates="origin_warehouse")
    dest_shipments = relationship("Shipment", foreign_keys="[Shipment.destination_warehouse_id]", back_populates="destination_warehouse")

class StorageZone(Base):
    __tablename__ = "storage_zones"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    zone_code = Column(String(50), nullable=False)  # e.g., "ZONE-A-COLD", "ZONE-B-BULK"
    zone_name = Column(String(100), nullable=False)
    zone_type = Column(String(50), default="DRY_STORAGE") # DRY_STORAGE, COLD_CHAIN, HAZARDOUS, HIGH_VALUE
    capacity = Column(Float, default=2500.0)
    current_load = Column(Float, default=0.0)
    temperature_celsius = Column(Float, nullable=True)
    humidity_percentage = Column(Float, nullable=True)

    warehouse = relationship("Warehouse", back_populates="storage_zones")
