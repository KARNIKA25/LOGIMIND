from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.supplier_repo import SupplierRepository
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate

class SupplierService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SupplierRepository(db)

    def get_all(self, query_str: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Supplier]:
        return self.repo.search_suppliers(query_str=query_str, skip=skip, limit=limit)

    def get_by_id(self, supplier_id: int) -> Supplier:
        s = self.repo.get(supplier_id)
        if not s:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
        return s

    def create(self, s_in: SupplierCreate) -> Supplier:
        if self.repo.get_by_code(s_in.supplier_code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supplier code already exists")
        return self.repo.create(s_in.model_dump())

    def update(self, supplier_id: int, s_in: SupplierUpdate) -> Supplier:
        s = self.get_by_id(supplier_id)
        return self.repo.update(s, s_in.model_dump(exclude_unset=True))

    def delete(self, supplier_id: int) -> Supplier:
        s = self.get_by_id(supplier_id)
        return self.repo.delete(supplier_id)
