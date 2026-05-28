import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type Props = {
  sceneUrl: string;
  title: string;
};

export function GlbTourViewer({ sceneUrl, title }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || typeof HTMLCanvasElement === 'undefined') {
      return;
    }

    const width = Math.max(mount.clientWidth, 640);
    const height = Math.max(mount.clientHeight, 360);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(2, 1.6, 4);

    if (typeof WebGLRenderingContext === 'undefined') {
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      return;
    }
    renderer.setSize(width, height);
    renderer.domElement.dataset.testid = 'glb-canvas';
    renderer.domElement.setAttribute('aria-label', 'GLB scene canvas');
    mount.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0x334155, 3);
    scene.add(light);
    const grid = new THREE.GridHelper(8, 8, 0x38bdf8, 0x1e293b);
    scene.add(grid);

    const loader = new GLTFLoader();
    loader.load(
      sceneUrl,
      (gltf) => {
        scene.add(gltf.scene);
      },
      undefined,
      () => {
        const fallback = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1.5, 1.5),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, wireframe: true }),
        );
        fallback.position.y = 0.75;
        scene.add(fallback);
      },
    );

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      scene.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [sceneUrl]);

  return (
    <section className="viewer" role="region" aria-label="3D viewer">
      <div className="viewer-header">
        <h2>{title}</h2>
        <span>GLB scene</span>
      </div>
      <div className="viewer-canvas" ref={mountRef}>
        <canvas data-testid="glb-canvas" hidden />
      </div>
      <p className="scene-url">{sceneUrl}</p>
    </section>
  );
}
