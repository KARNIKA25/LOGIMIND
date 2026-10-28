from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, POStatus

class PurchaseOrderRepository(BaseRepository[PurchaseOrder]):
    def __init__(self, db: Session):
        super().__init__(PurchaseOrder, db)

    def get_by_number(self, po_number: str) -> Optional[PurchaseOrder]:
        return self.db.query(PurchaseOrder).filter(PurchaseOrder.po_number == po_number.strip().upper()).first()

    def create_po_with_items(self, po_data: dict, items_data: list) -> PurchaseOrder:
        po = PurchaseOrder(**po_data)
        self.db.add(po)
        self.db.flush()

        subtotal = 0.0
        for item in items_data:
            tot = item["quantity"] * item["unit_price"]
            subtotal += tot
            po_item = PurchaseOrderItem(
                po_id=po.id,
                product_id=item["product_id"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                total_price=tot
            )
            self.db.add(po_item)

        po.total_amount = subtotal
        po.tax_amount = round(subtotal * 0.08, 2) # 8% standard tax
        po.grand_total = round(po.total_amount + po.tax_amount, 2)

        self.db.commit()
        self.db.refresh(po)
        return po

    def update_status(self, po_id: int, status: POStatus, approved_by_id: Optional[int] = None) -> Optional[PurchaseOrder]:
        po = self.get(po_id)
        if po:
            po.status = status
            if approved_by_id:
                po.approved_by_id = approved_by_id
            self.db.commit()
            self.db.refresh(po)
        return po
