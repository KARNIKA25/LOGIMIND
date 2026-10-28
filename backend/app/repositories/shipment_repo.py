from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.repositories.base import BaseRepository
from app.models.shipment import Shipment, ShipmentEvent, ShipmentStatus

class ShipmentRepository(BaseRepository[Shipment]):
    def __init__(self, db: Session):
        super().__init__(Shipment, db)

    def get_by_tracking_number(self, tracking_number: str) -> Optional[Shipment]:
        return self.db.query(Shipment).filter(Shipment.tracking_number == tracking_number.strip().upper()).first()

    def add_event(self, shipment_id: int, status: str, location_name: str, lat: Optional[float] = None, lng: Optional[float] = None, details: Optional[str] = None) -> ShipmentEvent:
        event = ShipmentEvent(
            shipment_id=shipment_id,
            status=status,
            location_name=location_name,
            latitude=lat,
            longitude=lng,
            event_details=details,
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(event)
        
        # Update shipment location & status
        shipment = self.get(shipment_id)
        if shipment:
            if hasattr(ShipmentStatus, status):
                shipment.status = getattr(ShipmentStatus, status)
            if lat is not None and lng is not None:
                shipment.current_latitude = lat
                shipment.current_longitude = lng
                shipment.last_location_update = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(event)
        return event

    def search_shipments(self, query_str: Optional[str] = None, status: Optional[ShipmentStatus] = None, driver_id: Optional[int] = None, warehouse_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Shipment]:
        q = self.db.query(Shipment)
        if status:
            q = q.filter(Shipment.status == status)
        if driver_id:
            q = q.filter(Shipment.driver_id == driver_id)
        if warehouse_id:
            q = q.filter(or_(Shipment.origin_warehouse_id == warehouse_id, Shipment.destination_warehouse_id == warehouse_id))
        if query_str:
            term = f"%{query_str.strip()}%"
            q = q.filter(
                or_(
                    Shipment.tracking_number.ilike(term),
                    Shipment.recipient_name.ilike(term),
                    Shipment.destination_address.ilike(term)
                )
            )
        return q.order_by(Shipment.id.desc()).offset(skip).limit(limit).all()
