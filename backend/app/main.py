from __future__ import annotations

from decimal import Decimal
from datetime import datetime, timezone
import hashlib
import os
from pathlib import Path
import secrets

from fastapi import FastAPI, Header, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.domain import AnalyticsEvent, DevelopmentLead, ProcessingJob, ProcessingJobStatus, Property, PropertyMedia, PropertyStatus, PropertyType, Tour, TourType, User, UserRole
from app.repository import analytics_repository, development_lead_repository, job_repository, media_repository, property_repository, session_repository, tour_repository, user_repository

app = FastAPI(title="Estate3D Backend", version="0.1.0")


def storage_root() -> Path:
    return Path(os.getenv("ESTATE3D_STORAGE_DIR", "storage"))


class UserPublicResponse(BaseModel):
    id: str
    email: str
    full_name: str = ""
    company_name: str = ""
    phone: str = ""
    role: UserRole = UserRole.INDIVIDUAL


class AuthRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""
    company_name: str = ""
    phone: str = ""


class AuthLoginRequest(BaseModel):
    email: str
    password: str


class AuthTokenResponse(BaseModel):
    user: UserPublicResponse
    access_token: str
    token_type: str = "bearer"


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


class ViewerPoint(BaseModel):
    x: float
    y: float
    z: float


class WindowView(BaseModel):
    id: str
    room_id: str
    label: str
    image_url: str
    direction_degrees: int


class Viewpoint(BaseModel):
    id: str
    room_id: str
    label: str
    mode: str
    position: ViewerPoint
    target: ViewerPoint


class Room(BaseModel):
    id: str
    name: str
    area_m2: float
    polygon: list[ViewerPoint]


class Unit(BaseModel):
    id: str
    number: str
    area_m2: float
    rooms_count: int
    price: str
    status: str
    plan_polygon: list[ViewerPoint]
    rooms: list[Room]
    viewpoints: list[Viewpoint]
    window_views: list[WindowView]


class Floor(BaseModel):
    id: str
    level: int
    label: str
    elevation: float
    units: list[Unit]


class Building(BaseModel):
    id: str
    name: str
    floors_count: int
    model: dict
    floors: list[Floor]


class DevelopmentViewerResponse(BaseModel):
    id: str
    name: str
    city: str
    hero: dict
    viewer_config: dict
    buildings: list[Building]


class DevelopmentLeadCreateRequest(BaseModel):
    building_id: str
    floor_id: str
    unit_id: str
    viewer_state: str
    contact_name: str = ""
    contact_phone: str = ""
    contact_email: str = ""
    message: str = ""


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "estate3d-backend"}


@app.get("/developments/demo-premium/viewer", response_model=DevelopmentViewerResponse)
def get_demo_development_viewer() -> DevelopmentViewerResponse:
    return _demo_development_viewer()


@app.post("/developments/demo-premium/leads", response_model=DevelopmentLead, status_code=status.HTTP_201_CREATED)
def create_demo_development_lead(payload: DevelopmentLeadCreateRequest) -> DevelopmentLead:
    development = _demo_development_viewer()
    unit = _find_demo_unit(development, payload.building_id, payload.floor_id, payload.unit_id)
    if unit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    lead = DevelopmentLead(
        development_id=development.id,
        development_name=development.name,
        building_id=payload.building_id,
        floor_id=payload.floor_id,
        unit_id=payload.unit_id,
        unit_number=unit.number,
        viewer_state=payload.viewer_state,
        contact_name=payload.contact_name,
        contact_phone=payload.contact_phone,
        contact_email=payload.contact_email,
        message=payload.message,
    )
    return development_lead_repository.create(lead)


