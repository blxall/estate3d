from fastapi.testclient import TestClient

from app.main import app


def _auth_headers(client: TestClient, email: str) -> dict[str, str]:
    response = client.post("/auth/register", json={"email": email, "password": "strong-password"})
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_property(client: TestClient, headers: dict[str, str], title: str = "Private объект") -> dict:
    response = client.post("/properties", headers=headers, json={"title": title, "property_type": "apartment"})
    assert response.status_code == 201
    return response.json()


def test_private_property_endpoints_require_bearer_token():
    client = TestClient(app)

    assert client.get("/properties").status_code == 401
    assert client.post("/properties", json={"title": "No auth", "property_type": "apartment"}).status_code == 401
    assert client.get("/properties/prop_missing").status_code == 401
    assert client.post("/properties/prop_missing/media", files={"file": ("scan.glb", b"x", "model/gltf-binary")}).status_code == 401
    assert client.post("/properties/prop_missing/tours", json={"tour_type": "glb_model", "scene_url": "/scene.glb"}).status_code == 401
    assert client.post("/properties/prop_missing/ai-description").status_code == 401
    assert client.get("/properties/prop_missing/analytics").status_code == 401


def test_user_only_lists_own_properties():
    client = TestClient(app)
    owner_headers = _auth_headers(client, "owner-list@example.com")
    other_headers = _auth_headers(client, "other-list@example.com")

    owner_property = _create_property(client, owner_headers, "Owner объект")
    _create_property(client, other_headers, "Other объект")

    response = client.get("/properties", headers=owner_headers)

    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == [owner_property["id"]]


def test_user_cannot_get_or_mutate_another_users_property(tmp_path, monkeypatch):
    monkeypatch.setenv("ESTATE3D_STORAGE_DIR", str(tmp_path))
    client = TestClient(app)
    owner_headers = _auth_headers(client, "owner-private@example.com")
    other_headers = _auth_headers(client, "other-private@example.com")
    owner_property = _create_property(client, owner_headers)

    get_response = client.get(f"/properties/{owner_property['id']}", headers=other_headers)
    upload_response = client.post(
        f"/properties/{owner_property['id']}/media",
        headers=other_headers,
        files={"file": ("scan.glb", b"glb-content", "model/gltf-binary")},
    )
    tour_response = client.post(
        f"/properties/{owner_property['id']}/tours",
        headers=other_headers,
        json={"tour_type": "glb_model", "scene_url": "/storage/scene.glb"},
    )
    ai_response = client.post(f"/properties/{owner_property['id']}/ai-description", headers=other_headers)
    analytics_response = client.get(f"/properties/{owner_property['id']}/analytics", headers=other_headers)

    assert get_response.status_code == 404
    assert upload_response.status_code == 404
    assert tour_response.status_code == 404
    assert ai_response.status_code == 404
    assert analytics_response.status_code == 404


def test_public_tour_endpoint_stays_public_without_bearer_token():
    client = TestClient(app)
    owner_headers = _auth_headers(client, "public-owner@example.com")
    property_ = _create_property(client, owner_headers, "Public объект")
    tour_response = client.post(
        f"/properties/{property_['id']}/tours",
        headers=owner_headers,
        json={"tour_type": "glb_model", "scene_url": "/storage/properties/prop_1/scene.glb"},
    )
    assert tour_response.status_code == 201

    public_response = client.get(tour_response.json()["public_url"])

    assert public_response.status_code == 200
    assert public_response.json()["property"]["id"] == property_["id"]
