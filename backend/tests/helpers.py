from fastapi.testclient import TestClient


def auth_headers(client: TestClient, email: str = "agent@example.com") -> dict[str, str]:
    response = client.post("/auth/register", json={"email": email, "password": "strong-password"})
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
