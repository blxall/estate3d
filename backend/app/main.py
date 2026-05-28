from __future__ import annotations

from decimal import Decimal
from datetime import datetime, timezone
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.domain import AnalyticsEvent, ProcessingJob, ProcessingJobStatus, Property, PropertyMedia, PropertyStatus, PropertyType, Tour, TourType
from app.repository import analytics_repository, job_repository, media_repository, property_repository, tour_repository

app = FastAPI(title="Estate3D Backend", version="0.1.0")


def storage_root() -> Path:
    return Path(os.getenv("ESTATE3D_STORAGE_DIR", "storage"))


class PropertyCreateRequest(BaseModel):
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


class PropertyListResponse(BaseModel):
    items: list[Property]


class ProcessingJobCreateRequest(BaseModel):
    job_type: str
    input_media_ids: list[str] = []


class ProcessingJobUpdateRequest(BaseModel):
    status: ProcessingJobStatus
    output_json: dict = {}
    error_message: str = ""


class TourCreateRequest(BaseModel):
    tour_type: TourType
    scene_url: str
    preview_url: str = ""


class PublicTourResponse(BaseModel):
    property: Property
    tour: Tour
    viewer_config: dict


class PropertyMediaListResponse(BaseModel):
    items: list[PropertyMedia]


class PropertyTourListResponse(BaseModel):
    items: list[Tour]


class PropertyAnalyticsResponse(BaseModel):
    property_id: str
    tour_opened_count: int
    lead_click_count: int
    last_event_at: datetime | None = None


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "estate3d-backend"}


@app.get("/storage/{file_path:path}")
def get_storage_file(file_path: str) -> FileResponse:
    root = storage_root().resolve()
    target = (root / file_path).resolve()
    if root not in target.parents and target != root:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage file not found")
    if not target.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage file not found")
    return FileResponse(target)


@app.post("/properties", response_model=Property, status_code=status.HTTP_201_CREATED)
def create_property(payload: PropertyCreateRequest) -> Property:
    property_ = Property(**payload.model_dump())
    return property_repository.create(property_)


@app.get("/properties", response_model=PropertyListResponse)
def list_properties() -> PropertyListResponse:
    return PropertyListResponse(items=property_repository.list())


@app.get("/properties/{property_id}", response_model=Property)
def get_property(property_id: str) -> Property:
    property_ = property_repository.get(property_id)
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return property_


@app.post("/properties/{property_id}/ai-description", response_model=Property)
def generate_ai_description(property_id: str) -> Property:
    property_ = property_repository.get(property_id)
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    property_.description_ai_short = _build_ai_short_description(property_)
    property_.description_ai_sales = _build_ai_sales_description(property_)
    return property_repository.update(property_)


def _build_ai_short_description(property_: Property) -> str:
    rooms = f"{property_.rooms_count}-комн. " if property_.rooms_count is not None else ""
    area = f", {property_.area_m2} м²" if property_.area_m2 is not None else ""
    location_parts = [part for part in [property_.city, property_.district] if part]
    location = f", {', '.join(location_parts)}" if location_parts else ""
    raw = f" {property_.description_raw}" if property_.description_raw else ""
    return f"{rooms}{property_.property_type.value}{area}{location}.{raw}".strip()


def _build_ai_sales_description(property_: Property) -> str:
    price = _format_price(property_.price, property_.currency) if property_.price is not None else "цену уточняйте"
    return (
        f"{property_.title} — объект для дистанционного просмотра через 3D-тур. "
        f"Стоимость: {price}. "
        f"Планировка и параметры: {property_.description_ai_short} "
        "Отправьте публичную ссылку клиенту, чтобы он мог заранее оценить объект онлайн."
    )


def _format_price(price: Decimal, currency: str) -> str:
    return f"{int(price):,}".replace(",", " ") + f" {currency}"


@app.get("/properties/{property_id}/media", response_model=PropertyMediaListResponse)
def list_property_media(property_id: str) -> PropertyMediaListResponse:
    property_ = property_repository.get(property_id)
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return PropertyMediaListResponse(items=media_repository.list_for_property(property_id))


