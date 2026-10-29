import pytest
from datetime import datetime, timezone, timedelta

def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_auth_login_and_roles(client):
    # Customer login
    res = client.post("/api/auth/login", json={
        "email": "customer@smartparking.com",
        "password": "Customer@12345"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "customer"
    customer_token = data["access_token"]

    # Me endpoint
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {customer_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "customer@smartparking.com"

    # Admin login
    admin_res = client.post("/api/auth/login", json={
        "email": "admin@smartparking.com",
        "password": "Admin@12345"
    })
    assert admin_res.status_code == 200
    assert admin_res.json()["user"]["role"] == "admin"

def test_map_free_parking_search(client):
    # Parking search without maps
    res = client.get("/api/parking/search?vehicle_type=car")
    assert res.status_code == 200
    facilities = res.json()
    assert len(facilities) > 0
    first = facilities[0]
    assert "name" in first
    assert "available_slots" in first
    assert "estimated_total_price" in first
    assert "base_hourly_rate" in first

def test_slot_grid_retrieval_and_filtering(client):
    # Retrieve slots for facility 1
    res = client.get("/api/parking-lots/1/slots")
    assert res.status_code == 200
    slots = res.json()
    assert len(slots) > 0
    # verify slot properties
    assert "slot_number" in slots[0]
    assert "status" in slots[0]
    assert "slot_category" in slots[0]

def test_intelligent_allocation_and_booking(client):
    # Login as customer
    login_res = client.post("/api/auth/login", json={
        "email": "customer@smartparking.com",
        "password": "Customer@12345"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch vehicles
    veh_res = client.get("/api/vehicles", headers=headers)
    assert veh_res.status_code == 200
    vehicles = veh_res.json()
    assert len(vehicles) > 0
    vehicle_id = vehicles[0]["id"]

    # Preview reservation
    now = datetime.now(timezone.utc)
    start_time = (now + timedelta(hours=5)).isoformat()
    end_time = (now + timedelta(hours=8)).isoformat()

    preview_res = client.post("/api/reservations/preview", json={
        "lot_id": 1,
        "vehicle_id": vehicle_id,
        "start_time": start_time,
        "end_time": end_time
    }, headers=headers)
    assert preview_res.status_code == 200
    preview_data = preview_res.json()
    assert preview_data["is_available"] == True
    assert preview_data["estimated_amount"] > 0

    # Book reservation
    book_res = client.post("/api/reservations", json={
        "lot_id": 1,
        "vehicle_id": vehicle_id,
        "start_time": start_time,
        "end_time": end_time,
        "payment_method": "simulated_upi"
    }, headers=headers)
    assert book_res.status_code == 201
    booking = book_res.json()
    assert "booking_reference" in booking
    assert booking["status"] == "confirmed"
    res_id = booking["id"]
    assigned_slot_id = booking["slot_id"]

    # Attempt double booking the exact same slot during overlapping time
    conflict_res = client.post("/api/reservations", json={
        "lot_id": 1,
        "slot_id": assigned_slot_id,
        "vehicle_id": vehicle_id,
        "start_time": start_time,
        "end_time": end_time
    }, headers=headers)
    assert conflict_res.status_code == 409  # Conflict detected!

    # Cancel reservation
    cancel_res = client.post(f"/api/reservations/{res_id}/cancel", json={
        "cancellation_reason": "Change of plans"
    }, headers=headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

def test_entry_and_exit_operations(client):
    # Login as operator
    op_login = client.post("/api/auth/login", json={
        "email": "operator@smartparking.com",
        "password": "Operator@12345"
    })
    token = op_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Check-in using seed confirmed booking
    checkin_res = client.post("/api/sessions/check-in", json={
        "booking_reference": "PK-2610-88A102"
    }, headers=headers)
    assert checkin_res.status_code == 200
    session_data = checkin_res.json()
    assert session_data["status"] == "active"
    session_id = session_data["id"]

    # Check-out
    checkout_res = client.post("/api/sessions/check-out", json={
        "session_id": session_id,
        "payment_method": "simulated_upi"
    }, headers=headers)
    assert checkout_res.status_code == 200
    assert checkout_res.json()["status"] == "completed"
    assert checkout_res.json()["calculated_charge"] >= 0

def test_dashboard_analytics_and_csv_export(client):
    login_res = client.post("/api/auth/login", json={
        "email": "admin@smartparking.com",
        "password": "Admin@12345"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Analytics dashboard
    dash_res = client.get("/api/analytics/dashboard", headers=headers)
    assert dash_res.status_code == 200
    data = dash_res.json()
    assert "kpi" in data
    assert "hourly_occupancy" in data
    assert "daily_reservations" in data
    assert "occupancy_rate" in data["kpi"]

    # CSV Export
    csv_res = client.get("/api/analytics/export-csv?report_type=reservations", headers=headers)
    assert csv_res.status_code == 200
    assert "Booking Reference" in csv_res.text
