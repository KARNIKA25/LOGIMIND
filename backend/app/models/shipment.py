from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class ShipmentStatus(str, enum.Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    DISPATCHED = "DISPATCHED"
    IN_TRANSIT = "IN_TRANSIT"
    DELAYED = "DELAYED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"

class ShipmentPriority(str, enum.Enum):
    STANDARD = "STANDARD"
    EXPRESS = "EXPRESS"
    CRITICAL = "CRITICAL"
    COLD_CHAIN = "COLD_CHAIN"

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tracking_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Origin and Destination
    origin_warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="RESTRICT"), nullable=False)
    destination_warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="RESTRICT"), nullable=True)
    
    recipient_name = Column(String(150), nullable=False)
    recipient_phone = Column(String(50), nullable=False)
    recipient_email = Column(String(100), nullable=True)
    destination_address = Column(Text, nullable=False)
    destination_latitude = Column(Float, nullable=False)
    destination_longitude = Column(Float, nullable=False)
    
    # Cargo Details
    cargo_description = Column(String(255), default="General Merchandise")
    total_weight_kg = Column(Float, default=100.0)
    total_volume_cbm = Column(Float, default=2.0)
    items_list = Column(JSON, default=lambda: [])  # [{"product_id": 1, "sku": "...", "qty": 10}]
    
    # Dispatch Details
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(Enum(ShipmentStatus), default=ShipmentStatus.CREATED, nullable=False, index=True)
    priority = Column(Enum(ShipmentPriority), default=ShipmentPriority.STANDARD, nullable=False)
    
    scheduled_dispatch_time = Column(DateTime, nullable=True)
    actual_dispatch_time = Column(DateTime, nullable=True)
    estimated_delivery_time = Column(DateTime, nullable=True)
    actual_delivery_time = Column(DateTime, nullable=True)
    
    # AI Predictive Metrics
    ai_risk_score = Column(Float, default=0.05) # 0.0 to 1.0
    ai_predicted_delay_mins = Column(Integer, default=0)
    ai_recommendation = Column(Text, nullable=True)
    
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    last_location_update = Column(DateTime, nullable=True)
    
    signature_url = Column(String(500), nullable=True)
    proof_of_delivery_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    origin_warehouse = relationship("Warehouse", foreign_keys=[origin_warehouse_id], back_populates="origin_shipments")
    destination_warehouse = relationship("Warehouse", foreign_keys=[destination_warehouse_id], back_populates="dest_shipments")
    vehicle = relationship("Vehicle", back_populates="shipments")
    driver = relationship("Driver", back_populates="shipments")
    events = relationship("ShipmentEvent", back_populates="shipment", cascade="all, delete-orphan", order_by="ShipmentEvent.timestamp.desc()")
    route_plan = relationship("RoutePlan", back_populates="shipment", uselist=False, cascade="all, delete-orphan")

class ShipmentEvent(Base):
    __tablename__ = "shipment_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)
    location_name = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    event_details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    shipment = relationship("Shipment", back_populates="events")