@app.post("/properties/{property_id}/media", response_model=PropertyMedia, status_code=status.HTTP_201_CREATED)
async def upload_property_media(property_id: str, file: UploadFile) -> PropertyMedia:
    property_ = property_repository.get(property_id)
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    filename = file.filename or "upload.bin"
    content = await file.read()
    storage_path = Path("properties") / property_id / filename
    storage_root_path = storage_root()
    absolute_path = storage_root_path / storage_path
    absolute_path.parent.mkdir(parents=True, exist_ok=True)
    absolute_path.write_bytes(content)

    media = PropertyMedia.from_upload(
        property_id=property_id,
        original_filename=filename,
        storage_path=str(storage_path),
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
    )
    media_repository.create(media)

    property_.status = PropertyStatus.UPLOADED
    property_repository.update(property_)
    return media


@app.post("/properties/{property_id}/jobs", response_model=ProcessingJob, status_code=status.HTTP_201_CREATED)
def create_processing_job(property_id: str, payload: ProcessingJobCreateRequest) -> ProcessingJob:
    property_ = property_repository.get(property_id)
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    job = ProcessingJob(
        property_id=property_id,
        job_type=payload.job_type,
        input_media_ids=payload.input_media_ids,
    )
    job_repository.create(job)
    property_.status = PropertyStatus.PROCESSING
    property_repository.update(property_)
    return job


@app.patch("/jobs/{job_id}", response_model=ProcessingJob)
def update_processing_job(job_id: str, payload: ProcessingJobUpdateRequest) -> ProcessingJob:
    job = job_repository.get(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing job not found")

    job.status = payload.status
    job.output_json = payload.output_json
    job.error_message = payload.error_message
    job.finished_at = datetime.now(timezone.utc)
    job_repository.update(job)

    property_ = property_repository.get(job.property_id)
    if property_ is not None:
        property_.status = _property_status_for_job_status(payload.status)
        property_repository.update(property_)
    return job


def _property_status_for_job_status(job_status: ProcessingJobStatus) -> PropertyStatus:
    if job_status is ProcessingJobStatus.READY:
        return PropertyStatus.READY
    if job_status is ProcessingJobStatus.FAILED:
        return PropertyStatus.FAILED
    if job_status is ProcessingJobStatus.FALLBACK_READY:
        return PropertyStatus.FALLBACK_READY
    return PropertyStatus.PROCESSING


@app.get("/properties/{property_id}/tours", response_model=PropertyTourListResponse)
def list_property_tours(property_id: str) -> PropertyTourListResponse:
    property_ = property_repository.get(property_id)
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return PropertyTourListResponse(items=tour_repository.list_for_property(property_id))


@app.post("/properties/{property_id}/tours", response_model=Tour, status_code=status.HTTP_201_CREATED)
def create_tour(property_id: str, payload: TourCreateRequest) -> Tour:
    property_ = property_repository.get(property_id)
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    property_.is_public = True
    property_.status = PropertyStatus.READY
    property_repository.update(property_)

    tour = Tour(
        property_id=property_id,
        tour_type=payload.tour_type,
        scene_url=payload.scene_url,
        preview_url=payload.preview_url,
        public_url=f"/tour/{property_.public_slug}",
    )
    return tour_repository.create(tour)


@app.get("/tour/{public_slug}", response_model=PublicTourResponse)
def get_public_tour(public_slug: str, request: Request) -> PublicTourResponse:
    tour = tour_repository.get_by_public_slug(public_slug)
    if tour is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")

    property_ = property_repository.get(tour.property_id)
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")

    analytics_repository.create(
        AnalyticsEvent(
            property_id=property_.id,
            tour_id=tour.id,
            event_type="tour_opened",
            user_agent=request.headers.get("user-agent", ""),
        )
    )
    return PublicTourResponse(property=property_, tour=tour, viewer_config=tour.viewer_config_json)


@app.get("/properties/{property_id}/analytics", response_model=PropertyAnalyticsResponse)
def get_property_analytics(property_id: str) -> PropertyAnalyticsResponse:
    property_ = property_repository.get(property_id)
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    events = analytics_repository.list_for_property(property_id)
    tour_opened_count = len([event for event in events if event.event_type == "tour_opened"])
    lead_click_count = len([event for event in events if event.event_type == "lead_clicked"])
    last_event_at = max((event.created_at for event in events), default=None)
    return PropertyAnalyticsResponse(
        property_id=property_id,
        tour_opened_count=tour_opened_count,
        lead_click_count=lead_click_count,
        last_event_at=last_event_at,
    )
