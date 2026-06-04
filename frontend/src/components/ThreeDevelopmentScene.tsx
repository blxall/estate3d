import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { Vector3 } from 'three';

import type { DevelopmentFloor, DevelopmentUnit, DevelopmentViewpoint, DevelopmentWindowView } from '../types';
import {
  buildAvailabilityState,
  buildCameraControlState,
  buildCameraPlan,
  buildMaterialTheme,
  buildRoomFootprints,
  buildScenePresentationState,
  buildShowroomAssetReadiness,
  buildUnitFootprints,
  buildViewpointAnchors,
  buildWindowHotspots,
  type RoomFootprintPrimitive,
  type UnitFootprintPrimitive,
  type ViewerScene as ViewerSceneModel,
  type ViewerState,
  type WindowHotspotPrimitive,
} from '../viewer/sceneAdapter';

type Props = {
  scene: ViewerSceneModel;
  viewerState: ViewerState;
  selectedFloor?: DevelopmentFloor | null;
  selectedUnit?: DevelopmentUnit | null;
  selectedViewpoint?: DevelopmentViewpoint | null;
  activeWindow?: DevelopmentWindowView | null;
  selectedFloorId?: string | null;
  onChooseFloor: (floorId: string) => void;
  onChooseUnit: (unit: DevelopmentUnit) => void;
  onEnterWalkMode: (viewpoint: DevelopmentViewpoint) => void;
  onShowWindowView: (windowView?: DevelopmentWindowView) => void;
};

type TowerMeshesProps = Pick<Props, 'scene' | 'selectedFloorId' | 'onChooseFloor'> & {
  hoveredFloorId: string | null;
  onHoverFloor: (floorId: string | null) => void;
};

type UnitMeshesProps = {
  footprints: UnitFootprintPrimitive[];
  selectedUnitId?: string | null;
  onChooseUnitById: (unitId: string) => void;
};

type RoomMeshesProps = {
  footprints: RoomFootprintPrimitive[];
  onChooseRoomById: (roomId: string) => void;
};

type WindowHotspotMeshesProps = {
  hotspots: WindowHotspotPrimitive[];
  onChooseWindowById: (windowId: string) => void;
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
        <meshBasicMaterial color={buildMaterialTheme({ kind: 'tower-shell' }).color} opacity={buildMaterialTheme({ kind: 'tower-shell' }).opacity} transparent />
      </mesh>
      {scene.towerFloors.map((floor, index) => {
        const y = scene.towerFloors.length - index;
        const isSelected = selectedFloorId === floor.id;
        const isHovered = hoveredFloorId === floor.id;
        const material = buildMaterialTheme({ kind: 'floor', active: isSelected, hovered: isHovered, hasUnits: floor.hasUnits });
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
            <meshBasicMaterial color={material.color} opacity={material.opacity} transparent />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.2, 0.18, 1.5]} />
        <meshBasicMaterial color="#cdbfaa" />
      </mesh>
    </group>
  );
}

function UnitMeshes({ footprints, selectedUnitId, onChooseUnitById }: UnitMeshesProps) {
  return (
    <group rotation={[0.08, -0.42, 0]} position={[0, -2.4, 0]}>
      {footprints.map((unit) => {
        const isSelected = selectedUnitId === unit.id;
        const material = buildMaterialTheme({ kind: 'unit', status: unit.status, active: isSelected });
        return (
          <mesh key={unit.id} position={unit.center} onClick={() => onChooseUnitById(unit.id)}>
            <boxGeometry args={unit.size} />
            <meshBasicMaterial color={material.color} opacity={material.opacity} transparent />
          </mesh>
        );
      })}
    </group>
  );
}

function RoomMeshes({ footprints, onChooseRoomById }: RoomMeshesProps) {
  return (
    <group rotation={[0.08, -0.42, 0]} position={[0, -2.4, 0]}>
      {footprints.map((room) => {
        const material = buildMaterialTheme({ kind: 'room' });
        return (
          <mesh key={room.id} position={room.center} onClick={() => onChooseRoomById(room.id)}>
            <boxGeometry args={room.size} />
            <meshBasicMaterial color={material.color} opacity={material.opacity} transparent />
          </mesh>
        );
      })}
    </group>
  );
}

function WindowHotspotMeshes({ hotspots, onChooseWindowById }: WindowHotspotMeshesProps) {
  return (
    <group rotation={[0.08, -0.42, 0]} position={[0, -2.4, 0]}>
      {hotspots.map((hotspot) => {
        const material = buildMaterialTheme({ kind: 'window-hotspot' });
        return (
          <mesh key={hotspot.id} position={hotspot.center} onClick={() => onChooseWindowById(hotspot.id)}>
            <boxGeometry args={hotspot.size} />
            <meshBasicMaterial color={material.color} opacity={material.opacity} transparent />
          </mesh>
        );
      })}
    </group>
  );
}

