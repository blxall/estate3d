import type { DevelopmentFloor, DevelopmentUnit, DevelopmentViewpoint } from '../types';
import { cameraMessageForState, type ViewerScene as ViewerSceneModel, type ViewerState } from '../viewer/sceneAdapter';
import { ApartmentPlan } from './ApartmentPlan';
import { WalkModePanel } from './WalkModePanel';

type Props = {
  scene: ViewerSceneModel;
  viewerState: ViewerState;
  selectedFloor: DevelopmentFloor | null;
  selectedUnit: DevelopmentUnit | null;
  selectedViewpoint: DevelopmentViewpoint | null;
  onChooseFloor: (floorId: string) => void;
};

export function ViewerScene({ scene, viewerState, selectedFloor, selectedUnit, selectedViewpoint, onChooseFloor }: Props) {
  const activeWindow = selectedUnit?.window_views[0] ?? null;
  const cameraMessage = cameraMessageForState({ viewerState, selectedFloor, selectedUnit, selectedViewpoint, activeWindow });

  return (
    <div className="viewer-scene">
      <div className="state-pill">State: {viewerState}</div>
      <div className="camera-path">{cameraMessage}</div>
      <div className="procedural-tower" aria-label={scene.building.name}>
        {scene.towerFloors.map((floor) => (
          <button
            key={floor.id}
            type="button"
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
