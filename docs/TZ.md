# Estate3D MVP — техническое задание

## Цель

Создать web-платформу для риелторов, агентств и застройщиков, где пользователь создает объект недвижимости, загружает фото/видео/LiDAR/3D-файлы и получает интерактивный 3D-тур или fallback-тур по публичной ссылке.

## Главный принцип

Система гибридная:

1. LiDAR / готовый 3D-файл — основной точный режим для GLB/GLTF/OBJ/PLY/USDZ и будущих ARKit/RoomPlan-сканов.
2. Обычное видео/фото — массовый режим для пользователей без LiDAR.
3. Fallback panorama/gallery tour — если 3D-реконструкция не удалась, пользователь все равно получает полезный тур.

MVP не обещает инженерную CAD/БТИ-точность. MVP обещает визуальный дистанционный просмотр объекта. Точные размеры — только в verified/LiDAR-режиме или после ручной проверки.

## MVP v1 — обязательные функции

1. Web-кабинет.
2. Регистрация/логин.
3. Создание объекта недвижимости.
4. Загрузка материалов.
5. Поддержка готового GLB/GLTF как первого 3D-режима.
6. 3D viewer в браузере.
7. Публичная ссылка на тур.
8. AI-описание объекта.
9. Статусы обработки.
10. Простая аналитика просмотров.

## Не делаем в v1

1. Собственное iOS-приложение.
2. Точные измерения комнат.
3. Полную CAD-модель.
4. Автоматическую мебель/ремонт.
5. Marketplace объектов.
6. Сложные роли агентства.
7. Оплаты и тарифы.

## Статусы объекта

- draft — черновик.
- uploaded — файлы загружены.
- processing — идет обработка.
- ready — тур готов.
- failed — ошибка обработки.
- needs_more_media — нужно больше материалов.
- fallback_ready — готов fallback-тур.

## Типы медиа

- video — mp4/mov.
- photo — jpg/png/heic.
- lidar — LiDAR/scan source.
- model — glb/gltf/obj/ply/usdz.
- floorplan — jpg/png/pdf планировки.
- panorama — панорама.

## Типы тура

- glb_model — готовая web 3D-модель.
- gaussian_splat — будущий режим Gaussian Splatting.
- panorama — панорамный тур.
- gallery — fallback-галерея.

## Базовые сущности

### User

- id
- email
- password_hash
- full_name
- company_name
- phone
- role
- created_at
- updated_at

### Property

- id
- owner_id
- title
- property_type
- address_text
- city
- district
- area_m2
- rooms_count
- price
- currency
- description_raw
- description_ai_short
- description_ai_sales
- status
- quality_score
- public_slug
- is_public
- created_at
- updated_at

### PropertyMedia

- id
- property_id
- file_type
- original_filename
- storage_path
- mime_type
- size_bytes
- metadata_json
- created_at

### ProcessingJob

- id
- property_id
- job_type
- status
- input_media_ids
- output_json
- error_message
- started_at
- finished_at
- created_at

### Tour

- id
- property_id
- tour_type
- viewer_config_json
- scene_url
- preview_url
- public_url
- created_at

### AnalyticsEvent

- id
- property_id
- tour_id
- event_type
- visitor_id
- user_agent
- ip_hash
- metadata_json
- created_at

## Первый этап разработки

### Task 1
Создать backend доменную модель: enum-статусы, типы медиа, типы туров и dataclass/Pydantic модели для MVP-сущностей.

### Task 2
Создать FastAPI backend: healthcheck, создание объекта, получение объекта, список объектов.

### Task 3
Добавить upload API: принять файл, определить тип медиа, привязать к объекту, перевести объект в uploaded.

### Task 4
Добавить processing job abstraction: создать job, статусы processing/ready/failed/fallback_ready.

### Task 5
Добавить публичный tour endpoint: непредсказуемый public_slug, страница/JSON для viewer.

### Task 6
Создать frontend MVP: список объектов, создание объекта, upload, публичный viewer shell.

### Task 7
Добавить GLB viewer на Three.js.

### Task 8
Добавить AI description stub и затем реальную интеграцию.

### Task 9
Добавить analytics events для публичного просмотра.

## Технический стек MVP

Backend: Python 3.11+, FastAPI, Pydantic, pytest.
Frontend: Next.js/React/Three.js/Tailwind позже.
DB для раннего MVP: in-memory repository + последующий PostgreSQL.
Storage для раннего MVP: local filesystem + последующий S3/R2.
Queue для раннего MVP: synchronous/stub jobs + последующий Redis/Celery/RQ.

## Разработка

Работаем строго через TDD:

1. Сначала тест.
2. Запустить и увидеть ожидаемый FAIL.
3. Минимальная реализация.
4. Запустить и увидеть PASS.
5. Повторить.
