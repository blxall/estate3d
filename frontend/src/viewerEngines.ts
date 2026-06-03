export type ViewerEngine = 'r3f' | 'playcanvas';
export type ViewerEngineValidationStatus = 'production' | 'spike';

export type ViewerEngineConfig = {
  id: ViewerEngine;
  label: string;
  readout: string;
  publicTourDefault: boolean;
  validationStatus: ViewerEngineValidationStatus;
  riskNotes: string[];
  smokeChecklist: string[];
  rollout?: {
    status: 'default-with-guardrails';
    fallbackQuery: string;
    fallbackLabel: string;
    lazyChunkBudgetKbGzip: number;
    acceptedBuildWarnings: string[];
    nextMitigation: string;
  };
};

export const playCanvasSmokeFixture = {
  publicSlug: 'playcanvas-smoke',
  sceneUrl: '/playcanvas-smoke.glb',
  routePath: '/tour/playcanvas-smoke',
  fallbackRoutePath: '/tour/playcanvas-smoke?engine=r3f',
  expectedLoadedStatus: 'PlayCanvas GLB сцена загружена',
} as const;

export const viewerEngineOptions: ViewerEngineConfig[] = [
  {
    id: 'r3f',
    label: 'Orbit controls',
    readout: 'Renderer: Three.js/R3F · explicit fallback · GLB-first',
    publicTourDefault: false,
    validationStatus: 'production',
    riskNotes: [],
    smokeChecklist: [],
  },
  {
    id: 'playcanvas',
    label: 'PlayCanvas runtime',
    readout: 'Renderer: PlayCanvas · WebGL/WebGPU-ready · GLB-first',
    publicTourDefault: true,
    validationStatus: 'production',
    riskNotes: ['large-lazy-chunk', 'vite-worker-threads-externalization', 'manual-real-glb-smoke-required'],
    smokeChecklist: [
      'real-glb-loads-or-fallback-is-visible',
      'resize-keeps-canvas-usable',
      'fullscreen-targets-viewer-root',
      'mobile-viewport-has-no-horizontal-overflow',
      'console-has-no-runtime-errors',
    ],
    rollout: {
      status: 'default-with-guardrails',
      fallbackQuery: '?engine=r3f',
      fallbackLabel: 'Fallback renderer: add ?engine=r3f if PlayCanvas fails on this device',
      lazyChunkBudgetKbGzip: 500,
      acceptedBuildWarnings: ['playcanvas-lazy-chunk-over-700kb', 'vite-node-worker-threads-externalized-for-gsplat-workers'],
      nextMitigation: 'Investigate PlayCanvas import/bundle splitting before premium ЖК migration',
    },
  },
];

export function getViewerEngineConfig(engine: ViewerEngine): ViewerEngineConfig {
  return viewerEngineOptions.find((option) => option.id === engine) ?? viewerEngineOptions[0];
}

export function getDefaultPublicTourEngine(): ViewerEngine {
  return viewerEngineOptions.find((option) => option.publicTourDefault)?.id ?? 'playcanvas';
}

export function resolveViewerEngineFromSearch(search: string): ViewerEngine {
  const engine = new URLSearchParams(search).get('engine')?.toLowerCase();
  if (engine === 'r3f') {
    return 'r3f';
  }
  if (engine === 'playcanvas') {
    return 'playcanvas';
  }
  return getDefaultPublicTourEngine();
}

export function buildFallbackRendererUrl(slug: string, search: string): string {
  const params = new URLSearchParams(search);
  params.delete('engine');
  params.append('engine', 'r3f');
  return `/tour/${encodeURIComponent(slug)}?${params.toString()}`;
}
