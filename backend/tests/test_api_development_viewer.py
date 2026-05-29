from fastapi.testclient import TestClient

from app.main import app


def test_demo_development_viewer_returns_spatial_hierarchy():
    client = TestClient(app)

    response = client.get("/developments/demo-premium/viewer")

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == "dev_demo_premium"
    assert payload["name"] == "Estate3D Skyline"
    assert payload["hero"]["tagline"] == "ЖК → корпус → этаж → квартира → окно"
    assert len(payload["buildings"]) == 1

    building = payload["buildings"][0]
    assert building["id"] == "building_a"
    assert building["floors_count"] >= 12
    assert len(building["floors"]) >= 12

    eighth_floor = next(floor for floor in building["floors"] if floor["level"] == 8)
    assert eighth_floor["label"] == "8 этаж"
    assert len(eighth_floor["units"]) >= 2

    unit = eighth_floor["units"][0]
    assert unit["rooms"][0]["name"]
    assert unit["viewpoints"][0]["mode"] == "walk"
    assert unit["window_views"][0]["image_url"].startswith("/demo/window-views/")


def test_demo_development_viewer_is_public_without_bearer_token():
    client = TestClient(app)

    response = client.get("/developments/demo-premium/viewer")

    assert response.status_code == 200
    assert response.json()["viewer_config"]["default_state"] == "development_overview"
