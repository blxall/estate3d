import { Canvas } from '@react-three/fiber';

import type { ViewerScene as ViewerSceneModel } from '../viewer/sceneAdapter';

type Props = {
  scene: ViewerSceneModel;
  selectedFloorId?: string | null;
  onChooseFloor: (floorId: string) => void;
};

function canUseWebGl(): boolean {
  if (typeof document === 'undefined' || navigator.userAgent.toLowerCase().includes('jsdom')) {
    return false;
  }
  const canvas = document.createElement('canvas');
  return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
}

function TowerMeshes({ scene, selectedFloorId }: Pick<Props, 'scene' | 'selectedFloorId'>) {
  return (
    <group rotation={[0.08, -0.42, 0]} position={[0, -2.4, 0]}>
      {scene.towerFloors.map((floor, index) => {
        const y = scene.towerFloors.length - index;
        const isSelected = selectedFloorId === floor.id;
        const color = isSelected ? '#f6d77b' : floor.hasUnits ? '#4aa3ff' : '#24344d';
        return (
          <mesh key={floor.id} position={[0, y * 0.18, 0]}>
            <boxGeometry args={[2.6, 0.12, 1.1]} />
            <meshStandardMaterial color={color} transparent opacity={isSelected ? 0.95 : 0.68} />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.9, 0.12, 1.3]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
    </group>
  );
}

export function ThreeDevelopmentScene({ scene, selectedFloorId, onChooseFloor }: Props) {
  const webGlAvailable = canUseWebGl();

  return (
    <div className="r3f-scene-shell" aria-label={`R3F scene slice for ${scene.building.name}`}>
      <div className="r3f-scene-meta">
        <span>R3F-ready tower geometry</span>
        <small>{webGlAvailable ? 'WebGL canvas active' : 'Semantic fallback active'}</small>
      </div>
      <div className="r3f-canvas-frame" aria-hidden="true">
        {webGlAvailable ? (
          <Canvas camera={{ position: [3, 2.6, 5], fov: 38 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[4, 5, 4]} intensity={1.5} />
            <TowerMeshes scene={scene} selectedFloorId={selectedFloorId} />
          </Canvas>
        ) : (
          <div className="r3f-canvas-fallback">WebGL preview fallback</div>
        )}
      </div>
      <div className="r3f-floor-hitboxes" aria-label="3D floor selection bridge">
        {scene.towerFloors.map((floor) => (
          <button
            key={floor.id}
            type="button"
            className={`r3f-floor-hitbox ${selectedFloorId === floor.id ? 'active' : ''} ${floor.hasUnits ? 'has-units' : ''}`}
            onClick={() => onChooseFloor(floor.id)}
          >
            3D floor mesh: {floor.label}
          </button>
        ))}
      </div>
    </div>
  );
}
