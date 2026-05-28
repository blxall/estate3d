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
