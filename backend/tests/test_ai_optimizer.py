from fastapi.testclient import TestClient

def test_ai_chat_query_demand(client: TestClient, admin_token_headers: dict):
    payload = {
        "query": "Can you forecast demand for next quarter?",
        "context": {"department": "logistics"}
    }
    res = client.post("/api/v1/ai/chat", json=payload, headers=admin_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "response" in data
    assert "intent_detected" in data
    assert "confidence" in data

def test_ai_chat_query_shipment(client: TestClient, admin_token_headers: dict):
    payload = {
        "query": "Where is shipment transit tracking?",
    }
    res = client.post("/api/v1/ai/chat", json=payload, headers=admin_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert data["intent_detected"] == "SHIPMENT_STATUS"

def test_ai_forecast_endpoint(client: TestClient, admin_token_headers: dict):
    payload = {
        "product_id": 1,
        "warehouse_id": 1,
        "forecast_days": 30
    }
    res = client.post("/api/v1/ai/forecast", json=payload, headers=admin_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert "predicted_total_demand" in data
    assert "predictions" in data
    assert len(data["predictions"]) > 0

def test_ai_insights_endpoint(client: TestClient, admin_token_headers: dict):
    res = client.get("/api/v1/ai/insights", headers=admin_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_insights" in data
    assert "insights" in data
    assert len(data["insights"]) > 0

def test_ai_route_recommendation(client: TestClient, admin_token_headers: dict):
    payload = {
        "origin": "Tamil Nadu, India",
        "destination": "Kathmandu, Nepal",
        "weight_kg": 2500.0
    }
    res = client.post("/api/v1/ai/route-recommendation", json=payload, headers=admin_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert "distance_km" in data
    assert "recommended_corridor" in data
    assert data["distance_km"] > 0

def test_route_optimizer(client: TestClient, admin_token_headers: dict):
    payload = {
        "origin_lat": 37.7749,
        "origin_lng": -122.4194,
        "origin_name": "San Francisco Hub",
        "dest_lat": 34.0522,
        "dest_lng": -118.2437,
        "dest_name": "Los Angeles Gateway",
        "strategy": "FASTEST",
        "cargo_weight_kg": 5000.0,
        "include_weather_analysis": True,
        "include_traffic": True
    }
    res = client.post("/api/v1/routes/optimize", json=payload, headers=admin_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_distance_km" in data
    assert "estimated_duration_minutes" in data
    assert "waypoints_data" in data
    assert len(data["waypoints_data"]) >= 2
    assert "carbon_emissions_kg" in data

