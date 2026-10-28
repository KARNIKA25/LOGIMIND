import uuid
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.shipment_repo import ShipmentRepository
from app.repositories.warehouse_repo import WarehouseRepository
from app.repositories.fleet_repo import VehicleRepository, DriverRepository
from app.models.shipment import Shipment, ShipmentStatus, ShipmentPriority
from app.models.vehicle import VehicleStatus
from app.models.driver import DriverStatus
from app.schemas.shipment import ShipmentCreate, ShipmentUpdate

class ShipmentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ShipmentRepository(db)
        self.wh_repo = WarehouseRepository(db)
        self.veh_repo = VehicleRepository(db)
        self.drv_repo = DriverRepository(db)

    def get_all(self, query_str: Optional[str] = None, status_filter: Optional[ShipmentStatus] = None, driver_id: Optional[int] = None, warehouse_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Shipment]:
        return self.repo.search_shipments(
            query_str=query_str,
            status=status_filter,
            driver_id=driver_id,
            warehouse_id=warehouse_id,
            skip=skip,
            limit=limit
        )

    def get_by_id(self, shipment_id: int) -> Shipment:
        s = self.repo.get(shipment_id)
        if not s:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
        return s

    def get_by_tracking(self, tracking_number: str) -> Shipment:
        s = self.repo.get_by_tracking_number(tracking_number)
        if not s:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment tracking number not found")
        return s

    def create(self, s_in: ShipmentCreate) -> Shipment:
        origin_wh = self.wh_repo.get(s_in.origin_warehouse_id)
        if not origin_wh:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Origin warehouse not found")

        tracking_number = f"LM-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        data = s_in.model_dump()
        data["tracking_number"] = tracking_number
        data["status"] = ShipmentStatus.CREATED
        data["current_latitude"] = origin_wh.latitude
        data["current_longitude"] = origin_wh.longitude
        data["last_location_update"] = datetime.now(timezone.utc)
        
        # Calculate base AI risk score
        data["ai_risk_score"] = 0.08 if s_in.priority == ShipmentPriority.EXPRESS else 0.04
        data["ai_predicted_delay_mins"] = 0
        data["ai_recommendation"] = "Route clear. Standard dispatch protocol advised."

        shipment = self.repo.create(data)

        # Log initial event
        self.repo.add_event(
            shipment_id=shipment.id,
            status="CREATED",
            location_name=f"Warehouse: {origin_wh.name}",
            lat=origin_wh.latitude,
            lng=origin_wh.longitude,
            details="Shipment created and manifests registered into LogiMind dispatch."
        )

        return shipment

    def dispatch(self, shipment_id: int, vehicle_id: int, driver_id: int) -> Shipment:
        shipment = self.get_by_id(shipment_id)
        vehicle = self.veh_repo.get(vehicle_id)
        driver = self.drv_repo.get(driver_id)

        if not vehicle or not driver:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid vehicle or driver assignment")

        vehicle.status = VehicleStatus.ON_TRIP
        driver.status = DriverStatus.ON_DUTY
        driver.assigned_vehicle_id = vehicle.id

        shipment.vehicle_id = vehicle_id
        shipment.driver_id = driver_id
        shipment.status = ShipmentStatus.DISPATCHED
        shipment.actual_dispatch_time = datetime.now(timezone.utc)

        self.db.commit()

        self.repo.add_event(
            shipment_id=shipment.id,
            status="DISPATCHED",
            location_name="Origin Dispatch Yard",
            lat=shipment.current_latitude,
            lng=shipment.current_longitude,
            details=f"Dispatched via vehicle {vehicle.registration_number}, Driver: {driver.user.username if driver.user else 'Assigned'}"
        )

        return shipment

    def update_location_and_telemetry(self, shipment_id: int, lat: float, lng: float, location_name: str, status_str: Optional[str] = None) -> Shipment:
        shipment = self.get_by_id(shipment_id)
        current_st = status_str or shipment.status.value
        
        event = self.repo.add_event(
            shipment_id=shipment.id,
            status=current_st,
            location_name=location_name,
            lat=lat,
            lng=lng,
            details=f"Live telematics ping from IoT tracker at {location_name}"
        )
        return shipment

    def mark_delivered(self, shipment_id: int, signature_url: Optional[str] = None, pod_url: Optional[str] = None) -> Shipment:
        shipment = self.get_by_id(shipment_id)
        shipment.status = ShipmentStatus.DELIVERED
        shipment.actual_delivery_time = datetime.now(timezone.utc)
        if signature_url:
            shipment.signature_url = signature_url
        if pod_url:
            shipment.proof_of_delivery_url = pod_url

        # Free vehicle and driver
        if shipment.vehicle_id:
            veh = self.veh_repo.get(shipment.vehicle_id)
            if veh:
                veh.status = VehicleStatus.AVAILABLE
        if shipment.driver_id:
            drv = self.drv_repo.get(shipment.driver_id)
            if drv:
                drv.status = DriverStatus.AVAILABLE
                drv.total_trips_completed += 1

        self.db.commit()

        self.repo.add_event(
            shipment_id=shipment.id,
            status="DELIVERED",
            location_name=shipment.destination_address,
            lat=shipment.destination_latitude,
            lng=shipment.destination_longitude,
            details="Package signed and successfully delivered to recipient."
        )

        return shipment

    def update(self, shipment_id: int, s_in: ShipmentUpdate) -> Shipment:
        shipment = self.get_by_id(shipment_id)
        return self.repo.update(shipment, s_in.model_dump(exclude_unset=True))
