from __future__ import annotations

from decimal import Decimal

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

from app.domain import Property, PropertyType
from app.repository import property_repository

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
