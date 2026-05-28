from app.domain import AnalyticsEvent, ProcessingJob, Property, PropertyMedia, PropertyStatus, Tour, User
from app.repository import (
    AnalyticsRepository,
    JobRepository,
    MediaRepository,
    PropertyRepository,
    SessionRepository,
    SQLiteStore,
    TourRepository,
    UserRepository,
)


def test_sqlite_store_persists_core_records_across_repository_instances(tmp_path):
    db_path = tmp_path / "estate3d.sqlite3"

    users = UserRepository(SQLiteStore(db_path))
    properties = PropertyRepository(SQLiteStore(db_path))
    media = MediaRepository(SQLiteStore(db_path))
    jobs = JobRepository(SQLiteStore(db_path))
    tours = TourRepository(SQLiteStore(db_path))
    analytics = AnalyticsRepository(SQLiteStore(db_path))
    sessions = SessionRepository(SQLiteStore(db_path))

    user = users.create(User(email="agent@example.com", password_hash="hash"))
    property_ = properties.create(Property(title="Persistent object", property_type="apartment", owner_id=user.id))
    media_item = media.create(
        PropertyMedia.from_upload(
            property_id=property_.id,
            original_filename="scene.glb",
            storage_path="properties/scene.glb",
            mime_type="model/gltf-binary",
            size_bytes=3,
        )
    )
    job = jobs.create(ProcessingJob(property_id=property_.id, job_type="glb_processing", input_media_ids=[media_item.id]))
    tour = tours.create(Tour(property_id=property_.id, tour_type="glb_model", scene_url="/storage/scene.glb", public_url=f"/tour/{property_.public_slug}"))
    event = analytics.create(AnalyticsEvent(property_id=property_.id, tour_id=tour.id, event_type="tour_opened"))
    sessions.create("token-1", user.id)

    reopened_users = UserRepository(SQLiteStore(db_path))
    reopened_properties = PropertyRepository(SQLiteStore(db_path))
    reopened_media = MediaRepository(SQLiteStore(db_path))
    reopened_jobs = JobRepository(SQLiteStore(db_path))
    reopened_tours = TourRepository(SQLiteStore(db_path))
    reopened_analytics = AnalyticsRepository(SQLiteStore(db_path))
    reopened_sessions = SessionRepository(SQLiteStore(db_path))

    assert reopened_users.get(user.id) == user
    assert reopened_users.get_by_email("AGENT@example.com") == user
    assert reopened_properties.get(property_.id) == property_
    assert [item.id for item in reopened_properties.list()] == [property_.id]
    assert reopened_media.list_for_property(property_.id) == [media_item]
    assert reopened_jobs.get(job.id) == job
    assert reopened_tours.get_by_public_slug(property_.public_slug) == tour
    assert reopened_tours.list_for_property(property_.id) == [tour]
    assert reopened_analytics.list_for_property(property_.id) == [event]
    assert reopened_sessions.get_user_id("token-1") == user.id


def test_sqlite_repository_updates_replace_existing_payload(tmp_path):
    repository = PropertyRepository(SQLiteStore(tmp_path / "estate3d.sqlite3"))
    property_ = repository.create(Property(title="Draft", property_type="apartment"))

    property_.status = PropertyStatus.READY
    property_.description_ai_short = "Ready description"
    repository.update(property_)

    reopened = PropertyRepository(SQLiteStore(tmp_path / "estate3d.sqlite3"))

    assert reopened.get(property_.id).status == "ready"
    assert reopened.get(property_.id).description_ai_short == "Ready description"
