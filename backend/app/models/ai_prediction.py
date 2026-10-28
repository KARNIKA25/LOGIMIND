from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=True)
    
    forecast_period = Column(String(50), nullable=False) # e.g. "NEXT_7_DAYS", "NEXT_30_DAYS", "NEXT_QUARTER"
    predicted_demand_units = Column(Float, nullable=False)
    confidence_interval_lower = Column(Float, nullable=False)
    confidence_interval_upper = Column(Float, nullable=False)
    confidence_score = Column(Float, default=0.92) # 0.0 to 1.0
    
    seasonality_factor = Column(Float, default=1.15)
    trend_direction = Column(String(20), default="UPWARD") # UPWARD, STABLE, DOWNWARD
    recommended_restock_qty = Column(Integer, default=120)
    
    forecast_data_points = Column(JSON, default=lambda: []) # [{date: "2026-10-04", predicted: 45, upper: 52, lower: 38}]
    model_version = Column(String(50), default="LogiMind-Transformer-v2.4")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    product = relationship("Product", back_populates="forecasts")
    warehouse = relationship("Warehouse")

class DelayPrediction(Base):
    __tablename__ = "delay_predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False)
    
    delay_probability = Column(Float, nullable=False) # 0.0 to 1.0
    predicted_delay_minutes = Column(Integer, default=0)
    primary_risk_factor = Column(String(100), default="WEATHER_CONGESTION") # WEATHER, TRAFFIC, PORT_BOTTLENECK, MECHANICAL
    risk_level = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    
    factors_breakdown = Column(JSON, default=lambda: {
        "weather_risk": 0.15,
        "traffic_congestion_risk": 0.20,
        "driver_fatigue_risk": 0.05,
        "route_complexity_risk": 0.10
    })
    
    recommended_mitigation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    shipment = relationship("Shipment")

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(50), nullable=False) # INVENTORY_OPTIMIZATION, ROUTE_EFFICIENCY, SUPPLIER_PERFORMANCE, COST_SAVINGS
    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    potential_savings_usd = Column(Float, default=0.0)
    urgency = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH
    is_actionable = Column(String(10), default="YES")
    action_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
