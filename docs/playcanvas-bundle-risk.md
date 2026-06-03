# PlayCanvas bundle risk investigation

Date: 2026-06-03

## Current build risk

Public/uploaded GLB tours use PlayCanvas by default, behind a lazy-loaded `PlayCanvasGlbScene` chunk.

Current measured Vite build output:

- PlayCanvas chunk: `PlayCanvasGlbScene-*.js`
- Minified size: ~1,919.55 KB
- Gzip size: ~482.42 KB
- Guardrail: <= 500 KB gzip for the lazy PlayCanvas GLB chunk
- Status: accepted for guarded GLB-only public tour rollout

Accepted warnings:

- `playcanvas-lazy-chunk-over-700kb`
- `vite-node-worker-threads-externalized-for-gsplat-workers`

## Package/import finding

The package export `playcanvas` resolves to `build/playcanvas/src/index.js`. That index pulls the framework application path.

`Application` imports the full framework systems/handlers needed by the engine, including:

- `GSplatComponentSystem`
- `GSplatHandler`

The gsplat worker modules include Node fallback references to `require("node:worker_threads")`, which Vite externalizes for browser compatibility. This warning is coming from PlayCanvas package internals, not Estate3D domain/viewer code.

## Decision

Keep PlayCanvas as a guarded default for public/uploaded GLB tours because:

1. The GLB smoke passes in a real headless browser with SwiftShader.
2. The chunk is lazy-loaded, so dashboard/premium ЖК routes do not eagerly load PlayCanvas.
3. The measured gzip size is under the current 500 KB guardrail.
4. `?engine=r3f` remains a tested fallback/rollback route.

Do not migrate the premium ЖК semantic viewer yet. Keep it on the current tested R3F path until a separate migration slice.

## Deterministic check

Run:

```bash
cd /Users/blxall/estate3d/frontend
npm run build:playcanvas-risk
```

The script runs Vite build, parses the PlayCanvas chunk/warnings, prints `PLAYCANVAS_BUILD_RISK`, and fails if the PlayCanvas gzip chunk exceeds the guardrail or the chunk is missing.

## Next mitigation ideas

1. Inspect whether PlayCanvas exposes a smaller browser/GLB-only runtime entry in a future version.
2. If Vite/Rolldown supports cleaner code-splitting for package internals, isolate PlayCanvas worker/gsplat code without breaking `container` GLB loading.
3. Keep browser smoke green after every import/chunk experiment.
