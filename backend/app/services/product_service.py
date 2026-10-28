from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.product_repo import ProductRepository
from app.models.product import Product, ProductSupplierMap
from app.schemas.product import ProductCreate, ProductUpdate, ProductSupplierMapCreate

class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductRepository(db)

    def get_all(self, query_str: Optional[str] = None, category: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Product]:
        return self.repo.search_products(query_str=query_str, category=category, skip=skip, limit=limit)

    def get_by_id(self, product_id: int) -> Product:
        p = self.repo.get(product_id)
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return p

    def create(self, p_in: ProductCreate) -> Product:
        if self.repo.get_by_code(p_in.product_code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product code already exists")
        if self.repo.get_by_sku(p_in.sku):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")
        
        data = p_in.model_dump(exclude={"supplier_mappings"})
        p = self.repo.create(data)

        if p_in.supplier_mappings:
            for sm in p_in.supplier_mappings:
                self.repo.add_supplier_mapping(p.id, sm.model_dump())

        self.db.refresh(p)
        return p

    def update(self, product_id: int, p_in: ProductUpdate) -> Product:
        p = self.get_by_id(product_id)
        return self.repo.update(p, p_in.model_dump(exclude_unset=True))

    def delete(self, product_id: int) -> Product:
        p = self.get_by_id(product_id)
        return self.repo.delete(product_id)

    def link_supplier(self, product_id: int, sm_in: ProductSupplierMapCreate) -> ProductSupplierMap:
        p = self.get_by_id(product_id)
        return self.repo.add_supplier_mapping(product_id, sm_in.model_dump())
