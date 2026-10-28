from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class StockTransferStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_TRANSIT = "IN_TRANSIT"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Inventory(Base):
    __tablename__ = "inventories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    
    current_stock = Column(Integer, default=0, nullable=False)
    reserved_stock = Column(Integer, default=0, nullable=False)
    
    # Thresholds
    minimum_stock = Column(Integer, default=50, nullable=False)
    maximum_stock = Column(Integer, default=1000, nullable=False)
    reorder_level = Column(Integer, default=150, nullable=False)
    
    bin_location = Column(String(100), default="A-01-01") # Aisle-Rack-Shelf
    batch_number = Column(String(100), nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    
    last_counted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    warehouse = relationship("Warehouse", back_populates="inventories")
    product = relationship("Product", back_populates="inventories")

    @property
    def available_stock(self) -> int:
        return max(0, (self.current_stock or 0) - (self.reserved_stock or 0))

class StockTransfer(Base):
    __tablename__ = "stock_transfers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transfer_number = Column(String(50), unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    source_warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    destination_warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    status = Column(Enum(StockTransferStatus), default=StockTransferStatus.PENDING, nullable=False)
    
    initiated_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    product = relationship("Product")
    source_warehouse = relationship("Warehouse", foreign_keys=[source_warehouse_id])
    destination_warehouse = relationship("Warehouse", foreign_keys=[destination_warehouse_id])

class StockAudit(Base):
    __tablename__ = "stock_audits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    audit_code = Column(String(50), unique=True, index=True, nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    system_stock = Column(Integer, nullable=False)
    physical_count = Column(Integer, nullable=False)
    variance = Column(Integer, nullable=False) # physical_count - system_stock
    
    audited_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    remarks = Column(Text, nullable=True)
    status = Column(String(50), default="RESOLVED") # PENDING_REVIEW, RESOLVED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    warehouse = relationship("Warehouse")
    product = relationship("Product")

class StockHistory(Base):
    __tablename__ = "stock_histories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    change_type = Column(String(50), nullable=False) # INWARD, OUTWARD, TRANSFER, ADJUSTMENT, AUDIT
    quantity_changed = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    reference_id = Column(String(100), nullable=True)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
