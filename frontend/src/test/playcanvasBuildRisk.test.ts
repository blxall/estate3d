import { describe, expect, it } from 'vitest';

import { parsePlayCanvasBuildRisk } from '../../scripts/playcanvas-build-risk.mjs';

const sampleBuildOutput = `vite v8.0.14 building client environment for production...
[plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/app/node_modules/playcanvas/build/playcanvas/src/scene/gsplat/gsplat-sort-worker.js".
[plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/app/node_modules/playcanvas/build/playcanvas/src/scene/gsplat-unified/gsplat-unified-sort-worker.js".
dist/assets/PlayCanvasGlbScene-DWAlQD1J.js     1,919.55 kB │ gzip: 482.42 kB
dist/assets/three.module-CTzb1Qcg.js             723.29 kB │ gzip: 184.50 kB
(!) Some chunks are larger than 700 kB after minification.
`;

describe('PlayCanvas build risk parser', () => {
  it('turns Vite build output into deterministic rollout budget metadata', () => {
    expect(parsePlayCanvasBuildRisk(sampleBuildOutput)).toEqual({
      playCanvasChunk: {
        file: 'dist/assets/PlayCanvasGlbScene-DWAlQD1J.js',
        sizeKb: 1919.55,
        gzipKb: 482.42,
        overChunkWarningLimit: true,
        withinGzipGuardrail: true,
      },
      warnings: {
        chunkWarning: true,
        nodeWorkerThreadsExternalizedCount: 2,
        acceptedWarningKeys: ['playcanvas-lazy-chunk-over-700kb', 'vite-node-worker-threads-externalized-for-gsplat-workers'],
      },
      mitigationDecision: 'guarded-default-accepted-for-glb-only-public-tours',
      nextMitigation: 'Keep PlayCanvas lazy-loaded; investigate package-level gsplat worker imports before premium ЖК migration.',
    });
  });
});
