import { Canvas } from '@react-three/fiber';
import { useState } from 'react';

import type { DevelopmentFloor, DevelopmentUnit } from '../types';
import { buildCameraPlan, type ViewerScene as ViewerSceneModel, type ViewerState } from '../viewer/sceneAdapter';

type Props = {
  scene: ViewerSceneModel;
  viewerState: ViewerState;
  selectedFloor?: DevelopmentFloor | null;
  selectedUnit?: DevelopmentUnit | null;
  selectedFloorId?: string | null;
  onChooseFloor: (floorId: string) => void;
};

type TowerMeshesProps = Pick<Props, 'scene' | 'selectedFloorId' | 'onChooseFloor'> & {
  hoveredFloorId: string | null;
  onHoverFloor: (floorId: string | null) => void;
};

function canUseWebGl(): boolean {
  if (typeof document === 'undefined' || navigator.userAgent.toLowerCase().includes('jsdom')) {
    return false;
  }
  const canvas = document.createElement('canvas');
  return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
}

function floorLabel(scene: ViewerSceneModel, floorId?: string | null): string {
  if (!floorId) {
    return 'none';
  }
  return scene.towerFloors.find((floor) => floor.id === floorId)?.label ?? floorId;
}

function TowerMeshes({ scene, selectedFloorId, hoveredFloorId, onChooseFloor, onHoverFloor }: TowerMeshesProps) {
  return (
    <group rotation={[0.08, -0.42, 0]} position={[0, -2.4, 0]}>
      <mesh position={[0, 1.62, 0]}>
        <boxGeometry args={[3.0, 3.2, 1.34]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.18} />
      </mesh>
      {scene.towerFloors.map((floor, index) => {
        const y = scene.towerFloors.length - index;
        const isSelected = selectedFloorId === floor.id;
        const isHovered = hoveredFloorId === floor.id;
        const color = isSelected ? '#f6d77b' : isHovered ? '#7dd3fc' : floor.hasUnits ? '#4aa3ff' : '#24344d';
        const width = isSelected || isHovered ? 2.9 : 2.6;
        return (
          <mesh
            key={floor.id}
            position={[0, y * 0.18, 0]}
            onClick={() => onChooseFloor(floor.id)}
            onPointerOver={(event) => {
              event.stopPropagation();
              onHoverFloor(floor.id);
            }}
            onPointerOut={() => onHoverFloor(null)}
          >
            <boxGeometry args={[width, 0.12, 1.1]} />
            <meshStandardMaterial color={color} transparent opacity={isSelected ? 0.97 : isHovered ? 0.86 : 0.68} />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.2, 0.18, 1.5]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
    </group>
  );
}

export function ThreeDevelopmentScene({ scene, viewerState, selectedFloor, selectedUnit, selectedFloorId, onChooseFloor }: Props) {
  const webGlAvailable = canUseWebGl();
  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);
  const selectedLabel = floorLabel(scene, selectedFloorId);
  const hoveredLabel = floorLabel(scene, hoveredFloorId);
  const cameraPlan = buildCameraPlan({ scene, viewerState, selectedFloor, selectedUnit });

  return (
    <div className="r3f-scene-shell" aria-label={`R3F scene slice for ${scene.building.name}`}>
      <div className="r3f-scene-meta">
        <span>R3F-ready tower geometry</span>
        <small>{webGlAvailable ? 'WebGL canvas active' : 'Semantic fallback active'}</small>
      </div>
      <div className="r3f-camera-readout" aria-live="polite">
        <span>Camera frame: {cameraPlan.frame}</span>
        <span>Camera target: {cameraPlan.target.join(',')}</span>
        <span>Camera position: {cameraPlan.position.join(',')}</span>
        <span>{cameraPlan.label}</span>
        <span>Selected mesh: {selectedLabel}</span>
        <span>Hover floor: {hoveredLabel}</span>
      </div>
      <div className="r3f-building-shell" aria-label={`R3F building shell: ${scene.building.name}`} />
      <div className="r3f-canvas-frame" aria-hidden="true">
        {webGlAvailable ? (
          <Canvas camera={{ position: cameraPlan.position, fov: 38, zoom: cameraPlan.zoom }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[4, 5, 4]} intensity={1.5} />
            <TowerMeshes
              scene={scene}
              selectedFloorId={selectedFloorId}
              hoveredFloorId={hoveredFloorId}
              onChooseFloor={onChooseFloor}
              onHoverFloor={setHoveredFloorId}
            />
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
            className={`r3f-floor-hitbox ${selectedFloorId === floor.id ? 'active' : ''} ${hoveredFloorId === floor.id ? 'hovered' : ''} ${floor.hasUnits ? 'has-units' : ''}`}
            onMouseEnter={() => setHoveredFloorId(floor.id)}
            onFocus={() => setHoveredFloorId(floor.id)}
            onMouseLeave={() => setHoveredFloorId(null)}
            onBlur={() => setHoveredFloorId(null)}
            onClick={() => onChooseFloor(floor.id)}
          >
            3D floor mesh: {floor.label}
          </button>
        ))}
      </div>
    </div>
  );
}
