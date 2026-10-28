from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.fleet_repo import VehicleRepository, DriverRepository
from app.models.vehicle import Vehicle, MaintenanceLog, VehicleStatus
from app.models.driver import Driver, DrivingIncident, DriverStatus
from app.schemas.fleet import VehicleCreate, VehicleUpdate, DriverCreate, DriverUpdate, MaintenanceLogCreate, DrivingIncidentCreate

class FleetService:
    def __init__(self, db: Session):
        self.db = db
        self.veh_repo = VehicleRepository(db)
        self.drv_repo = DriverRepository(db)

    # Vehicles
    def get_all_vehicles(self, skip: int = 0, limit: int = 100) -> List[Vehicle]:
        return self.veh_repo.get_multi(skip=skip, limit=limit)

    def get_vehicle_by_id(self, vehicle_id: int) -> Vehicle:
        v = self.veh_repo.get(vehicle_id)
        if not v:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        return v

    def create_vehicle(self, v_in: VehicleCreate) -> Vehicle:
        if self.veh_repo.get_by_registration(v_in.registration_number):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration number already exists")
        return self.veh_repo.create(v_in.model_dump())

    def update_vehicle(self, vehicle_id: int, v_in: VehicleUpdate) -> Vehicle:
        v = self.get_vehicle_by_id(vehicle_id)
        return self.veh_repo.update(v, v_in.model_dump(exclude_unset=True))

    def log_maintenance(self, vehicle_id: int, log_in: MaintenanceLogCreate) -> MaintenanceLog:
        self.get_vehicle_by_id(vehicle_id)
        return self.veh_repo.add_maintenance_log(vehicle_id, log_in.model_dump())

    # Drivers
    def get_all_drivers(self, skip: int = 0, limit: int = 100) -> List[Driver]:
        return self.drv_repo.get_multi(skip=skip, limit=limit)

    def get_driver_by_id(self, driver_id: int) -> Driver:
        d = self.drv_repo.get(driver_id)
        if not d:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")
        return d

    def create_driver(self, d_in: DriverCreate) -> Driver:
        if self.drv_repo.get_by_license(d_in.driver_license_number):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver license already registered")
        return self.drv_repo.create(d_in.model_dump())

    def update_driver(self, driver_id: int, d_in: DriverUpdate) -> Driver:
        d = self.get_driver_by_id(driver_id)
        return self.drv_repo.update(d, d_in.model_dump(exclude_unset=True))

    def log_incident(self, driver_id: int, inc_in: DrivingIncidentCreate) -> DrivingIncident:
        self.get_driver_by_id(driver_id)
        return self.drv_repo.add_incident(driver_id, inc_in.model_dump())
