from fastapi.testclient import TestClient

def test_user_registration(client: TestClient):
    payload = {
        "email": "newuser@logimind.ai",
        "username": "newuser2026",
        "password": "SecurePassword123!",
        "first_name": "Marcus",
        "last_name": "Vance",
        "role": "MANAGER"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@logimind.ai"
    assert data["username"] == "newuser2026"
    assert data["role"] == "MANAGER"

def test_user_login(client: TestClient):
    # Register first
    payload = {
        "email": "loginuser@logimind.ai",
        "username": "loginuser",
        "password": "TestPassword123!",
        "first_name": "Login",
        "last_name": "User",
        "role": "EMPLOYEE"
    }
    reg_res = client.post("/api/v1/auth/register", json=payload)
    assert reg_res.status_code == 201

    # Attempt login with email
    login_payload = {
        "username_or_email": "loginuser@logimind.ai",
        "password": "TestPassword123!"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "bearer"

def test_login_invalid_password(client: TestClient):
    login_payload = {
        "username_or_email": "loginuser@logimind.ai",
        "password": "WrongPassword999!"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code in [400, 401]

def test_get_current_user_profile(client: TestClient, admin_token_headers: dict):
    response = client.get("/api/v1/auth/me", headers=admin_token_headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == "admin_test@logimind.ai"
    assert user_data["role"].upper() == "ADMIN"

def test_email_otp_flow(client: TestClient):
    # 1. Send OTP
    send_res = client.post("/api/v1/auth/send-email-otp", json={
        "email": "verify_me@logimind.ai",
        "purpose": "EMAIL_VERIFY"
    })
    assert send_res.status_code == 200
    data = send_res.json()
    assert data["success"] is True
    otp_code = data.get("dev_otp") or data.get("otp_code")
    assert otp_code is not None
    assert len(otp_code) == 6

    # 2. Verify OTP with wrong code
    bad_res = client.post("/api/v1/auth/verify-email-otp", json={
        "email": "verify_me@logimind.ai",
        "otp_code": "000000",
        "purpose": "EMAIL_VERIFY"
    })
    assert bad_res.status_code in [400, 422]

    # 3. Verify OTP with correct code
    good_res = client.post("/api/v1/auth/verify-email-otp", json={
        "email": "verify_me@logimind.ai",
        "otp_code": otp_code,
        "purpose": "EMAIL_VERIFY"
    })
    assert good_res.status_code == 200
    assert good_res.json()["success"] is True

def test_phone_otp_flow(client: TestClient):
    # Register a user first to have a valid user_id
    payload = {
        "email": "phoneuser@logimind.ai",
        "username": "phoneuser",
        "password": "Password123!",
        "first_name": "Phone",
        "last_name": "User",
        "role": "EMPLOYEE"
    }
    reg_res = client.post("/api/v1/auth/register", json=payload)
    assert reg_res.status_code == 201
    user_id = reg_res.json()["id"]

    # 1. Send Phone OTP
    send_res = client.post("/api/v1/auth/send-phone-otp", json={
        "phone": "+919876543210",
        "purpose": "PHONE_VERIFY"
    })
    assert send_res.status_code == 200
    otp_code = send_res.json().get("dev_otp") or send_res.json().get("otp_code")
    assert otp_code is not None

    # 2. Verify Phone OTP
    verify_res = client.post("/api/v1/auth/verify-phone-otp", json={
        "phone": "+919876543210",
        "otp_code": otp_code,
        "user_id": user_id
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["success"] is True

def test_forgot_and_reset_password_flow(client: TestClient):
    # Register user
    payload = {
        "email": "resetuser@logimind.ai",
        "username": "resetuser",
        "password": "OldPassword123!",
        "first_name": "Reset",
        "last_name": "Tester",
        "role": "EMPLOYEE"
    }
    client.post("/api/v1/auth/register", json=payload)

    # 1. Initiate forgot password
    forgot_res = client.post("/api/v1/auth/forgot-password", json={"email": "resetuser@logimind.ai"})
    assert forgot_res.status_code == 200
    otp_code = forgot_res.json().get("dev_otp")
    assert otp_code is not None

    # 2. Reset password
    reset_res = client.post("/api/v1/auth/reset-password", json={
        "email": "resetuser@logimind.ai",
        "otp_code": otp_code,
        "new_password": "NewSecurePassword456!"
    })
    assert reset_res.status_code == 200

    # 3. Verify login works with new password
    login_res = client.post("/api/v1/auth/login", json={
        "username_or_email": "resetuser@logimind.ai",
        "password": "NewSecurePassword456!"
    })
    assert login_res.status_code == 200

