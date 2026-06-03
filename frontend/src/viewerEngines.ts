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

export const viewerEngineOptions: ViewerEngineConfig[] = [
  {
    id: 'r3f',
    label: 'Orbit controls',
    readout: 'Renderer: Three.js/R3F · production default · GLB-first',
    publicTourDefault: true,
    validationStatus: 'production',
    riskNotes: [],
    smokeChecklist: [],
  },
  {
    id: 'playcanvas',
    label: 'PlayCanvas runtime',
    readout: 'Renderer: PlayCanvas · WebGL/WebGPU-ready · GLB-first',
    publicTourDefault: false,
    validationStatus: 'spike',
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

export function resolveViewerEngineFromSearch(search: string): ViewerEngine {
  const engine = new URLSearchParams(search).get('engine')?.toLowerCase();
  return engine === 'playcanvas' ? 'playcanvas' : 'r3f';
}
