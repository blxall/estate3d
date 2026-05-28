from fastapi.testclient import TestClient

from app.main import app


def test_create_tour_for_property_exposes_public_slug_endpoint():
    client = TestClient(app)
    created = client.post(
        "/properties",
        json={"title": "Публичный тур", "property_type": "apartment", "price": "12000000"},
    ).json()

    response = client.post(
        f"/properties/{created['id']}/tours",
        json={
            "tour_type": "glb_model",
            "scene_url": "/storage/properties/prop_1/scene.glb",
            "preview_url": "/storage/properties/prop_1/preview.jpg",
        },
    )

    assert response.status_code == 201
    tour = response.json()
    assert tour["property_id"] == created["id"]
    assert tour["public_url"].startswith("/tour/")

    public_response = client.get(tour["public_url"])
    assert public_response.status_code == 200
    public_payload = public_response.json()
    assert public_payload["property"]["title"] == "Публичный тур"
    assert public_payload["property"]["is_public"] is True
    assert public_payload["tour"]["scene_url"] == "/storage/properties/prop_1/scene.glb"
    assert public_payload["viewer_config"]["tour_type"] == "glb_model"


def test_unknown_public_tour_slug_returns_404():
    client = TestClient(app)

    response = client.get("/tour/missing_slug")

    assert response.status_code == 404
    assert response.json()["detail"] == "Tour not found"
