import { lazy, Suspense } from 'react';

import type { DevelopmentFloor, DevelopmentUnit, DevelopmentViewpoint } from '../types';
import { cameraMessageForState, type ViewerScene as ViewerSceneModel, type ViewerState } from '../viewer/sceneAdapter';
import { ApartmentPlan } from './ApartmentPlan';
import { WalkModePanel } from './WalkModePanel';

const ThreeDevelopmentScene = lazy(() => import('./ThreeDevelopmentScene').then((module) => ({ default: module.ThreeDevelopmentScene })));

type Props = {
  scene: ViewerSceneModel;
  viewerState: ViewerState;
  selectedFloor: DevelopmentFloor | null;
  selectedUnit: DevelopmentUnit | null;
  selectedViewpoint: DevelopmentViewpoint | null;
  onChooseFloor: (floorId: string) => void;
  onChooseUnit: (unit: DevelopmentUnit) => void;
};

export function ViewerScene({ scene, viewerState, selectedFloor, selectedUnit, selectedViewpoint, onChooseFloor, onChooseUnit }: Props) {
  const activeWindow = selectedUnit?.window_views[0] ?? null;
  const cameraMessage = cameraMessageForState({ viewerState, selectedFloor, selectedUnit, selectedViewpoint, activeWindow });

  return (
    <div className="viewer-scene">
      <div className="state-pill">State: {viewerState}</div>
      <div className="camera-path">{cameraMessage}</div>
      <Suspense fallback={<div className="r3f-scene-shell r3f-loading">Loading R3F scene…</div>}>
        <ThreeDevelopmentScene
          scene={scene}
          viewerState={viewerState}
          selectedFloor={selectedFloor}
          selectedUnit={selectedUnit}
          selectedFloorId={selectedFloor?.id}
          onChooseFloor={onChooseFloor}
          onChooseUnit={onChooseUnit}
        />
      </Suspense>
      <div className="procedural-tower dom-fallback backup-controls" aria-label={`${scene.building.name} backup floor controls`}>
        {scene.towerFloors.map((floor) => (
          <button
            key={floor.id}
            type="button"
            aria-label={`Backup floor control: ${floor.label}`}
            className={`tower-floor ${selectedFloor?.id === floor.id ? 'active' : ''} ${floor.hasUnits ? 'has-units' : ''}`}
            onClick={() => onChooseFloor(floor.id)}
          >
            {floor.label}
          </button>
        ))}
      </div>

      {selectedUnit && <ApartmentPlan unit={selectedUnit} />}

      {viewerState === 'walk_mode' && selectedViewpoint && <WalkModePanel viewpoint={selectedViewpoint} />}
    </div>
  );
}
