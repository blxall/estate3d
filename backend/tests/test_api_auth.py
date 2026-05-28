from fastapi.testclient import TestClient

from app.main import app


def test_register_login_and_me_flow():
    client = TestClient(app)

    register_response = client.post(
        "/auth/register",
        json={
            "email": "agent@example.com",
            "password": "strong-password",
            "full_name": "Estate Agent",
            "company_name": "Demo Realty",
        },
    )

    assert register_response.status_code == 201
    registered = register_response.json()
    assert registered["user"]["email"] == "agent@example.com"
    assert registered["user"]["full_name"] == "Estate Agent"
    assert registered["user"]["company_name"] == "Demo Realty"
    assert "password_hash" not in registered["user"]
    assert registered["access_token"]
    assert registered["token_type"] == "bearer"

    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {registered['access_token']}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "agent@example.com"

    login_response = client.post(
        "/auth/login",
        json={"email": "agent@example.com", "password": "strong-password"},
    )

    assert login_response.status_code == 200
    logged_in = login_response.json()
    assert logged_in["user"]["email"] == "agent@example.com"
    assert logged_in["access_token"]


def test_register_rejects_duplicate_email():
    client = TestClient(app)
    payload = {"email": "duplicate@example.com", "password": "strong-password"}

    first = client.post("/auth/register", json=payload)
    second = client.post("/auth/register", json=payload)

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.json()["detail"] == "Email already registered"


def test_login_rejects_wrong_password():
    client = TestClient(app)
    client.post("/auth/register", json={"email": "login@example.com", "password": "right-password"})

    response = client.post("/auth/login", json={"email": "login@example.com", "password": "wrong-password"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_me_rejects_missing_or_unknown_token():
    client = TestClient(app)

    missing = client.get("/auth/me")
    unknown = client.get("/auth/me", headers={"Authorization": "Bearer missing-token"})

    assert missing.status_code == 401
    assert missing.json()["detail"] == "Missing bearer token"
    assert unknown.status_code == 401
    assert unknown.json()["detail"] == "Invalid bearer token"
