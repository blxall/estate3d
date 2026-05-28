from __future__ import annotations

from decimal import Decimal
from datetime import datetime, timezone
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.domain import ProcessingJob, ProcessingJobStatus, Property, PropertyMedia, PropertyStatus, PropertyType
from app.repository import job_repository, media_repository, property_repository

app = FastAPI(title="Estate3D Backend", version="0.1.0")


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


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "estate3d-backend"}


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


@app.post("/properties/{property_id}/media", response_model=PropertyMedia, status_code=status.HTTP_201_CREATED)
async def upload_property_media(property_id: str, file: UploadFile) -> PropertyMedia:
    property_ = property_repository.get(property_id)
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    filename = file.filename or "upload.bin"
    content = await file.read()
    storage_path = Path("properties") / property_id / filename
    storage_root = Path(os.getenv("ESTATE3D_STORAGE_DIR", "storage"))
    absolute_path = storage_root / storage_path
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
