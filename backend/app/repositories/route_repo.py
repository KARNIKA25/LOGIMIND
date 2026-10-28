from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.route import RoutePlan, RouteOptimizationLog

class RouteRepository(BaseRepository[RoutePlan]):
    def __init__(self, db: Session):
        super().__init__(RoutePlan, db)

    def get_by_shipment_id(self, shipment_id: int) -> Optional[RoutePlan]:
        return self.db.query(RoutePlan).filter(RoutePlan.shipment_id == shipment_id).first()

    def log_optimization(self, route_plan_id: int, log_data: dict) -> RouteOptimizationLog:
        opt_log = RouteOptimizationLog(route_plan_id=route_plan_id, **log_data)
        self.db.add(opt_log)
        self.db.commit()
        self.db.refresh(opt_log)
        return opt_log
