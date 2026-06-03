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

## Premium Interactive Development Viewer — стратегическое направление

Estate3D должен развиваться не просто как сайт с 3D-туром, а как premium real estate visualization platform: интерактивная 3D-продажная платформа для ЖК, корпусов, этажей, квартир и видов из окон.

### Дизайн-направление и качество визуала

Estate3D должен выглядеть как современный premium real-estate / architectural showroom, а не как debug/admin dashboard. Визуальная разработка должна опираться на качественные актуальные референсы и дизайн-системные правила, а не на поверхностную смену цветов.

Обязательные ориентиры:

1. `DESIGN.md` / дизайн-токены — использовать как будущий источник дизайн-системы проекта: цвета, типографика, spacing, radius, elevation, компоненты, do/don'ts и WCAG-контраст должны быть описаны явно, чтобы frontend-агенты и разработчики не импровизировали каждый раз заново.
2. `styles.refero.design` — использовать как постоянный банк актуальных визуальных направлений. Перед крупными UI/visual milestone нужно смотреть подходящие Refero-style страницы и разбирать не только палитру, но и структуру: hero composition, image/model usage, overlay logic, typography rhythm, density, interaction affordances, mobile behavior.
3. При переносе референса запрещено ограничиваться recolor/gamma pass. Если референс построен на full-bleed 3D/visual background, editorial overlay и floating UI, Estate3D должен повторять именно структуру страницы, а уже потом адаптировать контент и интерактивность.
4. Customer-facing surface не должен показывать debug/readout strings (`Deep link`, raw `viewerState`, `R3F-ready`, camera diagnostics, mesh labels). Такие данные можно сохранять семантически в DOM для тестов/a11y, но визуально они должны быть скрыты или заменены на sales/customer-facing copy.
5. После каждого визуального slice обязательны desktop/mobile screenshots и честный visual audit: hierarchy, contrast, clipping, clutter, reference match, mobile fit, отсутствие technical leakage.
6. Mobile-first viewer должен показывать интерактивную модель/visual area до длинной editorial copy, сохранять реальные browser/touch hitboxes для выбора этажа/квартиры и не перекрывать primary R3F/3D selection декоративными fallback layers.
7. Raw URLs, English/internal labels (`Share handoff`, `Copy-ready`, raw `viewerState`) не должны быть видны customer-facing пользователю. Если данные нужны для тестов, менеджерского handoff или a11y, они должны быть визуально демотированы/скрыты и заменены sales/customer-facing copy.
8. Основная текущая direction после Refero-разбора: warm editorial real-estate showroom. База — Incommonwith; механика floating/frosted HUD — General Intelligence Company; дисциплина hairline/minimal UI — Stykka. Следующие итерации должны усиливать не только shell, но и качество 3D/hero visual source.

### Целевой пользовательский сценарий

1. Покупатель открывает публичную страницу ЖК.
2. Видит красиво отрисованную 3D-модель комплекса.
3. Наводит на корпус — корпус подсвечивается.
4. Нажимает на корпус — камера плавно подлетает к нему.
5. Появляется панель этажей.
6. Нажимает, например, 8 этаж — камера динамично поднимается к уровню этажа и приближается.
7. Этаж подсвечивается, выезжает наружу или становится полупрозрачным.
8. Пользователь видит доступные квартиры на этаже.
9. Нажимает квартиру.
10. Камера переходит в top-down view квартиры, как в Sims.
11. Видна планировка, комнаты, точки просмотра и основные параметры.
12. Пользователь может переключиться в режим прогулки по комнатам.
13. Пользователь подходит к окну или выбирает window hotspot.
14. Система показывает заранее загруженный вид из конкретного окна/стороны/этажа.
15. Пользователь оставляет заявку или делится ссылкой.

### Режимы viewer-а

- Overview mode — весь ЖК / masterplan.
- Building mode — выбранный корпус.
- Floor mode — выбранный этаж.
- Unit plan mode — квартира сверху.
- Walk mode — перемещение по комнатам.
- Window view mode — реальный/рендерный вид из окна.
- Info mode — цены, площади, статусы, заявка.

### Сущности для будущего premium viewer

#### Development

- id
- name
- location
- description
- cover_image
- scene_config

#### Building

- id
- development_id
- name
- model_node_id
- position
- metadata

#### Floor

- id
- building_id
- number
- model_node_id
- elevation
- plan_image
- status_summary

#### Unit

- id
- floor_id
- number
- area
- rooms_count
- price
- status: available/reserved/sold/hidden
- plan_image
- model_node_id
- viewer_config

#### Room

- id
- unit_id
- name
- type
- polygon/position
- panorama_id

#### Viewpoint

- id
- unit_id
- room_id
- name
- position
- rotation
- panorama_url
- thumbnail_url

#### WindowView

- id
- unit_id
- room_id
- viewpoint_id
- direction
- floor_number
- image_url / panorama_url / video_url
- description

#### SceneHotspot

- id
- scene_id
- target_type: development/building/floor/unit/room/window/amenity
- target_id
- label
- position
- radius
- camera_target
- camera_position
- action_type

### Технологический подход

Frontend viewer:

- Three.js / React Three Fiber.
- drei.
- camera-controls или GSAP для плавных перелетов камеры.
- Zustand для состояния viewer-а.
- glTF/GLB как основной web-формат моделей.
- Draco compression и KTX2/Basis textures для production-моделей.
- CSS/HTML overlays для premium HUD, карточек и панелей.
- Mobile fallback для слабых устройств.

Asset pipeline:

- Для застройщиков основной путь — загрузка готовой architectural/BIM/3D модели: Revit, ArchiCAD, SketchUp, 3ds Max, Blender, GLB/GLTF/FBX/OBJ.
- Для MVP/demo допустима procedural/simplified модель: корпуса как блоки, этажи как интерактивные слои, квартиры как 2D/3D планировки.
- Для готовых квартир и шоурумов позже возможны LiDAR, photogrammetry, Gaussian splatting и panorama tours.

### Минимальный premium demo viewer

Для первого сильного демо не нужно делать весь город и полноценный BIM. Нужно сделать один качественный вертикальный прототип:

1. Один демо ЖК.
2. Один корпус.
3. 10–20 этажей как простая 3D-модель.
4. Выбор этажа с hover/click подсветкой.
5. Плавная камера к выбранному этажу.
6. Один выбранный этаж с 2–3 квартирами.
7. Выбор квартиры.
8. Top-down планировка квартиры.
9. 3–4 точки просмотра внутри.
10. 1–2 window views.
11. Floating premium UI: glass HUD, floor selector, unit card, CTA.

### Качество исполнения

Estate3D должен выглядеть как дорогой B2B SaaS для застройщиков и агентств, а не как pet project. Критичные элементы качества:

- кинематографичные easing-анимации камеры;
- аккуратный свет, shadows, ambient occlusion;
- baked materials для моделей;
- premium loading screen;
- glass/floating HUD;
- чистая типографика;
- плавные skeleton/loading states;
- хорошая mobile версия;
- понятный CTA для заявки.

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
