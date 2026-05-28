from fastapi.testclient import TestClient

from app.main import app


def test_generate_ai_description_populates_short_and_sales_copy():
    client = TestClient(app)
    created = client.post(
        "/properties",
        json={
            "title": "Светлая квартира у парка",
            "property_type": "apartment",
            "city": "Москва",
            "district": "Сокол",
            "area_m2": "54.5",
            "rooms_count": 2,
            "price": "15000000",
            "description_raw": "Окна во двор, рядом метро и парк.",
        },
    ).json()

    response = client.post(f"/properties/{created['id']}/ai-description")

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == created["id"]
    assert payload["description_ai_short"] == "2-комн. apartment, 54.5 м², Москва, Сокол. Окна во двор, рядом метро и парк."
    assert "Светлая квартира у парка" in payload["description_ai_sales"]
    assert "15 000 000 RUB" in payload["description_ai_sales"]
    assert "3D-тур" in payload["description_ai_sales"]

    fetched = client.get(f"/properties/{created['id']}").json()
    assert fetched["description_ai_short"] == payload["description_ai_short"]
    assert fetched["description_ai_sales"] == payload["description_ai_sales"]


def test_generate_ai_description_for_unknown_property_returns_404():
    client = TestClient(app)

    response = client.post("/properties/prop_missing/ai-description")

    assert response.status_code == 404
    assert response.json()["detail"] == "Property not found"
