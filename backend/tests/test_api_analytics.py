from fastapi.testclient import TestClient

from app.main import app


def _create_ready_tour(client: TestClient) -> tuple[str, str]:
    created = client.post(
        "/properties",
        json={"title": "Аналитический объект", "property_type": "apartment", "city": "Москва"},
    ).json()
    tour = client.post(
        f"/properties/{created['id']}/tours",
        json={"tour_type": "glb_model", "scene_url": "/storage/properties/demo/scene.glb"},
    ).json()
    return created["id"], tour["public_url"].split("/")[-1]


def test_public_tour_open_records_analytics_view_event():
    client = TestClient(app)
    property_id, slug = _create_ready_tour(client)

    response = client.get(f"/tour/{slug}", headers={"user-agent": "Estate3D Smoke Browser"})

    assert response.status_code == 200
    analytics = client.get(f"/properties/{property_id}/analytics").json()
    assert analytics["property_id"] == property_id
    assert analytics["tour_opened_count"] == 1
    assert analytics["lead_click_count"] == 0
    assert analytics["last_event_at"] is not None


def test_analytics_endpoint_rejects_unknown_property():
    client = TestClient(app)

    response = client.get("/properties/prop_missing/analytics")

    assert response.status_code == 404
    assert response.json()["detail"] == "Property not found"
