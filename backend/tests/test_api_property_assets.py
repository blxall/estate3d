from fastapi.testclient import TestClient

from app.main import app


def test_property_media_endpoint_lists_uploaded_files():
    client = TestClient(app)
    created = client.post(
        "/properties",
        json={"title": "Media list объект", "property_type": "apartment"},
    ).json()

    upload = client.post(
        f"/properties/{created['id']}/media",
        files={"file": ("scene.glb", b"glb", "model/gltf-binary")},
    )
    assert upload.status_code == 201

    response = client.get(f"/properties/{created['id']}/media")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["items"]) == 1
    assert payload["items"][0]["original_filename"] == "scene.glb"
    assert payload["items"][0]["storage_path"].endswith("scene.glb")


def test_property_tours_endpoint_lists_created_tours():
    client = TestClient(app)
    created = client.post(
        "/properties",
        json={"title": "Tours list объект", "property_type": "apartment"},
    ).json()
    tour = client.post(
        f"/properties/{created['id']}/tours",
        json={"tour_type": "glb_model", "scene_url": "/storage/properties/demo/scene.glb"},
    )
    assert tour.status_code == 201

    response = client.get(f"/properties/{created['id']}/tours")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["items"]) == 1
    assert payload["items"][0]["scene_url"] == "/storage/properties/demo/scene.glb"
    assert payload["items"][0]["public_url"].startswith("/tour/")


def test_property_child_endpoints_return_404_for_missing_property():
    client = TestClient(app)

    assert client.get("/properties/missing/media").status_code == 404
    assert client.get("/properties/missing/tours").status_code == 404
