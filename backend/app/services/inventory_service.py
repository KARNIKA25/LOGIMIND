import uuid
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.inventory_repo import InventoryRepository
from app.models.inventory import Inventory, StockTransfer, StockAudit, StockHistory, StockTransferStatus
from app.schemas.inventory import InventoryCreate, InventoryUpdate, StockTransferCreate, StockAuditCreate

class InventoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = InventoryRepository(db)

    def get_all(self, warehouse_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Inventory]:
        filters = {}
        if warehouse_id:
            filters["warehouse_id"] = warehouse_id
        return self.repo.get_multi(skip=skip, limit=limit, filters=filters)

    def get_by_id(self, inventory_id: int) -> Inventory:
        inv = self.repo.get(inventory_id)
        if not inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory record not found")
        return inv

    def upsert_inventory(self, inv_in: InventoryCreate) -> Inventory:
        existing = self.repo.get_by_warehouse_and_product(inv_in.warehouse_id, inv_in.product_id)
        if existing:
            return self.repo.update(existing, inv_in.model_dump())
        return self.repo.create(inv_in.model_dump())

    def update_stock(self, inventory_id: int, inv_in: InventoryUpdate) -> Inventory:
        inv = self.get_by_id(inventory_id)
        old_stock = inv.current_stock
        updated = self.repo.update(inv, inv_in.model_dump(exclude_unset=True))
        
        diff = updated.current_stock - old_stock
        if diff != 0:
            history = StockHistory(
                warehouse_id=inv.warehouse_id,
                product_id=inv.product_id,
                change_type="MANUAL_ADJUSTMENT",
                quantity_changed=diff,
                balance_after=updated.current_stock,
                reason="Manual Inventory Modification"
            )
            self.db.add(history)
            self.db.commit()
            
        return updated

    def get_low_stock(self, warehouse_id: Optional[int] = None) -> List[Inventory]:
        return self.repo.get_low_stock_items(warehouse_id)

    def initiate_transfer(self, transfer_in: StockTransferCreate, user_id: Optional[int] = None) -> StockTransfer:
        # Verify source inventory availability
        source_inv = self.repo.get_by_warehouse_and_product(transfer_in.source_warehouse_id, transfer_in.product_id)
        if not source_inv or source_inv.available_stock < transfer_in.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient available stock at source warehouse. Available: {source_inv.available_stock if source_inv else 0}"
            )

        # Reserve stock
        source_inv.reserved_stock += transfer_in.quantity
        self.db.commit()

        transfer_number = f"TRF-{uuid.uuid4().hex[:8].upper()}"
        data = transfer_in.model_dump()
        data["transfer_number"] = transfer_number
        data["status"] = StockTransferStatus.IN_TRANSIT
        data["initiated_by_id"] = user_id
        
        return self.repo.create_transfer(data)

    def complete_transfer(self, transfer_id: int, user_id: Optional[int] = None) -> StockTransfer:
        transfer = self.repo.get_transfer(transfer_id)
        if not transfer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")
        if transfer.status == StockTransferStatus.COMPLETED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transfer already completed")

        # Deduct from source and un-reserve
        source_inv = self.repo.get_by_warehouse_and_product(transfer.source_warehouse_id, transfer.product_id)
        if source_inv:
            source_inv.current_stock = max(0, source_inv.current_stock - transfer.quantity)
            source_inv.reserved_stock = max(0, source_inv.reserved_stock - transfer.quantity)

        # Add to destination
        self.repo.adjust_stock(
            warehouse_id=transfer.destination_warehouse_id,
            product_id=transfer.product_id,
            quantity_change=transfer.quantity,
            reason=f"Stock Transfer Inward: {transfer.transfer_number}",
            reference_id=transfer.transfer_number
        )

        transfer.status = StockTransferStatus.COMPLETED
        transfer.approved_by_id = user_id
        transfer.completed_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(transfer)
        return transfer

    def conduct_audit(self, audit_in: StockAuditCreate, user_id: Optional[int] = None) -> StockAudit:
        inv = self.repo.get_by_warehouse_and_product(audit_in.warehouse_id, audit_in.product_id)
        current_sys_stock = inv.current_stock if inv else 0
        variance = audit_in.physical_count - current_sys_stock

        audit_code = f"AUD-{uuid.uuid4().hex[:8].upper()}"
        data = {
            "audit_code": audit_code,
            "warehouse_id": audit_in.warehouse_id,
            "product_id": audit_in.product_id,
            "system_stock": current_sys_stock,
            "physical_count": audit_in.physical_count,
            "variance": variance,
            "audited_by_id": user_id,
            "remarks": audit_in.remarks,
            "status": "RESOLVED" if variance == 0 else "PENDING_REVIEW"
        }
        
        # If discrepancy exists, optionally synchronize
        if inv:
            inv.last_counted_at = datetime.now(timezone.utc)
            self.db.commit()

        return self.repo.create_audit(data)

    def get_audit_records(self, warehouse_id: Optional[int] = None) -> List[StockAudit]:
        return self.repo.get_audits(warehouse_id)

    def get_stock_history(self, product_id: Optional[int] = None, warehouse_id: Optional[int] = None) -> List[StockHistory]:
        return self.repo.get_history(product_id, warehouse_id)
