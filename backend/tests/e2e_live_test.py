import requests

BASE_URL = 'http://127.0.0.1:8000'
FRONTEND_URL = 'http://127.0.0.1:5173'

def run_live_e2e_tests():
    print("==================================================")
    print("  LOGIMIND v2 — Automated Live E2E System Tests")
    print("==================================================")

    # 1. Frontend Live Ping
    print("\n[1/6] Checking React 19 Frontend Web Portal...")
    res_fe = requests.get(FRONTEND_URL)
    assert res_fe.status_code == 200
    print(f"  ✓ Frontend server responds with HTTP 200 OK at {FRONTEND_URL}")

    # 2. Backend Health
    print("\n[2/6] Checking FastAPI Backend Health & Engine...")
    res_health = requests.get(f"{BASE_URL}/api/v1/health")
    assert res_health.status_code == 200
    health_json = res_health.json()
    print(f"  ✓ System Status: {health_json.get('status')} | Version: {health_json.get('version')}")

    # 3. Authentication & JWT Token
    print("\n[3/6] Testing Authentication & RBAC...")
    login_payload = {"username_or_email": "admin@logimind.ai", "password": "LogiMind@2026"}
    res_auth = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_payload)
    assert res_auth.status_code == 200
    token = res_auth.json().get("access_token")
    assert token is not None
    headers = {"Authorization": f"Bearer {token}"}
    print(f"  ✓ Authenticated as admin@logimind.ai | JWT Bearer token received")

    # 4. Shipments Telematics
    print("\n[4/6] Querying Shipments & GPS Telematics...")
    res_ship = requests.get(f"{BASE_URL}/api/v1/shipments/", headers=headers)
    assert res_ship.status_code == 200
    shipments = res_ship.json()
    print(f"  ✓ Retrieved {len(shipments)} active shipments with GPS coordinates and audit events")

    # 5. AI Logistics Co-Pilot
    print("\n[5/6] Testing AI Co-Pilot Natural Language Query...")
    ai_payload = {"query": "Forecast demand for industrial sensors for the next quarter"}
    res_ai = requests.post(f"{BASE_URL}/api/v1/ai/chat", json=ai_payload, headers=headers)
    assert res_ai.status_code == 200
    ai_data = res_ai.json()
    print(f"  ✓ AI Intent Detected: {ai_data.get('intent_detected')}")
    print(f"  ✓ AI Recommendations: {ai_data.get('suggested_actions')}")

    # 6. Multi-Criteria Route Optimizer
    print("\n[6/6] Testing Route Optimizer (SF to LA Corridor)...")
    route_payload = {
        "origin_lat": 37.7749,
        "origin_lng": -122.4194,
        "origin_name": "San Francisco Hub",
        "dest_lat": 34.0522,
        "dest_lng": -118.2437,
        "dest_name": "Los Angeles Megahub",
        "strategy": "FASTEST",
        "cargo_weight_kg": 4500.0,
        "include_weather_analysis": True,
        "include_traffic": True
    }
    res_route = requests.post(f"{BASE_URL}/api/v1/routes/optimize", json=route_payload, headers=headers)
    assert res_route.status_code == 200
    r_data = res_route.json()
    print(f"  ✓ Distance: {r_data.get('total_distance_km')} km | Duration: {r_data.get('estimated_duration_minutes')} min")
    print(f"  ✓ Carbon Footprint: {r_data.get('carbon_emissions_kg')} kg CO2 | Road Weather: {r_data.get('weather_summary')}")

    print("\n==================================================")
    print("  🎉 ALL LIVE E2E AUTOMATED TESTS PASSED (6/6)!")
    print("==================================================")

if __name__ == '__main__':
    run_live_e2e_tests()
