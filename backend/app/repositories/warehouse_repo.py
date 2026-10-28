from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.repositories.base import BaseRepository
from app.models.warehouse import Warehouse, StorageZone, WarehouseStatus

class WarehouseRepository(BaseRepository[Warehouse]):
    def __init__(self, db: Session):
        super().__init__(Warehouse, db)

    def get_by_code(self, warehouse_code: str) -> Optional[Warehouse]:
        return self.db.query(Warehouse).filter(Warehouse.warehouse_code == warehouse_code.upper().strip()).first()

    def search_warehouses(self, search: Optional[str] = None, status: Optional[WarehouseStatus] = None, skip: int = 0, limit: int = 100) -> List[Warehouse]:
        query = self.db.query(Warehouse)
        if status:
            query = query.filter(Warehouse.status == status)
        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Warehouse.name.ilike(term),
                    Warehouse.warehouse_code.ilike(term),
                    Warehouse.city.ilike(term),
                    Warehouse.country.ilike(term)
                )
            )
        return query.order_by(Warehouse.id.desc()).offset(skip).limit(limit).all()

    def add_storage_zone(self, warehouse_id: int, zone_data: dict) -> StorageZone:
        zone = StorageZone(warehouse_id=warehouse_id, **zone_data)
        self.db.add(zone)
        self.db.commit()
        self.db.refresh(zone)
        return zone
