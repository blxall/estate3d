# PlayCanvas bundle risk investigation

Date: 2026-06-04

## Current build risk

Public/uploaded GLB tours use PlayCanvas by default, behind a lazy-loaded `PlayCanvasGlbScene` route chunk plus an isolated `playcanvas-vendor` chunk.

Current measured Vite build output:

- Scene wrapper chunk: `PlayCanvasGlbScene-*.js`
  - Minified size: ~3.80 KB
  - Gzip size: ~1.87 KB
- PlayCanvas vendor chunk: `playcanvas-vendor-*.js`
  - Minified size: ~979.48 KB
  - Gzip size: ~257.04 KB
- Combined PlayCanvas lazy payload: ~258.91 KB gzip
- Guardrail: <= 500 KB gzip combined for the PlayCanvas GLB runtime payload
- Status: accepted for guarded GLB-only public tour rollout; PlayCanvas is isolated into a cacheable vendor chunk and the public GLB viewer now uses an Estate3D GLB-only `AppBase` factory rather than the full PlayCanvas `Application` import.

Accepted warnings:

- `playcanvas-lazy-chunk-over-700kb`

Eliminated warnings:

- `vite-node-worker-threads-externalized-for-gsplat-workers` — removed by avoiding the full `Application` entry, which imports `GSplatComponentSystem` and `GSplatHandler`.

## Package/import finding

The package export `playcanvas` resolves to `build/playcanvas/src/index.js`. That index pulls the framework application path.

`Application` imports the full framework systems/handlers needed by the engine, including:

- `GSplatComponentSystem`
- `GSplatHandler`

The gsplat worker modules include Node fallback references to `require("node:worker_threads")`, which Vite externalizes for browser compatibility. The warning came from PlayCanvas package internals, not Estate3D domain/viewer code.

Estate3D now avoids that path for public GLB tours through `frontend/src/playcanvas/createEstate3dGlbApplication.ts`: it builds a small `AppBase` with only the component systems and handlers needed for GLB/container rendering (`Render`, `Camera`, `Light`, `RenderHandler`, `MaterialHandler`, `TextureHandler`, `JsonHandler`, `BinaryHandler`, `ContainerHandler`). The static import-surface test guards against reintroducing `playcanvas`, `framework/application`, `handlers/gsplat`, or `components/gsplat` into the public GLB renderer.

## Decision

Keep PlayCanvas as a guarded default for public/uploaded GLB tours because:

1. The GLB smoke passes in a real headless browser with SwiftShader.
2. The PlayCanvas runtime is lazy-loaded, vendor-isolated, and GLB-only, so dashboard/premium ЖК routes do not eagerly load PlayCanvas and the public GLB wrapper can cache separately from the heavy engine package.
3. The measured combined gzip size is under the current 500 KB guardrail.
4. `?engine=r3f` remains a tested fallback/rollback route.

Do not migrate the premium ЖК semantic viewer yet. Keep it on the current tested R3F path until a separate migration slice.

## Deterministic check

Run:

```bash
cd /Users/blxall/estate3d/frontend
npm run build:playcanvas-risk
```

The script runs Vite build, parses the PlayCanvas scene/vendor chunks and accepted warnings, prints `PLAYCANVAS_BUILD_RISK`, and fails if the combined PlayCanvas gzip payload exceeds the guardrail or the guarded chunk is missing.

## Next mitigation ideas

1. Inspect whether PlayCanvas exposes a smaller browser/GLB-only runtime entry in a future version.
2. Keep the GLB-only factory green in browser smoke before adding any new PlayCanvas subsystem.
3. If future Gaussian splat support is needed, add it behind a separate renderer path instead of reintroducing full `Application` imports into the GLB route.
