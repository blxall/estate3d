import { useEffect, useMemo, useState } from 'react';

import { submitDevelopmentLead } from '../api';
import type { DevelopmentFloor, DevelopmentUnit, DevelopmentViewerPayload, DevelopmentViewpoint, DevelopmentWindowView } from '../types';
import { buildLeadContextSummary, buildResponsiveHudState, buildViewerDeepLinkSearch, buildViewerDeepLinkState, buildViewerScene, type ViewerState } from '../viewer/sceneAdapter';
import { ViewerHud } from './ViewerHud';
import { ViewerScene } from './ViewerScene';

type Props = {
  development: DevelopmentViewerPayload;
};

export function DevelopmentViewer({ development }: Props) {
  const building = development.buildings[0];
  const scene = useMemo(() => buildViewerScene(development), [development]);
  const deepLinkState = useMemo(
    () => buildViewerDeepLinkState({ building, search: typeof window === 'undefined' ? '' : window.location.search }),
    [building],
  );
  const initialFloor = useMemo(() => building.floors.find((candidate) => candidate.id === deepLinkState.selectedFloorId) ?? null, [building.floors, deepLinkState.selectedFloorId]);
  const initialUnit = useMemo(() => initialFloor?.units.find((candidate) => candidate.id === deepLinkState.selectedUnitId) ?? null, [initialFloor, deepLinkState.selectedUnitId]);
  const initialViewpoint = useMemo(() => initialUnit?.viewpoints.find((candidate) => candidate.id === deepLinkState.selectedViewpointId) ?? null, [initialUnit, deepLinkState.selectedViewpointId]);
  const initialWindow = useMemo(() => initialUnit?.window_views.find((candidate) => candidate.id === deepLinkState.activeWindowId) ?? null, [initialUnit, deepLinkState.activeWindowId]);
  const [viewerState, setViewerState] = useState<ViewerState>(deepLinkState.viewerState);
  const [selectedFloor, setSelectedFloor] = useState<DevelopmentFloor | null>(initialFloor);
  const [selectedUnit, setSelectedUnit] = useState<DevelopmentUnit | null>(initialUnit);
  const [selectedViewpoint, setSelectedViewpoint] = useState<DevelopmentViewpoint | null>(initialViewpoint);
  const [activeWindow, setActiveWindow] = useState<DevelopmentWindowView | null>(initialWindow);
  const [leadMessage, setLeadMessage] = useState('');

  const firstViewpoint = selectedUnit?.viewpoints[0] ?? null;
  const firstWindow = selectedUnit?.window_views[0] ?? null;
  const responsiveStage = buildResponsiveHudState({
    viewportWidth: typeof window === 'undefined' ? 1180 : window.innerWidth,
    viewerState,
    hasSelectedUnit: Boolean(selectedUnit),
    hasLeadContext: Boolean(selectedUnit),
  });
  const shareLink = `${typeof window === 'undefined' ? '/developments/demo-premium/viewer' : window.location.pathname}${buildViewerDeepLinkSearch({
    selectedFloor,
    selectedUnit,
    selectedViewpoint,
    activeWindow,
    viewerState,
  })}`;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.history.replaceState({}, '', shareLink);
  }, [shareLink]);

  function chooseFloor(floorId: string) {
    const floor = building.floors.find((candidate) => candidate.id === floorId) ?? null;
    setSelectedFloor(floor);
    setSelectedUnit(null);
    setSelectedViewpoint(null);
    setActiveWindow(null);
    setLeadMessage('');
    setViewerState('floor_focus');
  }

  function chooseUnit(unit: DevelopmentUnit) {
    setSelectedUnit(unit);
    setSelectedViewpoint(null);
    setActiveWindow(null);
    setLeadMessage('');
    setViewerState('unit_top_down');
  }

  function enterWalkMode(viewpoint: DevelopmentViewpoint) {
    setSelectedViewpoint(viewpoint);
    setActiveWindow(null);
    setLeadMessage('');
    setViewerState('walk_mode');
  }

  function showWindowView(windowView?: DevelopmentWindowView) {
    setActiveWindow(windowView ?? firstWindow ?? null);
    setLeadMessage('');
    setViewerState('window_view');
  }

  async function submitLead() {
    if (!selectedFloor || !selectedUnit) {
      setLeadMessage('Выберите этаж и квартиру перед заявкой');
      return;
    }

    setLeadMessage('Отправляем заявку менеджеру…');
    const leadContext = buildLeadContextSummary({
      development,
      building,
      selectedFloor,
      selectedUnit,
      selectedViewpoint,
      activeWindow,
      viewerState,
    });
    try {
      const lead = await submitDevelopmentLead('demo-premium', {
        building_id: building.id,
        floor_id: selectedFloor.id,
        unit_id: selectedUnit.id,
        viewer_state: viewerState,
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        message: leadContext.message,
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

      <section className={responsiveStage.stageClass} aria-label="Интерактивная 3D сцена ЖК">
        <p className="deep-link-readout">{deepLinkState.label}</p>
        <p className="share-link-readout">Share link: {shareLink}</p>
        <ViewerScene
          scene={scene}
          viewerState={viewerState}
          selectedFloor={selectedFloor}
          selectedUnit={selectedUnit}
          selectedViewpoint={selectedViewpoint}
          activeWindow={activeWindow}
          onChooseFloor={chooseFloor}
          onChooseUnit={chooseUnit}
          onEnterWalkMode={enterWalkMode}
          onShowWindowView={showWindowView}
        />
        <ViewerHud
          development={development}
          building={building}
          selectedFloor={selectedFloor}
          selectedUnit={selectedUnit}
          selectedViewpoint={selectedViewpoint}
          activeWindow={activeWindow ?? firstWindow}
          firstViewpoint={firstViewpoint}
          viewerState={viewerState}
          leadMessage={leadMessage}
          shareLink={shareLink}
          onChooseUnit={chooseUnit}
          onEnterWalkMode={enterWalkMode}
          onShowWindowView={() => showWindowView()}
          onSubmitLead={submitLead}
        />
      </section>
    </main>
  );
}
