from fastapi.testclient import TestClient

from app.main import app
from tests.helpers import auth_headers


def _create_ready_tour(client: TestClient) -> tuple[str, str, dict[str, str]]:
    headers = auth_headers(client, "analytics-owner@example.com")
    created = client.post(
        "/properties",
        headers=headers,
        json={"title": "Аналитический объект", "property_type": "apartment", "city": "Москва"},
    ).json()
    tour = client.post(
        f"/properties/{created['id']}/tours",
        headers=headers,
        json={"tour_type": "glb_model", "scene_url": "/storage/properties/demo/scene.glb"},
    ).json()
    return created["id"], tour["public_url"].split("/")[-1], headers


def test_public_tour_open_records_analytics_view_event():
    client = TestClient(app)
    property_id, slug, headers = _create_ready_tour(client)

    response = client.get(f"/tour/{slug}", headers={"user-agent": "Estate3D Smoke Browser"})

    assert response.status_code == 200
    analytics = client.get(f"/properties/{property_id}/analytics", headers=headers).json()
    assert analytics["property_id"] == property_id
    assert analytics["tour_opened_count"] == 1
    assert analytics["lead_click_count"] == 0
    assert analytics["last_event_at"] is not None


def test_analytics_endpoint_rejects_unknown_property():
    client = TestClient(app)
    headers = auth_headers(client, "analytics-missing@example.com")

    response = client.get("/properties/prop_missing/analytics", headers=headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "Property not found"
