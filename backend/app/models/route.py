from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class RouteStrategy(str, enum.Enum):
    FASTEST = "FASTEST"
    SHORTEST = "SHORTEST"
    ECO_FRIENDLY = "ECO_FRIENDLY"
    WEATHER_OPTIMAL = "WEATHER_OPTIMAL"
    AVOID_TOLLS = "AVOID_TOLLS"

class RoutePlan(Base):
    __tablename__ = "route_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    origin_latitude = Column(Float, nullable=False)
    origin_longitude = Column(Float, nullable=False)
    origin_name = Column(String(200), nullable=False)
    
    destination_latitude = Column(Float, nullable=False)
    destination_longitude = Column(Float, nullable=False)
    destination_name = Column(String(200), nullable=False)
    
    total_distance_km = Column(Float, nullable=False)
    estimated_duration_minutes = Column(Float, nullable=False)
    strategy = Column(Enum(RouteStrategy), default=RouteStrategy.FASTEST, nullable=False)
    
    traffic_density = Column(String(50), default="NORMAL") # LOW, NORMAL, HEAVY, SEVERE
    weather_summary = Column(String(200), default="Clear skies, optimal driving conditions")
    carbon_emissions_kg = Column(Float, default=45.2)
    
    # Navigation geometry and checkpoints
    waypoints_data = Column(JSON, default=lambda: []) # List of [lat, lng] coordinates
    turn_by_turn_instructions = Column(JSON, default=lambda: []) # [{step: 1, instruction: "...", distance: "2km"}]
    alternative_routes = Column(JSON, default=lambda: []) # List of alternative paths with time/distance deltas
    
    is_active = Column(String(10), default="YES")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    shipment = relationship("Shipment", back_populates="route_plan")
    optimization_logs = relationship("RouteOptimizationLog", back_populates="route_plan", cascade="all, delete-orphan")

class RouteOptimizationLog(Base):
    __tablename__ = "route_optimization_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    route_plan_id = Column(Integer, ForeignKey("route_plans.id", ondelete="CASCADE"), nullable=False)
    algorithm_applied = Column(String(100), default="Dijkstra + Multi-Criteria AI Heuristic")
    computation_time_ms = Column(Float, default=14.5)
    fuel_saved_liters = Column(Float, default=3.8)
    co2_reduction_kg = Column(Float, default=9.2)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    route_plan = relationship("RoutePlan", back_populates="optimization_logs")
