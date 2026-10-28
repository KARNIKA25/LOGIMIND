from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class DriverStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ON_DUTY = "ON_DUTY"
    ON_LEAVE = "ON_LEAVE"
    SUSPENDED = "SUSPENDED"

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    driver_license_number = Column(String(100), unique=True, index=True, nullable=False)
    license_type = Column(String(50), default="COMMERCIAL_HEAVY") # CDL-A, CDL-B, LIGHT
    license_expiry = Column(DateTime, nullable=False)
    
    years_of_experience = Column(Integer, default=5)
    assigned_vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(Enum(DriverStatus), default=DriverStatus.AVAILABLE, nullable=False)
    current_latitude = Column(Float, default=37.7749)
    current_longitude = Column(Float, default=-122.4194)
    
    safety_rating = Column(Float, default=4.9) # Max 5.0
    total_trips_completed = Column(Integer, default=0)
    total_km_driven = Column(Float, default=0.0)
    
    medical_fitness_expiry = Column(DateTime, nullable=True)
    emergency_contact = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="driver_profile")
    assigned_vehicle = relationship("Vehicle", back_populates="assigned_drivers")
    incidents = relationship("DrivingIncident", back_populates="driver", cascade="all, delete-orphan")
    shipments = relationship("Shipment", back_populates="driver")

class DrivingIncident(Base):
    __tablename__ = "driving_incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False)
    incident_type = Column(String(100), nullable=False) # SPEEDING, HARSH_BRAKING, ACCIDENT, DELAY
    incident_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    severity = Column(String(50), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)

    driver = relationship("Driver", back_populates="incidents")
