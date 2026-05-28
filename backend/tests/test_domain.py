from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.domain import (
    AnalyticsEvent,
    MediaFileType,
    ProcessingJob,
    ProcessingJobStatus,
    Property,
    PropertyMedia,
    PropertyStatus,
    PropertyType,
    Tour,
    TourType,
    User,
)


def test_property_defaults_to_draft_private_and_has_public_slug():
    user = User(email="agent@example.com", password_hash="hashed", full_name="Agent")

    prop = Property(
        owner_id=user.id,
        title="Квартира на Тверской",
        property_type=PropertyType.APARTMENT,
        city="Москва",
        area_m2=Decimal("54.5"),
        rooms_count=2,
        price=Decimal("15000000"),
    )

    assert prop.status is PropertyStatus.DRAFT
    assert prop.is_public is False
    assert len(prop.public_slug) >= 16
    assert prop.currency == "RUB"
    assert prop.quality_score is None


def test_property_rejects_negative_area_rooms_and_price():
    with pytest.raises(ValidationError):
        Property(title="bad", property_type=PropertyType.APARTMENT, area_m2=Decimal("-1"))

    with pytest.raises(ValidationError):
        Property(title="bad", property_type=PropertyType.APARTMENT, rooms_count=-1)

    with pytest.raises(ValidationError):
        Property(title="bad", property_type=PropertyType.APARTMENT, price=Decimal("-1"))


def test_media_detects_file_type_from_mime_and_extension():
    model = PropertyMedia.from_upload(
        property_id="prop_1",
        original_filename="scan.glb",
        storage_path="properties/prop_1/scan.glb",
        mime_type="model/gltf-binary",
        size_bytes=128,
    )
    video = PropertyMedia.from_upload(
        property_id="prop_1",
        original_filename="walkthrough.MOV",
        storage_path="properties/prop_1/walkthrough.mov",
        mime_type="video/quicktime",
        size_bytes=1024,
    )
    floorplan = PropertyMedia.from_upload(
        property_id="prop_1",
        original_filename="plan.pdf",
        storage_path="properties/prop_1/plan.pdf",
        mime_type="application/pdf",
        size_bytes=256,
    )

    assert model.file_type is MediaFileType.MODEL
    assert video.file_type is MediaFileType.VIDEO
    assert floorplan.file_type is MediaFileType.FLOORPLAN


def test_processing_job_and_tour_link_model_core_fields():
    job = ProcessingJob(property_id="prop_1", job_type="glb_import", input_media_ids=["media_1"])
    tour = Tour(
        property_id="prop_1",
        tour_type=TourType.GLB_MODEL,
        scene_url="/storage/properties/prop_1/scene.glb",
        preview_url="/storage/properties/prop_1/preview.jpg",
        public_url="/tour/abc123",
    )
    event = AnalyticsEvent(
        property_id="prop_1",
        tour_id=tour.id,
        event_type="tour_opened",
        visitor_id="visitor_1",
        ip_hash="hash",
    )

    assert job.status is ProcessingJobStatus.QUEUED
    assert tour.viewer_config_json["tour_type"] == "glb_model"
    assert event.metadata_json == {}
