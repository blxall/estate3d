# PlayCanvas bundle risk investigation

Date: 2026-06-04

## Current build risk

Public/uploaded GLB tours use PlayCanvas by default, behind a lazy-loaded `PlayCanvasGlbScene` route chunk plus an isolated `playcanvas-vendor` chunk.

Current measured Vite build output:

- Scene wrapper chunk: `PlayCanvasGlbScene-*.js`
  - Minified size: ~3.45 KB
  - Gzip size: ~1.68 KB
- PlayCanvas vendor chunk: `playcanvas-vendor-*.js`
  - Minified size: ~1,918.62 KB
  - Gzip size: ~481.94 KB
- Combined PlayCanvas lazy payload: ~483.62 KB gzip
- Guardrail: <= 500 KB gzip combined for the PlayCanvas GLB runtime payload
- Status: accepted for guarded GLB-only public tour rollout; PlayCanvas is now isolated into a cacheable vendor chunk instead of being bundled into the scene wrapper.

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
2. The PlayCanvas runtime is lazy-loaded and vendor-isolated, so dashboard/premium ЖК routes do not eagerly load PlayCanvas and the public GLB wrapper can cache separately from the heavy engine package.
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
2. Investigate package-level gsplat worker imports to remove or defer the `node:worker_threads` externalization warnings without breaking `container` GLB loading.
3. Keep browser smoke green after every import/chunk experiment.
