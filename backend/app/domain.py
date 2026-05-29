from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Any
from uuid import uuid4
import secrets

from pydantic import BaseModel, Field, field_validator


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex}"


def _slug() -> str:
    return secrets.token_urlsafe(18)


class UserRole(str, Enum):
    INDIVIDUAL = "individual"
    AGENCY_ADMIN = "agency_admin"
    AGENCY_MEMBER = "agency_member"


class PropertyStatus(str, Enum):
    DRAFT = "draft"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    NEEDS_MORE_MEDIA = "needs_more_media"
    FALLBACK_READY = "fallback_ready"


class PropertyType(str, Enum):
    APARTMENT = "apartment"
    HOUSE = "house"
    OFFICE = "office"
    COMMERCIAL = "commercial"
    LAND = "land"
    OTHER = "other"


class MediaFileType(str, Enum):
    VIDEO = "video"
    PHOTO = "photo"
    LIDAR = "lidar"
    MODEL = "model"
    FLOORPLAN = "floorplan"
    PANORAMA = "panorama"


class ProcessingJobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    FALLBACK_READY = "fallback_ready"


class TourType(str, Enum):
    GLB_MODEL = "glb_model"
    GAUSSIAN_SPLAT = "gaussian_splat"
    PANORAMA = "panorama"
    GALLERY = "gallery"


class User(BaseModel):
    id: str = Field(default_factory=lambda: _id("user"))
    email: str
    password_hash: str
    full_name: str = ""
    company_name: str = ""
    phone: str = ""
    role: UserRole = UserRole.INDIVIDUAL
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class Property(BaseModel):
    id: str = Field(default_factory=lambda: _id("prop"))
    owner_id: str | None = None
    title: str
    property_type: PropertyType
    address_text: str = ""
    city: str = ""
    district: str = ""
    area_m2: Decimal | None = None
    rooms_count: int | None = None
    price: Decimal | None = None
    currency: str = "RUB"
    description_raw: str = ""
    description_ai_short: str = ""
    description_ai_sales: str = ""
    status: PropertyStatus = PropertyStatus.DRAFT
    quality_score: float | None = None
    public_slug: str = Field(default_factory=_slug)
    is_public: bool = False
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    @field_validator("area_m2", "price")
    @classmethod
    def _non_negative_decimal(cls, value: Decimal | None) -> Decimal | None:
        if value is not None and value < 0:
            raise ValueError("must be non-negative")
        return value

    @field_validator("rooms_count")
    @classmethod
    def _non_negative_int(cls, value: int | None) -> int | None:
        if value is not None and value < 0:
            raise ValueError("must be non-negative")
        return value


class PropertyMedia(BaseModel):
    id: str = Field(default_factory=lambda: _id("media"))
    property_id: str
    file_type: MediaFileType
    original_filename: str
    storage_path: str
    mime_type: str
    size_bytes: int
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=_utcnow)

    @classmethod
    def from_upload(
        cls,
        *,
        property_id: str,
        original_filename: str,
        storage_path: str,
        mime_type: str,
        size_bytes: int,
        metadata_json: dict[str, Any] | None = None,
    ) -> "PropertyMedia":
        return cls(
            property_id=property_id,
            file_type=detect_media_file_type(original_filename, mime_type),
            original_filename=original_filename,
            storage_path=storage_path,
            mime_type=mime_type,
            size_bytes=size_bytes,
            metadata_json=metadata_json or {},
        )


class ProcessingJob(BaseModel):
    id: str = Field(default_factory=lambda: _id("job"))
    property_id: str
    job_type: str
    status: ProcessingJobStatus = ProcessingJobStatus.QUEUED
    input_media_ids: list[str] = Field(default_factory=list)
    output_json: dict[str, Any] = Field(default_factory=dict)
    error_message: str = ""
    started_at: datetime | None = None
    finished_at: datetime | None = None
    created_at: datetime = Field(default_factory=_utcnow)


class Tour(BaseModel):
    id: str = Field(default_factory=lambda: _id("tour"))
    property_id: str
    tour_type: TourType
    viewer_config_json: dict[str, Any] = Field(default_factory=dict)
    scene_url: str
    preview_url: str = ""
    public_url: str
    created_at: datetime = Field(default_factory=_utcnow)

    def model_post_init(self, __context: Any) -> None:
        if not self.viewer_config_json:
            self.viewer_config_json = {"tour_type": self.tour_type.value, "scene_url": self.scene_url}


class AnalyticsEvent(BaseModel):
    id: str = Field(default_factory=lambda: _id("event"))
    property_id: str
    tour_id: str
    event_type: str
    visitor_id: str = ""
    user_agent: str = ""
    ip_hash: str = ""
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=_utcnow)


class DevelopmentLead(BaseModel):
    id: str = Field(default_factory=lambda: _id("lead"))
    development_id: str
    development_name: str
    building_id: str
    floor_id: str
    unit_id: str
    unit_number: str
    viewer_state: str
    contact_name: str = ""
    contact_phone: str = ""
    contact_email: str = ""
    message: str = ""
    status: str = "new"
    created_at: datetime = Field(default_factory=_utcnow)


def detect_media_file_type(filename: str, mime_type: str) -> MediaFileType:
    suffix = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    mime = mime_type.lower()

    if suffix in {"glb", "gltf", "obj", "ply", "usdz"} or mime.startswith("model/"):
        return MediaFileType.MODEL
    if suffix in {"mp4", "mov", "m4v"} or mime.startswith("video/"):
        return MediaFileType.VIDEO
    if suffix in {"jpg", "jpeg", "png", "heic", "webp"} or mime.startswith("image/"):
        return MediaFileType.PHOTO
    if suffix == "pdf" or mime == "application/pdf":
        return MediaFileType.FLOORPLAN
    return MediaFileType.PHOTO
