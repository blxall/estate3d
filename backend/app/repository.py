from __future__ import annotations

from threading import Lock

from app.domain import ProcessingJob, Property, PropertyMedia


class PropertyRepository:
    def __init__(self) -> None:
        self._properties: dict[str, Property] = {}
        self._lock = Lock()

    def create(self, property_: Property) -> Property:
        with self._lock:
            self._properties[property_.id] = property_
        return property_

    def get(self, property_id: str) -> Property | None:
        return self._properties.get(property_id)

    def list(self) -> list[Property]:
        return list(self._properties.values())

    def update(self, property_: Property) -> Property:
        with self._lock:
            self._properties[property_.id] = property_
        return property_


class MediaRepository:
    def __init__(self) -> None:
        self._media: dict[str, PropertyMedia] = {}
        self._lock = Lock()

    def create(self, media: PropertyMedia) -> PropertyMedia:
        with self._lock:
            self._media[media.id] = media
        return media

    def list_for_property(self, property_id: str) -> list[PropertyMedia]:
        return [media for media in self._media.values() if media.property_id == property_id]


class JobRepository:
    def __init__(self) -> None:
        self._jobs: dict[str, ProcessingJob] = {}
        self._lock = Lock()

    def create(self, job: ProcessingJob) -> ProcessingJob:
        with self._lock:
            self._jobs[job.id] = job
        return job

    def get(self, job_id: str) -> ProcessingJob | None:
        return self._jobs.get(job_id)

    def update(self, job: ProcessingJob) -> ProcessingJob:
        with self._lock:
            self._jobs[job.id] = job
        return job


property_repository = PropertyRepository()
media_repository = MediaRepository()
job_repository = JobRepository()
