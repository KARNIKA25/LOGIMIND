import uuid
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.purchase_order_repo import PurchaseOrderRepository
from app.repositories.inventory_repo import InventoryRepository
from app.models.purchase_order import PurchaseOrder, POStatus
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderUpdate

class PurchaseOrderService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PurchaseOrderRepository(db)
        self.inv_repo = InventoryRepository(db)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[PurchaseOrder]:
        return self.repo.get_multi(skip=skip, limit=limit)

    def get_by_id(self, po_id: int) -> PurchaseOrder:
        po = self.repo.get(po_id)
        if not po:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase Order not found")
        return po

    def create(self, po_in: PurchaseOrderCreate, user_id: Optional[int] = None) -> PurchaseOrder:
        po_number = f"PO-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
        po_data = {
            "po_number": po_number,
            "supplier_id": po_in.supplier_id,
            "warehouse_id": po_in.warehouse_id,
            "status": POStatus.DRAFT,
            "order_date": datetime.now(timezone.utc),
            "expected_delivery_date": po_in.expected_delivery_date,
            "created_by_id": user_id,
            "terms_and_conditions": po_in.terms_and_conditions,
            "payment_status": po_in.payment_status
        }
        items_data = [item.model_dump() for item in po_in.items]
        return self.repo.create_po_with_items(po_data, items_data)

    def approve(self, po_id: int, user_id: Optional[int] = None) -> PurchaseOrder:
        po = self.get_by_id(po_id)
        if po.status not in [POStatus.DRAFT, POStatus.SUBMITTED]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot approve PO in status: {po.status}")
        return self.repo.update_status(po_id, POStatus.APPROVED, approved_by_id=user_id)

    def mark_completed_and_receive(self, po_id: int, invoice_num: Optional[str] = None) -> PurchaseOrder:
        po = self.get_by_id(po_id)
        if po.status == POStatus.COMPLETED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PO is already completed")

        # Inward stock automatically into destination warehouse for all line items
        for item in po.items:
            self.inv_repo.adjust_stock(
                warehouse_id=po.warehouse_id,
                product_id=item.product_id,
                quantity_change=item.quantity,
                reason=f"PO Fulfillment: {po.po_number}",
                reference_id=po.po_number
            )
            item.received_quantity = item.quantity

        po.status = POStatus.COMPLETED
        po.actual_delivery_date = datetime.now(timezone.utc)
        if invoice_num:
            po.invoice_number = invoice_num
        self.db.commit()
        self.db.refresh(po)
        return po

    def update(self, po_id: int, po_in: PurchaseOrderUpdate) -> PurchaseOrder:
        po = self.get_by_id(po_id)
        return self.repo.update(po, po_in.model_dump(exclude_unset=True))