function CameraController({ control }: { control: ReturnType<typeof buildCameraControlState> }) {
  const { camera } = useThree();
  const targetPosition = useMemo(() => new Vector3(...control.position), [control.key, control.position]);
  const targetLookAt = useMemo(() => new Vector3(...control.target), [control.key, control.target]);

  useFrame(() => {
    camera.position.lerp(targetPosition, control.easing);
    camera.zoom += (control.zoom - camera.zoom) * control.easing;
    camera.lookAt(targetLookAt);
    camera.updateProjectionMatrix();
  });

  return null;
}

export function ThreeDevelopmentScene({ scene, viewerState, selectedFloor, selectedUnit, selectedViewpoint, activeWindow, selectedFloorId, onChooseFloor, onChooseUnit, onEnterWalkMode, onShowWindowView }: Props) {
  const webGlAvailable = canUseWebGl();
  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);
  const selectedLabel = floorLabel(scene, selectedFloorId);
  const hoveredLabel = floorLabel(scene, hoveredFloorId);
  const cameraPlan = buildCameraPlan({ scene, viewerState, selectedFloor, selectedUnit, selectedViewpoint, activeWindow });
  const cameraControl = buildCameraControlState(cameraPlan, viewerState);
  const unitFootprints = buildUnitFootprints(selectedFloor);
  const roomFootprints = buildRoomFootprints(selectedUnit, selectedFloor);
  const viewpointAnchors = buildViewpointAnchors(selectedUnit, selectedFloor);
  const windowHotspots = buildWindowHotspots(selectedUnit, selectedFloor);
  const availability = buildAvailabilityState({ selectedFloor, selectedUnit });
  const selectedMaterial = buildMaterialTheme({
    kind: selectedUnit ? 'unit' : 'floor',
    status: selectedUnit?.status,
    active: Boolean(selectedUnit || selectedFloor),
    hasUnits: Boolean(selectedFloor?.units.length),
  });
  const presentation = buildScenePresentationState({ scene, selectedFloor, selectedUnit });
  const assetReadiness = buildShowroomAssetReadiness(scene);

  function chooseUnitById(unitId: string) {
    const unit = selectedFloor?.units.find((candidate) => candidate.id === unitId);
    if (unit) {
      onChooseUnit(unit);
    }
  }

  function chooseRoomById(roomId: string) {
    const viewpoint = selectedUnit?.viewpoints.find((candidate) => candidate.room_id === roomId) ?? selectedUnit?.viewpoints[0];
    if (viewpoint) {
      onEnterWalkMode(viewpoint);
    }
  }

  function chooseWindowById(windowId: string) {
    const windowView = selectedUnit?.window_views.find((candidate) => candidate.id === windowId);
    if (windowView) {
      onShowWindowView(windowView);
    }
  }

  return (
    <div className={`${presentation.shellClass} click-through-model-shell`} aria-label={`R3F scene slice for ${scene.building.name}`}>
      <div className="r3f-scene-meta">
        <span>R3F-ready tower geometry</span>
        <small>{webGlAvailable ? 'WebGL canvas active' : 'Semantic fallback active'}</small>
      </div>
      <div className="r3f-customer-readout" aria-label="Customer-facing scene readout">{presentation.customerReadout}</div>
      <div className="r3f-presentation-labels" aria-label="Premium 3D presentation labels">
        <span className="r3f-floor-emphasis-label">{presentation.selectedFloorLabel}</span>
        <span className="r3f-unit-emphasis-label">{presentation.selectedUnitLabel}</span>
        <span className="r3f-transition-label">{presentation.unitTransitionLabel}</span>
      </div>
      <div className={presentation.skylineClass} aria-hidden="true">
        <span className="massing-tower massing-tower-main" />
        <span className="massing-tower massing-tower-side" />
        <span className="massing-floor-selected" />
        <span className="massing-unit-selected" />
      </div>
      <div className="architectural-depth-layer source-backed-model-depth" aria-label="Source-backed architectural model depth">
        <span className="depth-massing-plane depth-massing-plane-back" />
        <span className="depth-massing-plane depth-massing-plane-mid" />
        <span className="depth-massing-plane depth-massing-plane-front" />
        <div className="facade-bay-grid" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => (
            <span key={`facade-bay-${index}`} className="facade-bay" />
          ))}
        </div>
        <span className="architectural-foreground-plane foreground-plane-1" />
        <span className="architectural-foreground-plane foreground-plane-2" />
        <span className="architectural-foreground-plane foreground-plane-3" />
        <span className="architectural-foreground-plane foreground-plane-4" />
      </div>
      <div className="source-backed-depth-readout" aria-hidden="true">{presentation.depthLayerLabel}</div>
      <div className={assetReadiness.cardClass} aria-label="Готовность исходной 3D модели">
        <span className="showroom-asset-title">{assetReadiness.label}</span>
        <span className="showroom-asset-detail">{assetReadiness.detail}</span>
      </div>
      <div className="r3f-camera-readout technical-readout collapsed-diagnostics diagnostic-chip" aria-live="polite">
        <span>Camera frame: {cameraPlan.frame}</span>
        <span>Camera target: {cameraPlan.target.join(',')}</span>
        <span>Camera position: {cameraPlan.position.join(',')}</span>
        <span>{cameraPlan.label}</span>
        <span>{cameraControl.label}</span>
        <span>Selected mesh: {selectedLabel}</span>
        <span>Hover floor: {hoveredLabel}</span>
        <span>Unit footprints: {unitFootprints.length}</span>
        <span>Room footprints: {roomFootprints.length}</span>
        <span>Active viewpoint: {selectedViewpoint?.label ?? 'none'}</span>
        <span>Window hotspots: {windowHotspots.length}</span>
        <span>Material theme: {selectedMaterial.label.replace('Material ', '').replace(':', '')} · {selectedMaterial.color} · opacity {selectedMaterial.opacity}</span>
        <span>Scene availability: units {unitFootprints.length} · viewpoints {viewpointAnchors.length} · windows {windowHotspots.length}</span>
        <span>{availability.label}</span>
      </div>
      <div className="r3f-building-shell" aria-label={`R3F building shell: ${scene.building.name}`} />
      <div className="r3f-canvas-frame" aria-hidden="true">
        {webGlAvailable ? (
          <Canvas camera={{ position: cameraPlan.position, fov: 38, zoom: cameraPlan.zoom }}>
            <CameraController control={cameraControl} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[4, 5, 4]} intensity={1.5} />
            <TowerMeshes
              scene={scene}
              selectedFloorId={selectedFloorId}
              hoveredFloorId={hoveredFloorId}
              onChooseFloor={onChooseFloor}
              onHoverFloor={setHoveredFloorId}
            />
            <UnitMeshes footprints={unitFootprints} selectedUnitId={selectedUnit?.id} onChooseUnitById={chooseUnitById} />
            <RoomMeshes footprints={roomFootprints} onChooseRoomById={chooseRoomById} />
            <WindowHotspotMeshes hotspots={windowHotspots} onChooseWindowById={chooseWindowById} />
          </Canvas>
        ) : (
          <div className="r3f-canvas-fallback">WebGL preview fallback</div>
        )}
      </div>
      <div className="r3f-model-guide customer-model-guide mobile-legible-model-guide" aria-label="Подсказка выбора этажа">
        <span className="r3f-model-guide-title">Выберите этаж на модели</span>
        <span className="r3f-model-guide-copy">Доступный 8 этаж подсвечен; вся башня остаётся интерактивной без визуальной сетки.</span>
      </div>
      <div className="r3f-floor-hitboxes tap-target-bridge browser-click-safe mobile-condensed-floor-stack floor-stack-clutter-reduced" aria-label="3D floor selection bridge">
        {scene.towerFloors.map((floor) => (
          <button
            key={floor.id}
            type="button"
            data-visible-label="hidden"
            className={`r3f-floor-hitbox tap-target-floor ${selectedFloorId === floor.id ? 'active' : ''} ${hoveredFloorId === floor.id ? 'hovered' : ''} ${floor.hasUnits ? 'has-units primary-sales-floor-target' : ''}`}
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
      <div className="r3f-unit-hitboxes" aria-label="3D unit selection bridge">
        {unitFootprints.map((unit) => (
          <button
            key={unit.id}
            type="button"
            className={`r3f-unit-hitbox ${selectedUnit?.id === unit.id ? 'active' : ''}`}
            onClick={() => chooseUnitById(unit.id)}
          >
            3D unit mesh: {unit.label}
          </button>
        ))}
      </div>
      <div className="r3f-unit-footprints" aria-label="R3F unit footprint readout">
        {unitFootprints.map((unit) => (
          <span key={unit.id}>Unit footprint: {unit.label} · {unit.status}</span>
        ))}
      </div>
      <div className="r3f-room-hitboxes" aria-label="3D room selection bridge">
        {roomFootprints.map((room) => (
          <button key={room.id} type="button" className="r3f-room-hitbox" onClick={() => chooseRoomById(room.id)}>
            3D room mesh: {room.label}
          </button>
        ))}
      </div>
      <div className="r3f-room-footprints" aria-label="R3F room footprint readout">
        {roomFootprints.map((room) => (
          <span key={room.id}>Room footprint: {room.label} · {room.areaM2} м²</span>
        ))}
      </div>
      <div className="r3f-viewpoint-anchors" aria-label="R3F viewpoint anchor readout">
        {viewpointAnchors.map((viewpoint) => (
          <span key={viewpoint.id}>Viewpoint anchor: {viewpoint.label} · {viewpoint.target.join(',')}</span>
        ))}
      </div>
      <div className="r3f-window-hotspots" aria-label="3D window hotspot bridge">
        {windowHotspots.map((hotspot) => (
          <button key={hotspot.id} type="button" className="r3f-window-hotspot" onClick={() => chooseWindowById(hotspot.id)}>
            3D window hotspot: {hotspot.label}
          </button>
        ))}
      </div>
      <div className="r3f-window-hotspot-readout" aria-label="R3F window hotspot readout">
        {windowHotspots.map((hotspot) => (
          <span key={hotspot.id}>Window hotspot: {hotspot.label} · {hotspot.directionDegrees}°</span>
        ))}
      </div>
    </div>
  );
}
