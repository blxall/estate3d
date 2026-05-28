from fastapi.testclient import TestClient

from app.domain import PropertyStatus
from app.main import app
from app.repository import property_repository


def test_upload_glb_file_creates_model_media_and_marks_property_uploaded(tmp_path, monkeypatch):
    monkeypatch.setenv("ESTATE3D_STORAGE_DIR", str(tmp_path))
    client = TestClient(app)
    created = client.post(
        "/properties",
        json={"title": "LiDAR объект", "property_type": "apartment"},
    ).json()

    response = client.post(
        f"/properties/{created['id']}/media",
        files={"file": ("scan.glb", b"glb-content", "model/gltf-binary")},
    )

    assert response.status_code == 201
    media = response.json()
    assert media["property_id"] == created["id"]
    assert media["file_type"] == "model"
    assert media["original_filename"] == "scan.glb"
    assert media["size_bytes"] == len(b"glb-content")

    stored = tmp_path / media["storage_path"]
    assert stored.read_bytes() == b"glb-content"

    property_after_upload = property_repository.get(created["id"])
    assert property_after_upload is not None
    assert property_after_upload.status is PropertyStatus.UPLOADED


def test_upload_media_to_unknown_property_returns_404(tmp_path, monkeypatch):
    monkeypatch.setenv("ESTATE3D_STORAGE_DIR", str(tmp_path))
    client = TestClient(app)

    response = client.post(
        "/properties/prop_missing/media",
        files={"file": ("scan.glb", b"glb-content", "model/gltf-binary")},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Property not found"
