from typing import Optional, List, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.inventory import Inventory, StockTransfer, StockAudit, StockHistory, StockTransferStatus

class InventoryRepository(BaseRepository[Inventory]):
    def __init__(self, db: Session):
        super().__init__(Inventory, db)

    def get_by_warehouse_and_product(self, warehouse_id: int, product_id: int) -> Optional[Inventory]:
        return self.db.query(Inventory).filter(
            Inventory.warehouse_id == warehouse_id,
            Inventory.product_id == product_id
        ).first()

    def get_low_stock_items(self, warehouse_id: Optional[int] = None) -> List[Inventory]:
        q = self.db.query(Inventory).filter(Inventory.current_stock <= Inventory.reorder_level)
        if warehouse_id:
            q = q.filter(Inventory.warehouse_id == warehouse_id)
        return q.all()

    def get_low_stock(self, warehouse_id: Optional[int] = None) -> List[Inventory]:
        return self.get_low_stock_items(warehouse_id)


    def adjust_stock(self, warehouse_id: int, product_id: int, quantity_change: int, reason: str, reference_id: Optional[str] = None) -> Inventory:
        inv = self.get_by_warehouse_and_product(warehouse_id, product_id)
        if not inv:
            inv = Inventory(
                warehouse_id=warehouse_id,
                product_id=product_id,
                current_stock=max(0, quantity_change),
                reserved_stock=0
            )
            self.db.add(inv)
            self.db.flush()
        else:
            inv.current_stock = max(0, inv.current_stock + quantity_change)
            
        # Record history
        history = StockHistory(
            warehouse_id=warehouse_id,
            product_id=product_id,
            change_type="INWARD" if quantity_change > 0 else "OUTWARD",
            quantity_changed=quantity_change,
            balance_after=inv.current_stock,
            reference_id=reference_id,
            reason=reason
        )
        self.db.add(history)
        self.db.commit()
        self.db.refresh(inv)
        return inv

    def create_transfer(self, transfer_dict: dict) -> StockTransfer:
        transfer = StockTransfer(**transfer_dict)
        self.db.add(transfer)
        self.db.commit()
        self.db.refresh(transfer)
        return transfer

    def get_transfer(self, transfer_id: int) -> Optional[StockTransfer]:
        return self.db.query(StockTransfer).filter(StockTransfer.id == transfer_id).first()

    def get_transfers(self, skip: int = 0, limit: int = 100) -> List[StockTransfer]:
        return self.db.query(StockTransfer).order_by(StockTransfer.id.desc()).offset(skip).limit(limit).all()

    def create_audit(self, audit_dict: dict) -> StockAudit:
        audit = StockAudit(**audit_dict)
        self.db.add(audit)
        self.db.commit()
        self.db.refresh(audit)
        return audit

    def get_audits(self, warehouse_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[StockAudit]:
        q = self.db.query(StockAudit)
        if warehouse_id:
            q = q.filter(StockAudit.warehouse_id == warehouse_id)
        return q.order_by(StockAudit.id.desc()).offset(skip).limit(limit).all()

    def get_history(self, product_id: Optional[int] = None, warehouse_id: Optional[int] = None, limit: int = 100) -> List[StockHistory]:
        q = self.db.query(StockHistory)
        if product_id:
            q = q.filter(StockHistory.product_id == product_id)
        if warehouse_id:
            q = q.filter(StockHistory.warehouse_id == warehouse_id)
        return q.order_by(StockHistory.id.desc()).limit(limit).all()
