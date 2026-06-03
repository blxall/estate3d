import type { DevelopmentBuilding, DevelopmentFloor, DevelopmentUnit, DevelopmentViewerPayload, DevelopmentViewpoint, DevelopmentWindowView } from '../types';
import { buildAvailabilityState, buildBrokerNextStepScript, buildLeadContextSummary, buildLeadHandoffDigest, buildManagerFollowUpChecklist, buildResponsiveHudState, buildShareHandoffSummary, buildUnitCard, polygonPoints, type CrmCopyIntentSummary, type InteractionTrailSummary, type LeadContextSummary, type LeadCtaStatus, type LeadSuccessSummary, type ViewerState } from '../viewer/sceneAdapter';
import { LeadCta } from './LeadCta';

type Props = {
  development: DevelopmentViewerPayload;
  building: DevelopmentBuilding;
  selectedFloor: DevelopmentFloor | null;
  selectedUnit: DevelopmentUnit | null;
  selectedViewpoint: DevelopmentViewpoint | null;
  activeWindow: DevelopmentWindowView | null;
  firstViewpoint: DevelopmentViewpoint | null;
  viewerState: ViewerState;
  leadMessage: string;
  leadStatus: LeadCtaStatus;
  leadSuccess: LeadSuccessSummary | null;
  interactionTrail: InteractionTrailSummary | null;
  shareLink: string;
  onChooseUnit: (unit: DevelopmentUnit) => void;
  onEnterWalkMode: (viewpoint: DevelopmentViewpoint) => void;
  onShowWindowView: () => void;
  onSubmitLead: () => void;
  onCrmCopyIntent: (summary: CrmCopyIntentSummary) => void;
};

export function ViewerHud({
  development,
  building,
  selectedFloor,
  selectedUnit,
  selectedViewpoint,
  activeWindow,
  firstViewpoint,
  viewerState,
  leadMessage,
  leadStatus,
  leadSuccess,
  interactionTrail,
  shareLink,
  onChooseUnit,
  onEnterWalkMode,
  onShowWindowView,
  onSubmitLead,
  onCrmCopyIntent,
}: Props) {
  const availability = buildAvailabilityState({ selectedFloor, selectedUnit });
  const unitCards = selectedFloor?.units.map((unit) => ({ unit, card: buildUnitCard({ floor: selectedFloor, unit, active: selectedUnit?.id === unit.id }) })) ?? [];
  const leadContext: LeadContextSummary | null = selectedUnit
    ? buildLeadContextSummary({
        development,
        building,
        selectedFloor,
        selectedUnit,
        selectedViewpoint,
        activeWindow: viewerState === 'window_view' ? activeWindow : null,
        viewerState,
      })
    : null;
  const responsiveHud = buildResponsiveHudState({
    viewportWidth: typeof window === 'undefined' ? 1180 : window.innerWidth,
    viewerState,
    hasSelectedUnit: Boolean(selectedUnit),
    hasLeadContext: Boolean(leadContext),
  });
  const shareHandoff = buildShareHandoffSummary({ selectedFloor, selectedUnit, viewerState, shareLink });
  const managerFollowUp = buildManagerFollowUpChecklist({ leadContext, interactionTrail, shareHandoff, selectedUnit });
  const brokerScript = buildBrokerNextStepScript({ leadContext, managerFollowUp, shareHandoff, selectedUnit });
  const leadHandoffDigest = buildLeadHandoffDigest({ leadContext, interactionTrail, managerFollowUp, brokerScript, shareHandoff, selectedUnit });

  return (
    <aside className={`${responsiveHud.hudClass} sales-hud warm-sales-hud`}>
      <p className="responsive-hud-readout">{responsiveHud.label}</p>
      <p className="eyebrow">{building.name}</p>
      <h2>{selectedFloor ? selectedFloor.label : 'Выберите этаж'}</h2>
      {!selectedFloor && <p>Нажмите на 8 этаж, чтобы увидеть доступные квартиры и перейти в режим плана.</p>}

      {(availability.state === 'empty-floor' || availability.state === 'no-walkthrough-media' || availability.state === 'unavailable-unit') && (
        <div className={`viewer-empty-state ${availability.state}`}>
          <p>{availability.hudMessage}</p>
        </div>
      )}

      {selectedFloor && selectedFloor.units.length === 0 && availability.state !== 'empty-floor' && <p>Для демо наполнен 8 этаж. Остальные этажи показывают механику выбора.</p>}

      {selectedFloor && selectedFloor.units.length > 0 && (
        <div className="unit-list">
          {unitCards.map(({ unit, card }) => (
            <button key={unit.id} type="button" onClick={() => onChooseUnit(unit)} className={selectedUnit?.id === unit.id ? 'active' : ''} aria-label={card.ariaLabel}>
              <span>Unit card: {card.title} · {card.subtitle} · {card.statusBadge}</span>
              <small className={`unit-status ${card.statusTone}`}>{card.statusBadge}</small>
              <small>{card.availabilityCopy}</small>
              {card.selectedLabel && <strong>{card.selectedLabel}</strong>}
            </button>
          ))}
        </div>
      )}

      {selectedUnit && (
        <div className="unit-plan">
          <h3>Top-down план квартиры {selectedUnit.number}</h3>
          <div className="room-grid">
            {selectedUnit.rooms.map((room) => (
              <div key={room.id} className="room-card">
                <strong>{room.name}</strong>
                <span>{room.area_m2} м²</span>
                {room.polygon.length > 0 && <small>Room polygon: {polygonPoints(room)}</small>}
              </div>
            ))}
          </div>
          {firstViewpoint && (
            <button type="button" className="walk-button" onClick={() => onEnterWalkMode(firstViewpoint)}>
              {firstViewpoint.label}
            </button>
          )}
          {activeWindow && (
            <button type="button" className="window-button" onClick={onShowWindowView}>
              {activeWindow.label}
            </button>
          )}
        </div>
      )}

      {viewerState === 'window_view' && activeWindow && (
        <div className="window-view-card">
          <p className="eyebrow">Панорама из окна</p>
          <h3>{activeWindow.label}</h3>
          <p>Заготовленный вид: {activeWindow.image_url}</p>
          <p>Направление камеры: {activeWindow.direction_degrees}°</p>
        </div>
      )}

      {selectedUnit && <LeadCta leadMessage={leadMessage} leadStatus={leadStatus} leadContext={leadContext} leadSuccess={leadSuccess} interactionTrail={interactionTrail} shareHandoff={shareHandoff} managerFollowUp={managerFollowUp} brokerScript={brokerScript} leadHandoffDigest={leadHandoffDigest} onSubmit={onSubmitLead} onCrmCopyIntent={onCrmCopyIntent} />}
    </aside>
  );
}
