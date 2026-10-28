from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), index=True, nullable=False) # e.g. Electronics, Industrial, Medical, FMCG
    brand = Column(String(100), index=True, nullable=True)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    barcode = Column(String(100), unique=True, index=True, nullable=True)
    
    # Dimensions & Physical specs
    weight_kg = Column(Float, default=1.0)
    dimensions_cm = Column(JSON, default=lambda: {"length": 10.0, "width": 10.0, "height": 10.0}) # LxWxH
    unit_price = Column(Float, default=0.0)
    cost_price = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    
    requires_cold_chain = Column(String(10), default="NO") # YES, NO
    hazard_class = Column(String(50), default="NONE")
    image_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    supplier_mappings = relationship("ProductSupplierMap", back_populates="product", cascade="all, delete-orphan")
    inventories = relationship("Inventory", back_populates="product", cascade="all, delete-orphan")
    po_items = relationship("PurchaseOrderItem", back_populates="product")
    forecasts = relationship("DemandForecast", back_populates="product", cascade="all, delete-orphan")

class ProductSupplierMap(Base):
    __tablename__ = "product_supplier_mappings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    supplier_sku = Column(String(100), nullable=True)
    supplier_cost = Column(Float, default=0.0)
    lead_time_days = Column(Integer, default=7)
    is_primary = Column(String(10), default="YES")

    product = relationship("Product", back_populates="supplier_mappings")
    supplier = relationship("Supplier", back_populates="product_mappings")
