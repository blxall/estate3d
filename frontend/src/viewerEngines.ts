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
};

export const playCanvasSmokeFixture = {
  publicSlug: 'playcanvas-smoke',
  sceneUrl: '/playcanvas-smoke.glb',
  routePath: '/tour/playcanvas-smoke?engine=playcanvas',
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
