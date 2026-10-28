from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.repositories.base import BaseRepository
from app.models.supplier import Supplier

class SupplierRepository(BaseRepository[Supplier]):
    def __init__(self, db: Session):
        super().__init__(Supplier, db)

    def get_by_code(self, code: str) -> Optional[Supplier]:
        return self.db.query(Supplier).filter(Supplier.supplier_code == code.strip().upper()).first()

    def search_suppliers(self, query_str: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Supplier]:
        q = self.db.query(Supplier)
        if query_str:
            term = f"%{query_str.strip()}%"
            q = q.filter(
                or_(
                    Supplier.company_name.ilike(term),
                    Supplier.supplier_code.ilike(term),
                    Supplier.contact_person.ilike(term),
                    Supplier.city.ilike(term)
                )
            )
        return q.order_by(Supplier.rating.desc(), Supplier.id.desc()).offset(skip).limit(limit).all()
