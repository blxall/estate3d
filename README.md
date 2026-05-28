# Estate3D

Hybrid LiDAR/non-LiDAR 3D tour platform for real estate.

See `docs/TZ.md` for the working technical specification.

## Development

Backend first, strict TDD.

```bash
cd backend
uv sync --extra dev
uv run pytest -q
```

Frontend:

```bash
cd frontend
npm install
npm test
npm run build
npm run dev
```

Full local smoke check:

```bash
./scripts/smoke_local.sh
```

The frontend dev server proxies `/api/*` to the backend at `http://127.0.0.1:8000`.
