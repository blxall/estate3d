from __future__ import annotations

from decimal import Decimal
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.domain import Property, PropertyMedia, PropertyStatus, PropertyType
from app.repository import media_repository, property_repository

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
