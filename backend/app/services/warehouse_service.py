from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.warehouse_repo import WarehouseRepository
from app.models.warehouse import Warehouse, StorageZone, WarehouseStatus
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate, StorageZoneCreate

class WarehouseService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = WarehouseRepository(db)

    def get_all(self, search: Optional[str] = None, status: Optional[WarehouseStatus] = None, skip: int = 0, limit: int = 100) -> List[Warehouse]:
        return self.repo.search_warehouses(search=search, status=status, skip=skip, limit=limit)

    def get_by_id(self, warehouse_id: int) -> Warehouse:
        wh = self.repo.get(warehouse_id)
        if not wh:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
        return wh

    def create(self, wh_in: WarehouseCreate) -> Warehouse:
        if self.repo.get_by_code(wh_in.warehouse_code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Warehouse code already exists")
        
        data = wh_in.model_dump(exclude={"initial_zones"})
        wh = self.repo.create(data)

        # Create default storage zones if provided or auto-create standard zones
        zones = wh_in.initial_zones or [
            StorageZoneCreate(zone_code="ZONE-A-DRY", zone_name="Dry Bulk Storage", zone_type="DRY_STORAGE", capacity=wh.total_capacity * 0.5),
            StorageZoneCreate(zone_code="ZONE-B-COLD", zone_name="Temperature Controlled Cold Chain", zone_type="COLD_CHAIN", capacity=wh.total_capacity * 0.3, temperature_celsius=4.0, humidity_percentage=60.0),
            StorageZoneCreate(zone_code="ZONE-C-HAZ", zone_name="High Security & HazMat", zone_type="HAZARDOUS", capacity=wh.total_capacity * 0.2)
        ]
        for z in zones:
            self.repo.add_storage_zone(wh.id, z.model_dump())

        self.db.refresh(wh)
        return wh

    def update(self, warehouse_id: int, wh_in: WarehouseUpdate) -> Warehouse:
        wh = self.get_by_id(warehouse_id)
        return self.repo.update(wh, wh_in.model_dump(exclude_unset=True))

    def delete(self, warehouse_id: int) -> Warehouse:
        wh = self.get_by_id(warehouse_id)
        return self.repo.delete(warehouse_id)

    def recalculate_utilization(self, warehouse_id: int) -> float:
        wh = self.get_by_id(warehouse_id)
        total_zone_load = sum(z.current_load for z in wh.storage_zones) if wh.storage_zones else 0.0
        if wh.total_capacity > 0:
            wh.current_utilization = min(100.0, round((total_zone_load / wh.total_capacity) * 100, 2))
        self.db.commit()
        self.db.refresh(wh)
        return wh.current_utilization
