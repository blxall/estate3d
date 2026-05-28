from fastapi.testclient import TestClient

from app.domain import ProcessingJobStatus, PropertyStatus
from app.main import app
from app.repository import job_repository, property_repository


def test_create_processing_job_marks_property_processing():
    client = TestClient(app)
    created = client.post(
        "/properties",
        json={"title": "Объект для обработки", "property_type": "apartment"},
    ).json()

    response = client.post(
        f"/properties/{created['id']}/jobs",
        json={"job_type": "glb_import", "input_media_ids": ["media_1"]},
    )

    assert response.status_code == 201
    job = response.json()
    assert job["property_id"] == created["id"]
    assert job["job_type"] == "glb_import"
    assert job["status"] == "queued"

    property_after_job = property_repository.get(created["id"])
    assert property_after_job is not None
    assert property_after_job.status is PropertyStatus.PROCESSING


def test_complete_processing_job_ready_marks_property_ready():
    client = TestClient(app)
    created = client.post(
        "/properties",
        json={"title": "Готовый объект", "property_type": "apartment"},
    ).json()
    job = client.post(
        f"/properties/{created['id']}/jobs",
        json={"job_type": "glb_import", "input_media_ids": []},
    ).json()

    response = client.patch(
        f"/jobs/{job['id']}",
        json={"status": "ready", "output_json": {"scene_url": "/storage/scene.glb"}},
    )

    assert response.status_code == 200
    assert response.json()["status"] == ProcessingJobStatus.READY.value
    assert response.json()["finished_at"] is not None
    assert property_repository.get(created["id"]).status is PropertyStatus.READY


def test_complete_processing_job_failed_marks_property_failed():
    client = TestClient(app)
    created = client.post(
        "/properties",
        json={"title": "Ошибка обработки", "property_type": "apartment"},
    ).json()
    job = client.post(
        f"/properties/{created['id']}/jobs",
        json={"job_type": "video_reconstruction", "input_media_ids": []},
    ).json()

    response = client.patch(
        f"/jobs/{job['id']}",
        json={"status": "failed", "error_message": "not enough coverage"},
    )

    assert response.status_code == 200
    assert response.json()["error_message"] == "not enough coverage"
    assert property_repository.get(created["id"]).status is PropertyStatus.FAILED


def test_update_unknown_job_returns_404():
    client = TestClient(app)

    response = client.patch("/jobs/job_missing", json={"status": "ready"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Processing job not found"
