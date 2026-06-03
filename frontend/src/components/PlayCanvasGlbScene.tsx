import { useEffect, useRef, useState } from 'react';
import * as pc from 'playcanvas';

type Props = {
  sceneUrl: string;
};

export function PlayCanvasGlbScene({ sceneUrl }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<pc.Application | null>(null);
  const [status, setStatus] = useState('Инициализируем PlayCanvas GLB runtime...');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || typeof HTMLCanvasElement === 'undefined') {
      setStatus('PlayCanvas canvas недоступен в этой среде');
      return;
    }

    if (typeof WebGLRenderingContext === 'undefined') {
      setStatus('WebGL недоступен — PlayCanvas runtime оставлен как shell');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.dataset.testid = 'playcanvas-glb-canvas';
    canvas.setAttribute('aria-label', 'PlayCanvas GLB scene canvas');
    mount.appendChild(canvas);

    let app: pc.Application;
    try {
      app = new pc.Application(canvas, {
        graphicsDeviceOptions: {
          antialias: true,
        },
      });
    } catch {
      canvas.remove();
      setStatus('Не удалось запустить PlayCanvas renderer');
      return;
    }

    appRef.current = app;
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    app.start();

    const camera = new pc.Entity('Estate3D PlayCanvas camera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.05, 0.09, 0.16),
      farClip: 1000,
      fov: 60,
      nearClip: 0.01,
    });
    camera.setPosition(2.5, 1.8, 4);
    camera.lookAt(0, 0.8, 0);
    app.root.addChild(camera);

    const light = new pc.Entity('Estate3D PlayCanvas light');
    light.addComponent('light', {
      color: new pc.Color(1, 1, 1),
      intensity: 1.4,
      type: 'directional',
    });
    light.setEulerAngles(45, 45, 0);
    app.root.addChild(light);

    const fallback = new pc.Entity('Estate3D fallback cube');
    fallback.addComponent('render', {
      type: 'box',
    });
    fallback.setLocalScale(1.4, 1.4, 1.4);
    fallback.setPosition(0, 0.7, 0);
    app.root.addChild(fallback);

    app.assets.loadFromUrl(sceneUrl, 'container', (error, asset) => {
      if (error || !asset?.resource) {
        setStatus('PlayCanvas GLB не загрузился — показываем fallback cube');
        return;
      }

      const resource = asset.resource as { instantiateRenderEntity?: () => pc.Entity };
      const entity = resource.instantiateRenderEntity?.();
      if (!entity) {
        setStatus('PlayCanvas GLB загружен, но render entity недоступен — показываем fallback cube');
        return;
      }
      fallback.destroy();
      app.root.addChild(entity);
      setStatus('PlayCanvas GLB сцена загружена');
    });

    const resize = () => app.resizeCanvas();
    window.addEventListener('resize', resize);
    resize();

    return () => {
      window.removeEventListener('resize', resize);
      app.destroy();
      appRef.current = null;
      if (canvas.parentNode === mount) {
        mount.removeChild(canvas);
      }
    };
  }, [sceneUrl]);

  return (
    <>
      <div className="viewer-canvas-inner playcanvas-canvas-inner" ref={mountRef} />
      <p className="viewer-status">{status}</p>
    </>
  );
}
