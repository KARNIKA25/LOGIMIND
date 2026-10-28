from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    supplier_code = Column(String(50), unique=True, index=True, nullable=False)
    company_name = Column(String(200), nullable=False, index=True)
    contact_person = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    
    gst_number = Column(String(50), nullable=True)
    tax_number = Column(String(50), nullable=True)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    
    rating = Column(Float, default=4.5)  # 1.0 to 5.0
    reliability_score = Column(Float, default=95.0) # Percentage on-time delivery
    payment_terms = Column(String(100), default="Net 30")
    status = Column(String(50), default="ACTIVE") # ACTIVE, SUSPENDED, PENDING
    performance_metrics = Column(JSON, default=lambda: {"total_orders": 0, "on_time_deliveries": 0, "defect_rate": 0.01})
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    product_mappings = relationship("ProductSupplierMap", back_populates="supplier", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
