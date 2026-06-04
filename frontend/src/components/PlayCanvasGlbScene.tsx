import { useEffect, useRef, useState } from 'react';

import {
  Color,
  createEstate3dGlbApplication,
  Entity,
  FILLMODE_FILL_WINDOW,
  RESOLUTION_AUTO,
  type Estate3dGlbApplication,
  Vec3,
} from '../playcanvas/createEstate3dGlbApplication';

type Props = {
  sceneUrl: string;
};

export function PlayCanvasGlbScene({ sceneUrl }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Estate3dGlbApplication | null>(null);
  const [status, setStatus] = useState('Готовим интерактивный 3D-просмотр...');

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
    canvas.style.touchAction = 'none';
    mount.appendChild(canvas);

    let app: Estate3dGlbApplication;
    try {
      app = createEstate3dGlbApplication(canvas, {
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
    app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(RESOLUTION_AUTO);
    app.start();

    const camera = new Entity('Estate3D PlayCanvas camera');
    camera.addComponent('camera', {
      clearColor: new Color(0.05, 0.09, 0.16),
      farClip: 1000,
      fov: 60,
      nearClip: 0.01,
    });
    let yaw = 34;
    let pitch = 24;
    let radius = 5;
    const target = new Vec3(0, 0.8, 0);
    const applyCameraOrbit = () => {
      const yawRad = (yaw * Math.PI) / 180;
      const pitchRad = (pitch * Math.PI) / 180;
      const x = Math.sin(yawRad) * Math.cos(pitchRad) * radius;
      const y = Math.sin(pitchRad) * radius + target.y;
      const z = Math.cos(yawRad) * Math.cos(pitchRad) * radius;
      camera.setPosition(x, y, z);
      camera.lookAt(target);
    };
    applyCameraOrbit();
    app.root.addChild(camera);

    const light = new Entity('Estate3D PlayCanvas light');
    light.addComponent('light', {
      color: new Color(1, 1, 1),
      intensity: 1.4,
      type: 'directional',
    });
    light.setEulerAngles(45, 45, 0);
    app.root.addChild(light);

    const fallback = new Entity('Estate3D fallback cube');
    fallback.addComponent('render', {
      type: 'box',
    });
    fallback.setLocalScale(1.4, 1.4, 1.4);
    fallback.setPosition(0, 0.7, 0);
    app.root.addChild(fallback);

    app.assets.loadFromUrl(sceneUrl, 'container', (error, asset) => {
      if (error || !asset?.resource) {
        setStatus('Модель не загрузилась — показываем резервный предпросмотр');
        return;
      }

      const resource = asset.resource as { instantiateRenderEntity?: () => Entity };
      const entity = resource.instantiateRenderEntity?.();
      if (!entity) {
        setStatus('Модель загружена частично — показываем резервный предпросмотр');
        return;
      }
      fallback.destroy();
      app.root.addChild(entity);
      setStatus('3D-модель загружена');
    });

    let activePointerId: number | null = null;
    let lastPointer: { x: number; y: number } | null = null;
    const onPointerDown = (event: PointerEvent) => {
      activePointerId = event.pointerId;
      lastPointer = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture?.(event.pointerId);
      setStatus('Вращаем модель');
    };
    const onPointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId || !lastPointer) return;
      const dx = event.clientX - lastPointer.x;
      const dy = event.clientY - lastPointer.y;
      yaw += dx * 0.28;
      pitch = Math.max(-18, Math.min(62, pitch + dy * 0.18));
      lastPointer = { x: event.clientX, y: event.clientY };
      applyCameraOrbit();
    };
    const onPointerUp = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;
      activePointerId = null;
      lastPointer = null;
      canvas.releasePointerCapture?.(event.pointerId);
      setStatus('Вращение модели обновлено');
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      radius = Math.max(2.4, Math.min(8.5, radius + event.deltaY * 0.004));
      applyCameraOrbit();
      setStatus('Масштаб модели обновлён');
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const resize = () => app.resizeCanvas();
    window.addEventListener('resize', resize);
    resize();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
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
