from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from threading import Lock
from typing import Generic, TypeVar

from pydantic import BaseModel

from app.domain import AnalyticsEvent, ProcessingJob, Property, PropertyMedia, Tour, User

ModelT = TypeVar("ModelT", bound=BaseModel)


class SQLiteStore:
    def __init__(self, db_path: str | Path = ":memory:") -> None:
        self.db_path = str(db_path)
        self._lock = Lock()
        self._memory_connection: sqlite3.Connection | None = None
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        if self.db_path == ":memory:":
            if self._memory_connection is None:
                self._memory_connection = sqlite3.connect(self.db_path, check_same_thread=False)
                self._memory_connection.row_factory = sqlite3.Row
            return self._memory_connection

        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connection() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS records (
                    collection TEXT NOT NULL,
                    id TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    PRIMARY KEY (collection, id)
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL
                )
                """
            )
            connection.commit()

    def _connection(self):
        store = self

        class _ConnectionContext:
            def __enter__(self) -> sqlite3.Connection:
                self.connection = store._connect()
                return self.connection

            def __exit__(self, exc_type, exc_value, traceback) -> None:
                if store.db_path != ":memory:":
                    self.connection.close()

        return _ConnectionContext()

    def upsert(self, collection: str, record_id: str, payload: dict) -> None:
        encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True)
        with self._lock, self._connection() as connection:
            connection.execute(
                """
                INSERT INTO records (collection, id, payload)
                VALUES (?, ?, ?)
                ON CONFLICT(collection, id) DO UPDATE SET payload = excluded.payload
                """,
                (collection, record_id, encoded),
            )
            connection.commit()

    def get(self, collection: str, record_id: str) -> dict | None:
        with self._lock, self._connection() as connection:
            row = connection.execute(
                "SELECT payload FROM records WHERE collection = ? AND id = ?",
                (collection, record_id),
            ).fetchone()
        if row is None:
            return None
        return json.loads(row["payload"])

    def list(self, collection: str) -> list[dict]:
        with self._lock, self._connection() as connection:
            rows = connection.execute(
                "SELECT payload FROM records WHERE collection = ? ORDER BY rowid ASC",
                (collection,),
            ).fetchall()
        return [json.loads(row["payload"]) for row in rows]

    def create_session(self, token: str, user_id: str) -> None:
        with self._lock, self._connection() as connection:
            connection.execute(
                """
                INSERT INTO sessions (token, user_id)
                VALUES (?, ?)
                ON CONFLICT(token) DO UPDATE SET user_id = excluded.user_id
                """,
                (token, user_id),
            )
            connection.commit()

    def get_session_user_id(self, token: str) -> str | None:
        with self._lock, self._connection() as connection:
            row = connection.execute("SELECT user_id FROM sessions WHERE token = ?", (token,)).fetchone()
        return None if row is None else str(row["user_id"])


class SQLiteRepository(Generic[ModelT]):
    collection: str
    model_type: type[ModelT]

    def __init__(self, store: SQLiteStore | None = None) -> None:
        self._store = store or default_store()

    def _save(self, model: ModelT) -> ModelT:
        record_id = str(getattr(model, "id"))
        self._store.upsert(self.collection, record_id, model.model_dump(mode="json"))
        return model

    def _get(self, record_id: str) -> ModelT | None:
        payload = self._store.get(self.collection, record_id)
        if payload is None:
            return None
        return self.model_type.model_validate(payload)

    def _list(self) -> list[ModelT]:
        return [self.model_type.model_validate(payload) for payload in self._store.list(self.collection)]


class UserRepository(SQLiteRepository[User]):
    collection = "users"
    model_type = User

    def create(self, user: User) -> User:
        return self._save(user)

    def get(self, user_id: str) -> User | None:
        return self._get(user_id)

    def get_by_email(self, email: str) -> User | None:
        normalized = email.lower()
        for user in self._list():
            if user.email.lower() == normalized:
                return user
        return None


class SessionRepository:
    def __init__(self, store: SQLiteStore | None = None) -> None:
        self._store = store or default_store()

    def create(self, token: str, user_id: str) -> str:
        self._store.create_session(token, user_id)
        return token

    def get_user_id(self, token: str) -> str | None:
        return self._store.get_session_user_id(token)


class PropertyRepository(SQLiteRepository[Property]):
    collection = "properties"
    model_type = Property

    def create(self, property_: Property) -> Property:
        return self._save(property_)

    def get(self, property_id: str) -> Property | None:
        return self._get(property_id)

    def list(self) -> list[Property]:
        return self._list()

    def update(self, property_: Property) -> Property:
        return self._save(property_)


class MediaRepository(SQLiteRepository[PropertyMedia]):
    collection = "media"
    model_type = PropertyMedia

    def create(self, media: PropertyMedia) -> PropertyMedia:
        return self._save(media)

    def list_for_property(self, property_id: str) -> list[PropertyMedia]:
        return [media for media in self._list() if media.property_id == property_id]


class JobRepository(SQLiteRepository[ProcessingJob]):
    collection = "jobs"
    model_type = ProcessingJob

    def create(self, job: ProcessingJob) -> ProcessingJob:
        return self._save(job)

    def get(self, job_id: str) -> ProcessingJob | None:
        return self._get(job_id)

    def update(self, job: ProcessingJob) -> ProcessingJob:
        return self._save(job)


class TourRepository(SQLiteRepository[Tour]):
    collection = "tours"
    model_type = Tour

    def create(self, tour: Tour) -> Tour:
        return self._save(tour)

    def get_by_public_slug(self, slug: str) -> Tour | None:
        public_url = f"/tour/{slug}"
        for tour in self._list():
            if tour.public_url == public_url:
                return tour
        return None

    def list_for_property(self, property_id: str) -> list[Tour]:
        return [tour for tour in self._list() if tour.property_id == property_id]


class AnalyticsRepository(SQLiteRepository[AnalyticsEvent]):
    collection = "analytics_events"
    model_type = AnalyticsEvent

    def create(self, event: AnalyticsEvent) -> AnalyticsEvent:
        return self._save(event)

    def list_for_property(self, property_id: str) -> list[AnalyticsEvent]:
        return [event for event in self._list() if event.property_id == property_id]


_default_store: SQLiteStore | None = None


def default_store() -> SQLiteStore:
    global _default_store
    if _default_store is None:
        _default_store = SQLiteStore(os.getenv("ESTATE3D_DB_PATH", ":memory:"))
    return _default_store


_store = default_store()
user_repository = UserRepository(_store)
session_repository = SessionRepository(_store)
property_repository = PropertyRepository(_store)
media_repository = MediaRepository(_store)
job_repository = JobRepository(_store)
tour_repository = TourRepository(_store)
analytics_repository = AnalyticsRepository(_store)
