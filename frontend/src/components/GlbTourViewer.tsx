import { lazy, Suspense, useRef } from 'react';

const ThreeGlbScene = lazy(() => import('./ThreeGlbScene').then((module) => ({ default: module.ThreeGlbScene })));
const PlayCanvasGlbScene = lazy(() =>
  import('./PlayCanvasGlbScene').then((module) => ({ default: module.PlayCanvasGlbScene })),
);

type ViewerEngine = 'r3f' | 'playcanvas';

type Props = {
  sceneUrl: string;
  title: string;
  engine?: ViewerEngine;
};

export function GlbTourViewer({ sceneUrl, title, engine = 'r3f' }: Props) {
  const canvasRootRef = useRef<HTMLDivElement | null>(null);
  const engineLabel = engine === 'playcanvas' ? 'PlayCanvas runtime' : 'Orbit controls';
  const SceneComponent = engine === 'playcanvas' ? PlayCanvasGlbScene : ThreeGlbScene;

  function requestFullscreen() {
    void canvasRootRef.current?.requestFullscreen?.();
  }

  return (
    <section className="viewer" role="region" aria-label="3D viewer" data-viewer-engine={engine}>
      <div className="viewer-header">
        <div>
          <h2>{title}</h2>
          <span>GLB scene · {engineLabel}</span>
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
      <p className="scene-url">{sceneUrl}</p>
    </section>
  );
}
