from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.repositories.base import BaseRepository
from app.models.product import Product, ProductSupplierMap

class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: Session):
        super().__init__(Product, db)

    def get_by_code(self, product_code: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.product_code == product_code.strip()).first()

    def get_by_sku(self, sku: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.sku == sku.strip()).first()

    def get_by_barcode(self, barcode: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.barcode == barcode.strip()).first()

    def search_products(self, query_str: Optional[str] = None, category: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Product]:
        q = self.db.query(Product)
        if category:
            q = q.filter(Product.category == category)
        if query_str:
            term = f"%{query_str.strip()}%"
            q = q.filter(
                or_(
                    Product.name.ilike(term),
                    Product.sku.ilike(term),
                    Product.product_code.ilike(term),
                    Product.brand.ilike(term)
                )
            )
        return q.order_by(Product.id.desc()).offset(skip).limit(limit).all()

    def add_supplier_mapping(self, product_id: int, mapping_data: dict) -> ProductSupplierMap:
        mapping = ProductSupplierMap(product_id=product_id, **mapping_data)
        self.db.add(mapping)
        self.db.commit()
        self.db.refresh(mapping)
        return mapping
