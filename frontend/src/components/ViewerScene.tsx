import { lazy, Suspense } from 'react';

import type { DevelopmentFloor, DevelopmentUnit, DevelopmentViewpoint, DevelopmentWindowView } from '../types';
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
  activeWindow: DevelopmentWindowView | null;
  onChooseFloor: (floorId: string) => void;
  onChooseUnit: (unit: DevelopmentUnit) => void;
  onEnterWalkMode: (viewpoint: DevelopmentViewpoint) => void;
  onShowWindowView: (windowView?: DevelopmentWindowView) => void;
};

export function ViewerScene({
  scene,
  viewerState,
  selectedFloor,
  selectedUnit,
  selectedViewpoint,
  activeWindow,
  onChooseFloor,
  onChooseUnit,
  onEnterWalkMode,
  onShowWindowView,
}: Props) {
  const cameraMessage = cameraMessageForState({ viewerState, selectedFloor, selectedUnit, selectedViewpoint, activeWindow });

  return (
    <div className="viewer-scene immersive-model-card warm-gallery-card">
      <div className="showroom-overlay" aria-label="Коммерческий сценарий просмотра">
        <span className="showroom-step">ЖК → корпус → этаж → квартира</span>
        <strong className="showroom-title">{selectedFloor ? selectedFloor.label : 'Общий вид комплекса'}</strong>
        <span className="showroom-copy">
          {selectedUnit
            ? `Квартира ${selectedUnit.number}: планировка, прогулка и заявка менеджеру.`
            : selectedFloor
              ? 'Выберите квартиру на этаже, чтобы открыть план и точки просмотра.'
              : 'Выберите подсвеченный этаж, чтобы перейти к квартирам и виду из окна.'}
        </span>
      </div>
      <div className="state-pill technical-readout">State: {viewerState}</div>
      <div className="camera-path">{cameraMessage}</div>
      <Suspense fallback={<div className="r3f-scene-shell warm-model-shell r3f-loading">Loading R3F scene…</div>}>
        <ThreeDevelopmentScene
          scene={scene}
          viewerState={viewerState}
          selectedFloor={selectedFloor}
          selectedUnit={selectedUnit}
          selectedViewpoint={selectedViewpoint}
          activeWindow={activeWindow}
          selectedFloorId={selectedFloor?.id}
          onChooseFloor={onChooseFloor}
          onChooseUnit={onChooseUnit}
          onEnterWalkMode={onEnterWalkMode}
          onShowWindowView={onShowWindowView}
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
