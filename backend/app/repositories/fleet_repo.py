from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.repositories.base import BaseRepository
from app.models.vehicle import Vehicle, MaintenanceLog, VehicleStatus
from app.models.driver import Driver, DrivingIncident, DriverStatus

class VehicleRepository(BaseRepository[Vehicle]):
    def __init__(self, db: Session):
        super().__init__(Vehicle, db)

    def get_by_registration(self, reg_num: str) -> Optional[Vehicle]:
        return self.db.query(Vehicle).filter(Vehicle.registration_number == reg_num.strip().upper()).first()

    def get_available_vehicles(self) -> List[Vehicle]:
        return self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.AVAILABLE).all()

    def add_maintenance_log(self, vehicle_id: int, log_data: dict) -> MaintenanceLog:
        log = MaintenanceLog(vehicle_id=vehicle_id, **log_data)
        self.db.add(log)
        
        vehicle = self.get(vehicle_id)
        if vehicle:
            vehicle.last_maintenance_date = datetime.now(timezone.utc)
            vehicle.status = VehicleStatus.IN_MAINTENANCE

        self.db.commit()
        self.db.refresh(log)
        return log

class DriverRepository(BaseRepository[Driver]):
    def __init__(self, db: Session):
        super().__init__(Driver, db)

    def get_by_user_id(self, user_id: int) -> Optional[Driver]:
        return self.db.query(Driver).filter(Driver.user_id == user_id).first()

    def get_by_license(self, license_num: str) -> Optional[Driver]:
        return self.db.query(Driver).filter(Driver.driver_license_number == license_num.strip().upper()).first()

    def get_available_drivers(self) -> List[Driver]:
        return self.db.query(Driver).filter(Driver.status == DriverStatus.AVAILABLE).all()

    def add_incident(self, driver_id: int, incident_data: dict) -> DrivingIncident:
        incident = DrivingIncident(driver_id=driver_id, **incident_data)
        self.db.add(incident)
        
        driver = self.get(driver_id)
        if driver:
            # Slight deduction in safety score based on severity
            sev = incident_data.get("severity", "LOW")
            deduction = 0.05 if sev == "LOW" else (0.15 if sev == "MEDIUM" else 0.4)
            driver.safety_rating = max(1.0, round(driver.safety_rating - deduction, 2))

        self.db.commit()
        self.db.refresh(incident)
        return incident