@app.post("/auth/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: AuthRegisterRequest) -> AuthTokenResponse:
    if user_repository.get_by_email(payload.email) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = user_repository.create(
        User(
            email=payload.email.lower(),
            password_hash=_hash_password(payload.password),
            full_name=payload.full_name,
            company_name=payload.company_name,
            phone=payload.phone,
        )
    )
    return _auth_response_for_user(user)


@app.post("/auth/login", response_model=AuthTokenResponse)
def login(payload: AuthLoginRequest) -> AuthTokenResponse:
    user = user_repository.get_by_email(payload.email)
    if user is None or not _verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return _auth_response_for_user(user)


@app.get("/auth/me", response_model=UserPublicResponse)
def me(authorization: str | None = Header(default=None)) -> UserPublicResponse:
    user = _user_from_authorization_header(authorization)
    return _public_user(user)


def _auth_response_for_user(user: User) -> AuthTokenResponse:
    token = secrets.token_urlsafe(32)
    session_repository.create(token, user.id)
    return AuthTokenResponse(user=_public_user(user), access_token=token)


def _public_user(user: User) -> UserPublicResponse:
    return UserPublicResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        company_name=user.company_name,
        phone=user.phone,
        role=user.role,
    )


def _user_from_authorization_header(authorization: str | None) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    user_id = session_repository.get_user_id(token)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token")
    user = user_repository.get(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token")
    return user


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000).hex()
    return f"pbkdf2_sha256${salt}${digest}"


def _verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, salt, expected = password_hash.split("$", 2)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000).hex()
    return secrets.compare_digest(actual, expected)


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
def create_property(payload: PropertyCreateRequest, authorization: str | None = Header(default=None)) -> Property:
    current_user = _user_from_authorization_header(authorization)
    property_ = Property(**payload.model_dump(), owner_id=current_user.id)
    return property_repository.create(property_)


@app.get("/properties", response_model=PropertyListResponse)
def list_properties(authorization: str | None = Header(default=None)) -> PropertyListResponse:
    current_user = _user_from_authorization_header(authorization)
    return PropertyListResponse(items=[property_ for property_ in property_repository.list() if property_.owner_id == current_user.id])


@app.get("/properties/{property_id}", response_model=Property)
def get_property(property_id: str, authorization: str | None = Header(default=None)) -> Property:
    current_user = _user_from_authorization_header(authorization)
    return _owned_property_or_404(property_id, current_user)


@app.post("/properties/{property_id}/ai-description", response_model=Property)
def generate_ai_description(property_id: str, authorization: str | None = Header(default=None)) -> Property:
    current_user = _user_from_authorization_header(authorization)
    property_ = _owned_property_or_404(property_id, current_user)

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
def list_property_media(property_id: str, authorization: str | None = Header(default=None)) -> PropertyMediaListResponse:
    current_user = _user_from_authorization_header(authorization)
    _owned_property_or_404(property_id, current_user)
    return PropertyMediaListResponse(items=media_repository.list_for_property(property_id))


