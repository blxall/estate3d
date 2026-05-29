import { useMemo, useState } from 'react';

import { submitDevelopmentLead } from '../api';
import type { DevelopmentFloor, DevelopmentUnit, DevelopmentViewerPayload, DevelopmentViewpoint } from '../types';
import { buildViewerScene, type ViewerState } from '../viewer/sceneAdapter';
import { ViewerHud } from './ViewerHud';
import { ViewerScene } from './ViewerScene';

type Props = {
  development: DevelopmentViewerPayload;
};

export function DevelopmentViewer({ development }: Props) {
  const building = development.buildings[0];
  const scene = useMemo(() => buildViewerScene(development), [development]);
  const [viewerState, setViewerState] = useState<ViewerState>('development_overview');
  const [selectedFloor, setSelectedFloor] = useState<DevelopmentFloor | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<DevelopmentUnit | null>(null);
  const [selectedViewpoint, setSelectedViewpoint] = useState<DevelopmentViewpoint | null>(null);
  const [leadMessage, setLeadMessage] = useState('');

  const activeWindow = selectedUnit?.window_views[0] ?? null;
  const firstViewpoint = selectedUnit?.viewpoints[0] ?? null;

  function chooseFloor(floorId: string) {
    const floor = building.floors.find((candidate) => candidate.id === floorId) ?? null;
    setSelectedFloor(floor);
    setSelectedUnit(null);
    setSelectedViewpoint(null);
    setLeadMessage('');
    setViewerState('floor_focus');
  }

  function chooseUnit(unit: DevelopmentUnit) {
    setSelectedUnit(unit);
    setSelectedViewpoint(null);
    setLeadMessage('');
    setViewerState('unit_top_down');
  }

  function enterWalkMode(viewpoint: DevelopmentViewpoint) {
    setSelectedViewpoint(viewpoint);
    setLeadMessage('');
    setViewerState('walk_mode');
  }

  function showWindowView() {
    setViewerState('window_view');
    setLeadMessage('');
  }

  async function submitLead() {
    if (!selectedFloor || !selectedUnit) {
      setLeadMessage('Выберите этаж и квартиру перед заявкой');
      return;
    }

    setLeadMessage('Отправляем заявку менеджеру…');
    try {
      const lead = await submitDevelopmentLead('demo-premium', {
        building_id: building.id,
        floor_id: selectedFloor.id,
        unit_id: selectedUnit.id,
        viewer_state: viewerState,
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        message: 'Viewer lead from Estate3D premium demo',
      });
      setLeadMessage(`Заявка отправлена: #${lead.id} · ${lead.development_name}, ${building.name}, ${selectedFloor.label}, квартира ${lead.unit_number}`);
    } catch {
      setLeadMessage('Не удалось отправить заявку. Попробуйте еще раз.');
    }
  }

  return (
    <main className={`development-viewer state-${viewerState}`}>
      <section className="viewer-hero">
        <p className="eyebrow">Premium Interactive Development Viewer</p>
        <h1>{development.name}</h1>
        <p className="viewer-tagline">{development.hero.tagline}</p>
        <p>{development.hero.lead}</p>
      </section>

      <section className="viewer-stage" aria-label="Интерактивная 3D сцена ЖК">
        <ViewerScene
          scene={scene}
          viewerState={viewerState}
          selectedFloor={selectedFloor}
          selectedUnit={selectedUnit}
          selectedViewpoint={selectedViewpoint}
          onChooseFloor={chooseFloor}
          onChooseUnit={chooseUnit}
        />
        <ViewerHud
          building={building}
          selectedFloor={selectedFloor}
          selectedUnit={selectedUnit}
          activeWindow={activeWindow}
          firstViewpoint={firstViewpoint}
          viewerState={viewerState}
          leadMessage={leadMessage}
          onChooseUnit={chooseUnit}
          onEnterWalkMode={enterWalkMode}
          onShowWindowView={showWindowView}
          onSubmitLead={submitLead}
        />
      </section>
    </main>
  );
}
