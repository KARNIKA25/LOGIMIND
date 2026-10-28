import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.security import get_password_hash

logger = logging.getLogger("logimind.seeder")

def run_seed(db: Session):
    """Populate the database with rich demo data on first launch."""
    from app.models.user import User, UserProfile, UserRole
    from app.models.warehouse import Warehouse, StorageZone
    from app.models.supplier import Supplier
    from app.models.product import Product, ProductSupplierMap
    from app.models.inventory import Inventory
    from app.models.vehicle import Vehicle, VehicleType, VehicleStatus
    from app.models.driver import Driver, DriverStatus
    from app.models.shipment import Shipment, ShipmentEvent, ShipmentStatus, ShipmentPriority

    # Skip if already seeded
    if db.query(User).count() > 0:
        return

    logger.info("🌱 Seeding production-quality demo data...")

    # ─── Users ───────────────────────────────────────────────────────────────
    users_data = [
        {"email": "admin@logimind.ai", "username": "superadmin", "role": UserRole.ADMIN, "first_name": "Alexandra", "last_name": "Chen"},
        {"email": "manager@logimind.ai", "username": "ops_manager", "role": UserRole.MANAGER, "first_name": "Marcus", "last_name": "Rivera"},
        {"email": "wh_sf@logimind.ai", "username": "wh_manager_sf", "role": UserRole.WAREHOUSE_MANAGER, "first_name": "Sarah", "last_name": "Mitchell"},
        {"email": "driver1@logimind.ai", "username": "driver_kai", "role": UserRole.DRIVER, "first_name": "Kai", "last_name": "Anderson"},
        {"email": "driver2@logimind.ai", "username": "driver_sofia", "role": UserRole.DRIVER, "first_name": "Sofia", "last_name": "Torres"},
        {"email": "supplier1@globaltech.com", "username": "apex_supplier", "role": UserRole.SUPPLIER, "first_name": "James", "last_name": "Whitfield"},
    ]
    created_users = []
    for u in users_data:
        user = User(
            email=u["email"], username=u["username"],
            hashed_password=get_password_hash("LogiMind@2026"),
            role=u["role"], is_active=True, is_verified=True
        )
        db.add(user)
        db.flush()
        profile = UserProfile(
            user_id=user.id,
            first_name=u["first_name"], last_name=u["last_name"],
            phone=f"+1-415-{user.id:03d}-9{user.id:04d}",
            country="United States",
            timezone="America/Los_Angeles",
            language="en"
        )
        db.add(profile)
        created_users.append(user)

    db.flush()
    admin, manager, wh_mgr, driver1, driver2, supplier_user = created_users

    # ─── Warehouses ──────────────────────────────────────────────────────────
    warehouses_data = [
        {"code": "WH-SF-01", "name": "Bay Area Central Logistics Hub", "city": "San Francisco", "state": "CA", "lat": 37.7749, "lng": -122.4194, "capacity": 18000, "util": 82.4, "manager_id": wh_mgr.id},
        {"code": "WH-LA-02", "name": "Pacific Coast Intermodal Port Hub", "city": "Los Angeles", "state": "CA", "lat": 34.0522, "lng": -118.2437, "capacity": 25000, "util": 74.6, "manager_id": manager.id},
        {"code": "WH-CHI-03", "name": "Midwest Cold Chain Facility", "city": "Chicago", "state": "IL", "lat": 41.8781, "lng": -87.6298, "capacity": 20000, "util": 69.2, "manager_id": None},
        {"code": "WH-NYC-04", "name": "Eastern Gateway Megahub", "city": "New York", "state": "NY", "lat": 40.7128, "lng": -74.0060, "capacity": 30000, "util": 88.5, "manager_id": None},
    ]
    created_warehouses = []
    for wh in warehouses_data:
        warehouse = Warehouse(
            warehouse_code=wh["code"], name=wh["name"],
            address=f"{wh['city']} Freight Logistics District", city=wh["city"],
            state=wh["state"], country="USA", postal_code="00000",
            latitude=wh["lat"], longitude=wh["lng"],
            total_capacity=wh["capacity"], current_utilization=wh["util"],
            manager_id=wh["manager_id"],
            contact_phone="+1-800-LOGIMIND", contact_email=f"ops@{wh['code'].lower().replace('-','')}.logimind.ai",
            status="ACTIVE", operating_hours="24/7",
            amenities=["Cold Storage", "HazMat Approved", "Dock Levelers", "CCTV 360°", "EV Charging Bays", "Automation Conveyors"]
        )
        db.add(warehouse)
        db.flush()
        # Add zones
        zones = [
            StorageZone(warehouse_id=warehouse.id, zone_code="ZONE-A-DRY", zone_name="Dry Bulk Storage", zone_type="DRY_STORAGE", capacity=wh["capacity"] * 0.5, current_load=wh["capacity"] * 0.5 * (wh["util"] / 100)),
            StorageZone(warehouse_id=warehouse.id, zone_code="ZONE-B-COLD", zone_name="Temperature-Controlled Cold Chain", zone_type="COLD_CHAIN", capacity=wh["capacity"] * 0.3, current_load=wh["capacity"] * 0.3 * (wh["util"] / 100), temperature_celsius=4.0, humidity_percentage=60.0),
            StorageZone(warehouse_id=warehouse.id, zone_code="ZONE-C-HAZ", zone_name="High-Security HazMat Zone", zone_type="HAZARDOUS", capacity=wh["capacity"] * 0.2, current_load=wh["capacity"] * 0.2 * (wh["util"] / 100)),
        ]
        db.add_all(zones)
        created_warehouses.append(warehouse)

    db.flush()
    wh_sf, wh_la, wh_chi, wh_nyc = created_warehouses

    # ─── Suppliers ───────────────────────────────────────────────────────────
    suppliers_data = [
        {"code": "SUP-APEX-001", "company": "Apex Precision Technologies", "contact": "James Whitfield", "email": "james@apextech.com", "city": "Seattle", "country": "USA", "rating": 4.95},
        {"code": "SUP-NTEC-002", "company": "Nordic Thermal Components Ltd", "contact": "Anna Lindstrom", "email": "anna@nordictherm.eu", "city": "Stockholm", "country": "Sweden", "rating": 4.82},
        {"code": "SUP-GLTF-003", "company": "Global TransLogistics Freight Co", "contact": "Carlos Mendez", "email": "carlos@gltfreight.com", "city": "Miami", "country": "USA", "rating": 4.88},
        {"code": "SUP-PIND-004", "company": "Pacific Industrial Hardware", "contact": "Mei Zhang", "email": "mei@pacifichw.com", "city": "Shenzhen", "country": "China", "rating": 4.76},
    ]
    created_suppliers = []
    for s in suppliers_data:
        supplier = Supplier(
            supplier_code=s["code"], company_name=s["company"], contact_person=s["contact"],
            email=s["email"], phone="+1-800-000-0000",
            address=f"{s['city']} Industrial Park", city=s["city"], country=s["country"],
            rating=s["rating"], reliability_score=s["rating"] * 20,
            payment_terms="Net 30", status="ACTIVE",
            performance_metrics={"total_orders": 245, "on_time_deliveries": 241, "defect_rate": 0.008}
        )
        db.add(supplier)
        created_suppliers.append(supplier)

    db.flush()
    sup_apex, sup_nordic, sup_gltf, sup_pacific = created_suppliers

    # ─── Products ────────────────────────────────────────────────────────────
    products_data = [
        {"code": "PRD-LIDAR-001", "name": "Ultra-Precision LiDAR Sensor Module X900", "category": "Electronics", "brand": "ApexSense", "sku": "SEN-LIDAR-900", "price": 599.99, "weight": 0.85, "supplier_id": sup_apex.id},
        {"code": "PRD-IOTGW-002", "name": "Industrial IoT Telematics Gateway Pro", "category": "Electronics", "brand": "TechBridge", "sku": "IOT-GW-400", "price": 499.50, "weight": 1.20, "supplier_id": sup_nordic.id},
        {"code": "PRD-COLD-003", "name": "Cold-Chain Thermal Insulated Pallet Box XL", "category": "Packaging", "brand": "FrostGuard", "sku": "PKG-COLD-200", "price": 349.00, "weight": 12.50, "supplier_id": sup_gltf.id},
        {"code": "PRD-AXLE-004", "name": "Heavy Duty Commercial Axle Bearing Set", "category": "Mechanical", "brand": "DuraForce", "sku": "MEC-AXLE-88", "price": 699.99, "weight": 8.40, "supplier_id": sup_pacific.id},
        {"code": "PRD-RFID-005", "name": "RFID Asset Tracking Tag Bulk Pack (500 units)", "category": "Electronics", "brand": "TrackPro", "sku": "TRK-RFID-500", "price": 180.00, "weight": 2.30, "supplier_id": sup_apex.id},
    ]
    created_products = []
    for p in products_data:
        product = Product(
            product_code=p["code"], name=p["name"], category=p["category"],
            brand=p["brand"], sku=p["sku"], barcode=f"BAR{p['sku'][-3:]}9001",
            weight_kg=p["weight"], unit_price=p["price"], cost_price=p["price"] * 0.62,
            currency="USD", requires_cold_chain="YES" if "COLD" in p["sku"] else "NO",
            dimensions_cm={"length": 30.0, "width": 25.0, "height": 15.0}
        )
        db.add(product)
        db.flush()
        psm = ProductSupplierMap(product_id=product.id, supplier_id=p["supplier_id"], is_primary="YES", lead_time_days=5, supplier_cost=p["price"] * 0.62)
        db.add(psm)
        created_products.append(product)

    db.flush()
    prod_lidar, prod_iot, prod_cold, prod_axle, prod_rfid = created_products

    # ─── Inventory ───────────────────────────────────────────────────────────
    inv_data = [
        (wh_sf.id, prod_lidar.id, 480, 40, 100, 800, 150),
        (wh_sf.id, prod_iot.id, 325, 25, 80, 600, 120),
        (wh_la.id, prod_cold.id, 142, 12, 50, 400, 100),
        (wh_chi.id, prod_axle.id, 88, 8, 60, 300, 90),
        (wh_nyc.id, prod_rfid.id, 2100, 50, 200, 3000, 350),
        (wh_la.id, prod_lidar.id, 210, 20, 80, 600, 130),
    ]
    for wid, pid, cs, rs, mn, mx, rl in inv_data:
        inv = Inventory(
            warehouse_id=wid, product_id=pid, current_stock=cs,
            reserved_stock=rs, minimum_stock=mn, maximum_stock=mx, reorder_level=rl,
            bin_location="A-01-01", last_counted_at=datetime.now(timezone.utc)
        )
        db.add(inv)

    # ─── Vehicles ────────────────────────────────────────────────────────────
    vehicles_data = [
        {"reg": "CA-LM-T001", "model": "Freightliner Cascadia", "make": "Freightliner", "type": VehicleType.HEAVY_TRUCK, "cap": 20000, "status": VehicleStatus.AVAILABLE},
        {"reg": "CA-LM-R002", "model": "Thermo King T-Series Reefer", "make": "Wabash", "type": VehicleType.REFRIGERATED_TRUCK, "cap": 15000, "status": VehicleStatus.AVAILABLE},
        {"reg": "IL-LM-V003", "model": "Mercedes Sprinter EV", "make": "Mercedes", "type": VehicleType.EV_VAN, "cap": 3500, "status": VehicleStatus.AVAILABLE},
        {"reg": "NY-LM-C004", "model": "Peterbilt 579 Container Carrier", "make": "Peterbilt", "type": VehicleType.CONTAINER_CARRIER, "cap": 25000, "status": VehicleStatus.ON_TRIP},
    ]
    created_vehicles = []
    for v in vehicles_data:
        vehicle = Vehicle(
            registration_number=v["reg"], model=v["model"], make=v["make"],
            year=2024, vehicle_type=v["type"], capacity_kg=v["cap"],
            volume_capacity_cbm=v["cap"] / 800,
            fuel_type="ELECTRIC" if "EV" in v["type"].value else "DIESEL",
            fuel_efficiency_kmpl=14.2 if "EV" in v["type"].value else 6.8,
            current_odometer_km=18420.5, current_latitude=37.7749, current_longitude=-122.4194,
            insurance_policy_number=f"INS-2026-{v['reg'][-4:]}", status=v["status"]
        )
        db.add(vehicle)
        created_vehicles.append(vehicle)

    db.flush()
    veh1, veh2, veh3, veh4 = created_vehicles

    # ─── Drivers ─────────────────────────────────────────────────────────────
    from datetime import date
    d1 = Driver(
        user_id=driver1.id, driver_license_number="CDL-CA-4829183", license_type="CDL-A",
        license_expiry=datetime(2028, 8, 15, tzinfo=timezone.utc),
        years_of_experience=9, assigned_vehicle_id=veh1.id,
        status=DriverStatus.AVAILABLE, current_latitude=37.7749, current_longitude=-122.4194,
        safety_rating=4.92, total_trips_completed=1240, total_km_driven=187450.0
    )
    d2 = Driver(
        user_id=driver2.id, driver_license_number="CDL-CA-7741021", license_type="CDL-A",
        license_expiry=datetime(2027, 5, 20, tzinfo=timezone.utc),
        years_of_experience=6, assigned_vehicle_id=veh4.id,
        status=DriverStatus.ON_DUTY, current_latitude=40.7128, current_longitude=-74.0060,
        safety_rating=4.87, total_trips_completed=820, total_km_driven=124300.0
    )
    db.add_all([d1, d2])
    db.flush()

    # ─── Shipments ───────────────────────────────────────────────────────────
    shipments_data = [
        {
            "tracking": "LM-20261003-SF001",
            "origin_wh": wh_sf.id, "dest_wh": wh_nyc.id,
            "recipient": "Manhattan Distribution Center", "phone": "+1-212-555-9001",
            "addr": "245 West 34th Street, New York, NY 10001",
            "dest_lat": 40.7484, "dest_lng": -73.9967,
            "status": ShipmentStatus.IN_TRANSIT, "priority": ShipmentPriority.EXPRESS,
            "weight": 1850.0, "vehicle_id": veh4.id, "driver_id": d2.id,
            "risk_score": 0.06, "delay_mins": 0
        },
        {
            "tracking": "LM-20261003-LA002",
            "origin_wh": wh_la.id, "dest_wh": wh_chi.id,
            "recipient": "Chicago Tech Depot", "phone": "+1-312-555-4422",
            "addr": "820 N Michigan Avenue, Chicago, IL 60611",
            "dest_lat": 41.8958, "dest_lng": -87.6242,
            "status": ShipmentStatus.DISPATCHED, "priority": ShipmentPriority.STANDARD,
            "weight": 3200.0, "vehicle_id": veh1.id, "driver_id": d1.id,
            "risk_score": 0.04, "delay_mins": 0
        },
        {
            "tracking": "LM-20261003-CHI003",
            "origin_wh": wh_chi.id, "dest_wh": None,
            "recipient": "Riverside Cold Storage Hub", "phone": "+1-951-555-8821",
            "addr": "4920 Jurupa Ave, Riverside, CA 92504",
            "dest_lat": 33.9806, "dest_lng": -117.3755,
            "status": ShipmentStatus.CREATED, "priority": ShipmentPriority.COLD_CHAIN,
            "weight": 720.0, "vehicle_id": None, "driver_id": None,
            "risk_score": 0.03, "delay_mins": 0
        },
    ]
    for s in shipments_data:
        shipment = Shipment(
            tracking_number=s["tracking"],
            origin_warehouse_id=s["origin_wh"], destination_warehouse_id=s["dest_wh"],
            recipient_name=s["recipient"], recipient_phone=s["phone"],
            destination_address=s["addr"], destination_latitude=s["dest_lat"], destination_longitude=s["dest_lng"],
            cargo_description="Mixed Industrial & Electronics Freight",
            total_weight_kg=s["weight"], total_volume_cbm=s["weight"] / 620,
            vehicle_id=s["vehicle_id"], driver_id=s["driver_id"],
            status=s["status"], priority=s["priority"],
            actual_dispatch_time=datetime.now(timezone.utc) if s["status"] not in [ShipmentStatus.CREATED] else None,
            estimated_delivery_time=datetime(2026, 10, 6, 16, 0, tzinfo=timezone.utc),
            ai_risk_score=s["risk_score"], ai_predicted_delay_mins=s["delay_mins"],
            ai_recommendation="Route corridor verified — dispatch optimal.",
            current_latitude=s["dest_lat"] - 0.5, current_longitude=s["dest_lng"] + 0.3,
            last_location_update=datetime.now(timezone.utc)
        )
        db.add(shipment)
        db.flush()

        # Shipment timeline events
        events = [
            ShipmentEvent(shipment_id=shipment.id, status="CREATED", location_name="Origin Warehouse — Manifest Sealed", event_details="Cargo manifested and consignment initiated.", timestamp=datetime(2026, 10, 3, 8, 0, tzinfo=timezone.utc)),
        ]
        if s["status"] in [ShipmentStatus.DISPATCHED, ShipmentStatus.IN_TRANSIT]:
            events.append(ShipmentEvent(shipment_id=shipment.id, status="DISPATCHED", location_name="Origin Dispatch Bay — Gate Exit", event_details="Vehicle loaded and dispatched through security gate.", timestamp=datetime(2026, 10, 3, 9, 30, tzinfo=timezone.utc)))
        if s["status"] == ShipmentStatus.IN_TRANSIT:
            events.append(ShipmentEvent(shipment_id=shipment.id, status="IN_TRANSIT", location_name="I-80 East — Pennsylvania Corridor", latitude=40.4406, longitude=-79.9959, event_details="IoT telematics ping — en route, no exceptions.", timestamp=datetime(2026, 10, 3, 14, 15, tzinfo=timezone.utc)))
        db.add_all(events)

    db.commit()
    logger.info("✅ Enterprise seed data loaded successfully — 6 users, 4 warehouses, 5 products, 4 vehicles, 2 drivers, 3 shipments.")