@app.post("/properties/{property_id}/media", response_model=PropertyMedia, status_code=status.HTTP_201_CREATED)
async def upload_property_media(property_id: str, file: UploadFile, authorization: str | None = Header(default=None)) -> PropertyMedia:
    current_user = _user_from_authorization_header(authorization)
    property_ = _owned_property_or_404(property_id, current_user)

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
def create_processing_job(property_id: str, payload: ProcessingJobCreateRequest, authorization: str | None = Header(default=None)) -> ProcessingJob:
    current_user = _user_from_authorization_header(authorization)
    property_ = _owned_property_or_404(property_id, current_user)

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
def update_processing_job(job_id: str, payload: ProcessingJobUpdateRequest, authorization: str | None = Header(default=None)) -> ProcessingJob:
    current_user = _user_from_authorization_header(authorization)
    job = job_repository.get(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing job not found")
    _owned_property_or_404(job.property_id, current_user)

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
def list_property_tours(property_id: str, authorization: str | None = Header(default=None)) -> PropertyTourListResponse:
    current_user = _user_from_authorization_header(authorization)
    _owned_property_or_404(property_id, current_user)
    return PropertyTourListResponse(items=tour_repository.list_for_property(property_id))


@app.post("/properties/{property_id}/tours", response_model=Tour, status_code=status.HTTP_201_CREATED)
def create_tour(property_id: str, payload: TourCreateRequest, authorization: str | None = Header(default=None)) -> Tour:
    current_user = _user_from_authorization_header(authorization)
    property_ = _owned_property_or_404(property_id, current_user)

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
def get_property_analytics(property_id: str, authorization: str | None = Header(default=None)) -> PropertyAnalyticsResponse:
    current_user = _user_from_authorization_header(authorization)
    _owned_property_or_404(property_id, current_user)

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


def _owned_property_or_404(property_id: str, current_user: User) -> Property:
    property_ = property_repository.get(property_id)
    if property_ is None or property_.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return property_


def _p(x: float, y: float, z: float = 0) -> ViewerPoint:
    return ViewerPoint(x=x, y=y, z=z)


def _demo_unit(unit_id: str, number: str, x_offset: float) -> Unit:
    living_room = Room(
        id=f"room_{unit_id}_living",
        name="Гостиная-кухня",
        area_m2=24.8,
        polygon=[_p(x_offset, 0), _p(x_offset + 5.2, 0), _p(x_offset + 5.2, 4.6), _p(x_offset, 4.6)],
    )
    bedroom = Room(
        id=f"room_{unit_id}_bedroom",
        name="Спальня",
        area_m2=14.2,
        polygon=[_p(x_offset, 4.8), _p(x_offset + 4.2, 4.8), _p(x_offset + 4.2, 8.4), _p(x_offset, 8.4)],
    )
    return Unit(
        id=unit_id,
        number=number,
        area_m2=58.7 if number.endswith("1") else 64.3,
        rooms_count=2,
        price="от 24.8 млн ₽",
        status="available",
        plan_polygon=[_p(x_offset, 0), _p(x_offset + 5.8, 0), _p(x_offset + 5.8, 8.8), _p(x_offset, 8.8)],
        rooms=[living_room, bedroom],
        viewpoints=[
            Viewpoint(
                id=f"vp_{unit_id}_living",
                room_id=living_room.id,
                label="Войти в гостиную",
                mode="walk",
                position=_p(x_offset + 2.4, 1.8, 1.6),
                target=_p(x_offset + 4.8, 4.2, 1.4),
            )
        ],
        window_views=[
            WindowView(
                id=f"window_{unit_id}_city",
                room_id=living_room.id,
                label="Вид из окна на город",
                image_url=f"/demo/window-views/{unit_id}-city.jpg",
                direction_degrees=118,
            )
        ],
    )


def _demo_floor(level: int) -> Floor:
    units = []
    if level == 8:
        units = [_demo_unit("unit_8_1", "81", -6.2), _demo_unit("unit_8_2", "82", 0.8), _demo_unit("unit_8_3", "83", 7.8)]
    return Floor(id=f"floor_{level}", level=level, label=f"{level} этаж", elevation=level * 3.25, units=units)


def _find_demo_unit(development: DevelopmentViewerResponse, building_id: str, floor_id: str, unit_id: str) -> Unit | None:
    for building in development.buildings:
        if building.id != building_id:
            continue
        for floor in building.floors:
            if floor.id != floor_id:
                continue
            for unit in floor.units:
                if unit.id == unit_id:
                    return unit
    return None


def _demo_development_viewer() -> DevelopmentViewerResponse:
    floors = [_demo_floor(level) for level in range(1, 17)]
    return DevelopmentViewerResponse(
        id="dev_demo_premium",
        name="Estate3D Skyline",
        city="Москва",
        hero={
            "tagline": "ЖК → корпус → этаж → квартира → окно",
            "headline": "Интерактивный выбор квартиры в 3D",
            "lead": "Демо-сцена для премиального выбора квартиры: плавный подлет к корпусу, выбор этажа, планировка квартиры и виды из окон.",
        },
        viewer_config={
            "default_state": "development_overview",
            "camera_states": ["development_overview", "building_focus", "floor_focus", "unit_top_down", "walk_mode", "window_view"],
            "accent_color": "#d7b56d",
        },
        buildings=[
            Building(
                id="building_a",
                name="Корпус A",
                floors_count=len(floors),
                model={"kind": "procedural_tower", "width": 18, "depth": 12, "floor_height": 3.25},
                floors=floors,
            )
        ],
    )
