#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
STORAGE_DIR="${ESTATE3D_STORAGE_DIR:-$ROOT_DIR/backend/storage}"
DB_PATH="${ESTATE3D_DB_PATH:-/tmp/estate3d-smoke.sqlite3}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then kill "$BACKEND_PID" >/dev/null 2>&1 || true; fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then kill "$FRONTEND_PID" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT

mkdir -p "$STORAGE_DIR"
rm -f "$DB_PATH"

cd "$BACKEND_DIR"
ESTATE3D_STORAGE_DIR="$STORAGE_DIR" ESTATE3D_DB_PATH="$DB_PATH" uv run uvicorn app.main:app --host 127.0.0.1 --port "$BACKEND_PORT" >/tmp/estate3d-backend.log 2>&1 &
BACKEND_PID=$!

cd "$FRONTEND_DIR"
npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" >/tmp/estate3d-frontend.log 2>&1 &
FRONTEND_PID=$!

for _ in {1..60}; do
  if curl -fsS "http://127.0.0.1:$BACKEND_PORT/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

curl -fsS "http://127.0.0.1:$BACKEND_PORT/health" | grep -q 'estate3d-backend'
curl -fsS "http://127.0.0.1:$FRONTEND_PORT/" | grep -q 'Estate3D'

AUTH_JSON=$(curl -fsS -X POST "http://127.0.0.1:$BACKEND_PORT/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@example.com","password":"strong-password","full_name":"Smoke Agent"}')
ACCESS_TOKEN=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])' <<<"$AUTH_JSON")
AUTH_HEADER="Authorization: Bearer ${ACCESS_TOKEN}"

PROPERTY_JSON=$(curl -fsS -X POST "http://127.0.0.1:$BACKEND_PORT/properties" \
  -H 'Content-Type: application/json' \
  -H "$AUTH_HEADER" \
  -d '{"title":"Smoke GLB объект","property_type":"apartment","city":"Москва","area_m2":"55"}')
PROPERTY_ID=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])' <<<"$PROPERTY_JSON")

SMOKE_GLB="/tmp/estate3d-smoke-scene.glb"
printf 'glb-smoke' > "$SMOKE_GLB"
MEDIA_JSON=$(curl -fsS -X POST "http://127.0.0.1:$BACKEND_PORT/properties/$PROPERTY_ID/media" \
  -H "$AUTH_HEADER" \
  -F "file=@$SMOKE_GLB;type=model/gltf-binary")
STORAGE_PATH=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["storage_path"])' <<<"$MEDIA_JSON")
SCENE_URL="/storage/$STORAGE_PATH"

TOUR_JSON=$(curl -fsS -X POST "http://127.0.0.1:$BACKEND_PORT/properties/$PROPERTY_ID/tours" \
  -H 'Content-Type: application/json' \
  -H "$AUTH_HEADER" \
  -d "{\"tour_type\":\"glb_model\",\"scene_url\":\"$SCENE_URL\",\"preview_url\":\"\"}")
PUBLIC_URL=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["public_url"])' <<<"$TOUR_JSON")

curl -fsS "http://127.0.0.1:$BACKEND_PORT$PUBLIC_URL" | grep -q 'Smoke GLB объект'
curl -fsS "http://127.0.0.1:$BACKEND_PORT$SCENE_URL" | grep -q 'glb-smoke'

echo "Estate3D smoke OK"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
echo "Tour API: http://127.0.0.1:$BACKEND_PORT$PUBLIC_URL"
