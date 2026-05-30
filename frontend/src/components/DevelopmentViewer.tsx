import { useEffect, useMemo, useState } from 'react';

import { submitDevelopmentLead } from '../api';
import type { DevelopmentFloor, DevelopmentUnit, DevelopmentViewerPayload, DevelopmentViewpoint, DevelopmentWindowView } from '../types';
import { buildBrokerNextStepScript, buildLeadContextSummary, buildInteractionTrailSummary, buildLeadExportPayload, buildLeadHandoffDigest, buildLeadHandoffPersistenceState, buildLeadSuccessSummary, buildManagerFollowUpChecklist, buildResponsiveHudState, buildShareHandoffSummary, buildViewerAnalyticsEvent, buildViewerDeepLinkSearch, buildViewerDeepLinkState, buildViewerScene, type LeadCtaStatus, type LeadSuccessSummary, type ViewerAnalyticsAction, type ViewerState } from '../viewer/sceneAdapter';
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
  const [leadStatus, setLeadStatus] = useState<LeadCtaStatus>('idle');
  const [leadSuccess, setLeadSuccess] = useState<LeadSuccessSummary | null>(null);
  const [analyticsLabels, setAnalyticsLabels] = useState<string[]>([]);

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
  const interactionTrail = buildInteractionTrailSummary(analyticsLabels);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.history.replaceState({}, '', shareLink);
  }, [shareLink]);

  function trackViewerEvent({
    action,
    floor = selectedFloor,
    unit = selectedUnit,
    viewpoint = selectedViewpoint,
    windowView = activeWindow,
    state = viewerState,
  }: {
    action: ViewerAnalyticsAction;
    floor?: DevelopmentFloor | null;
    unit?: DevelopmentUnit | null;
    viewpoint?: DevelopmentViewpoint | null;
    windowView?: DevelopmentWindowView | null;
    state?: ViewerState;
  }) {
    const event = buildViewerAnalyticsEvent({
      action,
      development,
      building,
      selectedFloor: floor,
      selectedUnit: unit,
      selectedViewpoint: viewpoint,
      activeWindow: windowView,
      viewerState: state,
    });
    setAnalyticsLabels((labels) => [...labels.slice(-5), event.label]);
  }

  function chooseFloor(floorId: string) {
    const floor = building.floors.find((candidate) => candidate.id === floorId) ?? null;
    trackViewerEvent({ action: 'select_floor', floor, unit: null, viewpoint: null, windowView: null, state: 'floor_focus' });
    setSelectedFloor(floor);
    setSelectedUnit(null);
    setSelectedViewpoint(null);
    setActiveWindow(null);
    setLeadMessage('');
    setLeadSuccess(null);
    setLeadStatus('idle');
    setViewerState('floor_focus');
  }

  function chooseUnit(unit: DevelopmentUnit) {
    trackViewerEvent({ action: 'select_unit', unit, viewpoint: null, windowView: null, state: 'unit_top_down' });
    setSelectedUnit(unit);
    setSelectedViewpoint(null);
    setActiveWindow(null);
    setLeadMessage('');
    setLeadSuccess(null);
    setLeadStatus('idle');
    setViewerState('unit_top_down');
  }

  function enterWalkMode(viewpoint: DevelopmentViewpoint) {
    trackViewerEvent({ action: 'enter_walk_mode', viewpoint, windowView: null, state: 'walk_mode' });
    setSelectedViewpoint(viewpoint);
    setActiveWindow(null);
    setLeadMessage('');
    setLeadSuccess(null);
    setLeadStatus('idle');
    setViewerState('walk_mode');
  }

  function showWindowView(windowView?: DevelopmentWindowView) {
    const nextWindow = windowView ?? firstWindow ?? null;
    trackViewerEvent({ action: 'open_window_view', windowView: nextWindow, state: 'window_view' });
    setActiveWindow(nextWindow);
    setLeadMessage('');
    setLeadSuccess(null);
    setLeadStatus('idle');
    setViewerState('window_view');
  }

  async function submitLead() {
    if (!selectedFloor || !selectedUnit) {
      setLeadMessage('Выберите этаж и квартиру перед заявкой');
      setLeadStatus('error');
      return;
    }

    setLeadMessage('Отправляем заявку менеджеру…');
    setLeadStatus('sending');
    setLeadSuccess(null);
    trackViewerEvent({ action: 'lead_click' });
    const leadContext = buildLeadContextSummary({
      development,
      building,
      selectedFloor,
      selectedUnit,
      selectedViewpoint,
      activeWindow,
      viewerState,
    });
    const shareHandoff = buildShareHandoffSummary({ selectedFloor, selectedUnit, viewerState, shareLink });
    const managerFollowUp = buildManagerFollowUpChecklist({
      leadContext,
      interactionTrail,
      shareHandoff,
      selectedUnit,
    });
    const brokerScript = buildBrokerNextStepScript({ leadContext, managerFollowUp, shareHandoff, selectedUnit });
    const leadHandoffDigest = buildLeadHandoffDigest({ leadContext, interactionTrail, managerFollowUp, brokerScript, shareHandoff, selectedUnit });
    const exportPersistence = buildLeadHandoffPersistenceState({ digest: leadHandoffDigest, status: 'success' });
    const leadExportPayload = buildLeadExportPayload({ leadContext, shareHandoff, digest: leadHandoffDigest, persistence: exportPersistence, managerFollowUp, brokerScript });
    try {
      const leadMessageWithTrail = [leadContext.message, interactionTrail?.managerNote, managerFollowUp?.copy, brokerScript?.managerNote, leadHandoffDigest?.managerOneLiner, leadExportPayload?.managerOneLiner].filter(Boolean).join(' ');
      const lead = await submitDevelopmentLead('demo-premium', {
        building_id: building.id,
        floor_id: selectedFloor.id,
        unit_id: selectedUnit.id,
        viewer_state: viewerState,
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        message: leadMessageWithTrail,
      });
      setLeadSuccess(buildLeadSuccessSummary({ leadId: lead.id, selectedFloor, selectedUnit, viewerState, shareLink }));
      setLeadMessage('');
      setLeadStatus('success');
      trackViewerEvent({ action: 'lead_success' });
    } catch {
      setLeadMessage('Не удалось отправить заявку. Попробуйте еще раз.');
      setLeadStatus('error');
      trackViewerEvent({ action: 'lead_error' });
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
        <div className="analytics-readout" aria-label="Premium viewer analytics readout">
          {analyticsLabels.map((label) => <p key={label}>{label}</p>)}
        </div>
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
          leadStatus={leadStatus}
          leadSuccess={leadSuccess}
          interactionTrail={interactionTrail}
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
