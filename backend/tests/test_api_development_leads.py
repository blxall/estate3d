from fastapi.testclient import TestClient

from app.main import app


def test_demo_development_lead_submission_persists_viewer_context():
    client = TestClient(app)

    response = client.post(
        "/developments/demo-premium/leads",
        json={
            "building_id": "building_a",
            "floor_id": "floor_8",
            "unit_id": "unit_8_1",
            "viewer_state": "window_view",
            "contact_name": "Анна Покупатель",
            "contact_phone": "+79990000000",
            "contact_email": "anna@example.com",
            "message": "Хочу обсудить квартиру 81 после просмотра вида из окна",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["id"].startswith("lead_")
    assert body["development_id"] == "dev_demo_premium"
    assert body["development_name"] == "Estate3D Skyline"
    assert body["building_id"] == "building_a"
    assert body["floor_id"] == "floor_8"
    assert body["unit_id"] == "unit_8_1"
    assert body["unit_number"] == "81"
    assert body["viewer_state"] == "window_view"
    assert body["contact_name"] == "Анна Покупатель"
    assert body["contact_phone"] == "+79990000000"
    assert body["contact_email"] == "anna@example.com"
    assert body["status"] == "new"
    assert "created_at" in body


def test_demo_development_lead_submission_rejects_unknown_unit():
    client = TestClient(app)

    response = client.post(
        "/developments/demo-premium/leads",
        json={
            "building_id": "building_a",
            "floor_id": "floor_8",
            "unit_id": "unit_missing",
            "viewer_state": "unit_top_down",
            "contact_phone": "+79990000000",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Unit not found"
