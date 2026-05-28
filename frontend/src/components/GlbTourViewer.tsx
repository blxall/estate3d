import { lazy, Suspense, useRef } from 'react';

const ThreeGlbScene = lazy(() => import('./ThreeGlbScene').then((module) => ({ default: module.ThreeGlbScene })));

type Props = {
  sceneUrl: string;
  title: string;
};

export function GlbTourViewer({ sceneUrl, title }: Props) {
  const canvasRootRef = useRef<HTMLDivElement | null>(null);

  function requestFullscreen() {
    void canvasRootRef.current?.requestFullscreen?.();
  }

  return (
    <section className="viewer" role="region" aria-label="3D viewer">
      <div className="viewer-header">
        <div>
          <h2>{title}</h2>
          <span>GLB scene · Orbit controls</span>
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
          <ThreeGlbScene sceneUrl={sceneUrl} />
        </Suspense>
      </div>
      <p className="scene-url">{sceneUrl}</p>
    </section>
  );
}
