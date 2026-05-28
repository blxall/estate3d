from fastapi.testclient import TestClient

from app.main import app


def test_healthcheck_returns_ok_and_service_name():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "estate3d-backend"}


def test_create_get_and_list_properties():
    client = TestClient(app)

    create_response = client.post(
        "/properties",
        json={
            "title": "Шоурум ЖК Север",
            "property_type": "apartment",
            "city": "Москва",
            "area_m2": "68.4",
            "rooms_count": 3,
            "price": "22000000",
        },
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"].startswith("prop_")
    assert created["status"] == "draft"
    assert created["is_public"] is False
    assert created["title"] == "Шоурум ЖК Север"

    get_response = client.get(f"/properties/{created['id']}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == created["id"]

    list_response = client.get("/properties")
    assert list_response.status_code == 200
    listed_ids = [item["id"] for item in list_response.json()["items"]]
    assert created["id"] in listed_ids


def test_get_unknown_property_returns_404():
    client = TestClient(app)

    response = client.get("/properties/prop_missing")

    assert response.status_code == 404
    assert response.json()["detail"] == "Property not found"
