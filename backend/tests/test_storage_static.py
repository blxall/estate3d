from fastapi.testclient import TestClient

from app.main import app


def test_storage_static_files_are_served_from_configured_storage_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("ESTATE3D_STORAGE_DIR", str(tmp_path))
    scene = tmp_path / "properties" / "prop_1" / "scene.glb"
    scene.parent.mkdir(parents=True)
    scene.write_bytes(b"glb")

    client = TestClient(app)
    response = client.get("/storage/properties/prop_1/scene.glb")

    assert response.status_code == 200
    assert response.content == b"glb"
