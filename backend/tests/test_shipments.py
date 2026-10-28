from fastapi.testclient import TestClient

def test_shipment_lifecycle(client: TestClient, admin_token_headers: dict):
    # 1. Create warehouse first
    wh_payload = {
        "warehouse_code": "WH-SHIP-01",
        "name": "Shipment Test Hub",
        "address": "500 Harbor Way",
        "city": "Seattle",
        "country": "USA",
        "latitude": 47.6062,
        "longitude": -122.3321,
        "total_capacity": 10000.0,
        "status": "ACTIVE"
    }
    wh_res = client.post("/api/v1/warehouses/", json=wh_payload, headers=admin_token_headers)
    assert wh_res.status_code == 201
    wh_id = wh_res.json()["id"]

    # 2. Create shipment
    ship_payload = {
        "origin_warehouse_id": wh_id,
        "recipient_name": "Acme Logistics",
        "recipient_phone": "+1-206-555-0100",
        "destination_address": "700 Pike St, Seattle, WA 98101",
        "destination_latitude": 47.6101,
        "destination_longitude": -122.3331,
        "cargo_description": "Electronics Pallet",
        "total_weight_kg": 450.0,
        "total_volume_cbm": 3.2,
        "priority": "EXPRESS"
    }
    create_res = client.post("/api/v1/shipments/", json=ship_payload, headers=admin_token_headers)
    assert create_res.status_code == 201
    shipment_data = create_res.json()
    tracking_number = shipment_data["tracking_number"]
    ship_id = shipment_data["id"]
    assert shipment_data["status"] == "CREATED"
    assert shipment_data["priority"] == "EXPRESS"

    # 3. Track shipment publicly
    track_res = client.get(f"/api/v1/shipments/track/{tracking_number}")
    assert track_res.status_code == 200
    assert track_res.json()["tracking_number"] == tracking_number

    # 4. Update shipment status to DISPATCHED
    update_res = client.put(
        f"/api/v1/shipments/{ship_id}",
        json={"status": "DISPATCHED"},
        headers=admin_token_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "DISPATCHED"

    # 5. Add shipment event
    event_payload = {
        "status": "IN_TRANSIT",
        "location_name": "Interstate 5 North Checkpoint",
        "latitude": 47.5000,
        "longitude": -122.3000,
        "event_details": "Vehicle passed automated RFID tollway"
    }
    event_res = client.post(
        f"/api/v1/shipments/{ship_id}/events",
        json=event_payload,
        headers=admin_token_headers
    )
    assert event_res.status_code == 201
    assert event_res.json()["location_name"] == "Interstate 5 North Checkpoint"
