from __future__ import annotations

from threading import Lock

from app.domain import Property


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


property_repository = PropertyRepository()
