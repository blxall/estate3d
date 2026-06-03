import { lazy, Suspense, useRef } from 'react';

import { getDefaultPublicTourEngine, getViewerEngineConfig } from '../viewerEngines';
import type { ViewerEngine } from '../viewerEngines';

const ThreeGlbScene = lazy(() => import('./ThreeGlbScene').then((module) => ({ default: module.ThreeGlbScene })));
const PlayCanvasGlbScene = lazy(() =>
  import('./PlayCanvasGlbScene').then((module) => ({ default: module.PlayCanvasGlbScene })),
);

type Props = {
  sceneUrl: string;
  title: string;
  engine?: ViewerEngine;
};

export function GlbTourViewer({ sceneUrl, title, engine = getDefaultPublicTourEngine() }: Props) {
  const canvasRootRef = useRef<HTMLDivElement | null>(null);
  const engineConfig = getViewerEngineConfig(engine);
  const SceneComponent = engine === 'playcanvas' ? PlayCanvasGlbScene : ThreeGlbScene;

  function requestFullscreen() {
    void canvasRootRef.current?.requestFullscreen?.();
  }

  return (
    <section className="viewer" role="region" aria-label="3D viewer" data-viewer-engine={engine}>
      <div className="viewer-header">
        <div>
          <h2>{title}</h2>
          <span>GLB scene · {engineConfig.label}</span>
        </div>
        <div className="viewer-actions">
          <a href={sceneUrl} target="_blank" rel="noreferrer">
            Открыть GLB
          </a>
          <button type="button" onClick={requestFullscreen}>
            Fullscreen
          </button>
        </div>
      </div>
      <div className="viewer-canvas" data-testid="viewer-canvas-root" ref={canvasRootRef}>
        <Suspense fallback={<p className="viewer-status">Загружаем 3D viewer...</p>}>
          <SceneComponent sceneUrl={sceneUrl} />
        </Suspense>
      </div>
      <p className="viewer-engine-readout">{engineConfig.readout}</p>
      {engineConfig.rollout ? (
        <aside className="viewer-engine-diagnostics viewer-engine-rollout" role="note" aria-label="PlayCanvas rollout guardrails">
          <strong>PlayCanvas rollout guardrails</strong>
          <p>{engineConfig.rollout.fallbackLabel}</p>
          <p>lazy chunk budget: {engineConfig.rollout.lazyChunkBudgetKbGzip} KB gzip</p>
          <p>accepted warnings: {engineConfig.rollout.acceptedBuildWarnings.join(', ')}</p>
          <p>{engineConfig.rollout.nextMitigation}</p>
        </aside>
      ) : null}
      {engineConfig.validationStatus === 'spike' ? (
        <aside className="viewer-engine-diagnostics" role="note" aria-label="PlayCanvas spike validation">
          <strong>PlayCanvas spike validation</strong>
          <div>
            <span>Smoke checklist</span>
            <ul>
              {engineConfig.smokeChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <span>Risk notes</span>
            <ul>
              {engineConfig.riskNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>
      ) : null}
      <p className="scene-url">{sceneUrl}</p>
    </section>
  );
}
