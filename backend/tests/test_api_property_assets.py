from fastapi.testclient import TestClient

from app.main import app
from tests.helpers import auth_headers


def test_property_media_endpoint_lists_uploaded_files():
    client = TestClient(app)
    headers = auth_headers(client, "assets-media@example.com")
    created = client.post(
        "/properties",
        headers=headers,
        json={"title": "Media list объект", "property_type": "apartment"},
    ).json()

    upload = client.post(
        f"/properties/{created['id']}/media",
        headers=headers,
        files={"file": ("scene.glb", b"glb", "model/gltf-binary")},
    )
    assert upload.status_code == 201

    response = client.get(f"/properties/{created['id']}/media", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["items"]) == 1
    assert payload["items"][0]["original_filename"] == "scene.glb"
    assert payload["items"][0]["storage_path"].endswith("scene.glb")


def test_property_tours_endpoint_lists_created_tours():
    client = TestClient(app)
    headers = auth_headers(client, "assets-tours@example.com")
    created = client.post(
        "/properties",
        headers=headers,
        json={"title": "Tours list объект", "property_type": "apartment"},
    ).json()
    tour = client.post(
        f"/properties/{created['id']}/tours",
        headers=headers,
        json={"tour_type": "glb_model", "scene_url": "/storage/properties/demo/scene.glb"},
    )
    assert tour.status_code == 201

    response = client.get(f"/properties/{created['id']}/tours", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["items"]) == 1
    assert payload["items"][0]["scene_url"] == "/storage/properties/demo/scene.glb"
    assert payload["items"][0]["public_url"].startswith("/tour/")


def test_property_child_endpoints_return_404_for_missing_property():
    client = TestClient(app)
    headers = auth_headers(client, "assets-missing@example.com")

    assert client.get("/properties/missing/media", headers=headers).status_code == 404
    assert client.get("/properties/missing/tours", headers=headers).status_code == 404
