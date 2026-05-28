import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Props = {
  sceneUrl: string;
};

function fitCameraToObject(camera: THREE.PerspectiveCamera, controls: OrbitControls, object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z, 1);
  const fitDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
  camera.position.set(center.x + fitDistance, center.y + fitDistance * 0.65, center.z + fitDistance);
  camera.near = Math.max(fitDistance / 100, 0.01);
  camera.far = fitDistance * 100;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

export function ThreeGlbScene({ sceneUrl }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState('Загружаем GLB сцену...');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || typeof HTMLCanvasElement === 'undefined') {
      setStatus('3D canvas недоступен в этой среде');
      return;
    }

    const width = Math.max(mount.clientWidth, 640);
    const height = Math.max(mount.clientHeight, 360);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(2, 1.6, 4);

    if (typeof WebGLRenderingContext === 'undefined') {
      setStatus('WebGL недоступен — показываем shell viewer');
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setStatus('Не удалось запустить WebGL renderer');
      return;
    }

    renderer.setSize(width, height);
    renderer.domElement.dataset.testid = 'glb-canvas';
    renderer.domElement.setAttribute('aria-label', 'GLB scene canvas');
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 3));
    scene.add(new THREE.GridHelper(8, 8, 0x38bdf8, 0x1e293b));

    const loader = new GLTFLoader();
    loader.load(
      sceneUrl,
      (gltf) => {
        scene.add(gltf.scene);
        fitCameraToObject(camera, controls, gltf.scene);
        setStatus('GLB сцена загружена');
      },
      undefined,
      () => {
        const fallback = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1.5, 1.5),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, wireframe: true }),
        );
        fallback.position.y = 0.75;
        scene.add(fallback);
        fitCameraToObject(camera, controls, fallback);
        setStatus('GLB не загрузился — показываем fallback cube');
      },
    );

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [sceneUrl]);

  return (
    <>
      <div className="viewer-canvas-inner" ref={mountRef} />
      <p className="viewer-status">{status}</p>
    </>
  );
}
