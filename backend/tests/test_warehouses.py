from fastapi.testclient import TestClient

def test_create_and_list_warehouse(client: TestClient, admin_token_headers: dict):
    payload = {
        "warehouse_code": "WH-TEST-001",
        "name": "Test Regional Hub",
        "address": "100 Logistics Pkwy",
        "city": "Austin",
        "state": "TX",
        "country": "USA",
        "postal_code": "78701",
        "latitude": 30.2672,
        "longitude": -97.7431,
        "total_capacity": 15000.0,
        "contact_phone": "+1-512-555-0199",
        "contact_email": "austin.hub@logimind.ai",
        "status": "ACTIVE"
    }

    create_res = client.post("/api/v1/warehouses/", json=payload, headers=admin_token_headers)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["warehouse_code"] == "WH-TEST-001"
    assert created_data["name"] == "Test Regional Hub"
    wh_id = created_data["id"]

    # Retrieve by ID
    get_res = client.get(f"/api/v1/warehouses/{wh_id}", headers=admin_token_headers)
    assert get_res.status_code == 200
    assert get_res.json()["city"] == "Austin"

    # List warehouses
    list_res = client.get("/api/v1/warehouses/", headers=admin_token_headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 1
    assert any(w["warehouse_code"] == "WH-TEST-001" for w in items)
