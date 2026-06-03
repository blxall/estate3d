import type {
  DevelopmentBuilding,
  DevelopmentFloor,
  DevelopmentRoom,
  DevelopmentUnit,
  DevelopmentViewerPayload,
  DevelopmentViewpoint,
  DevelopmentWindowView,
} from '../types';

export type ViewerState = 'development_overview' | 'floor_focus' | 'unit_top_down' | 'walk_mode' | 'window_view';

export type TowerFloorPrimitive = {
  id: string;
  level: number;
  label: string;
  elevation: number;
  hasUnits: boolean;
};

export type UnitPrimitive = {
  id: string;
  number: string;
  areaM2: number;
  roomsCount: number;
  price: string;
  status: string;
};

export type ViewerScene = {
  developmentId: string;
  building: {
    id: string;
    name: string;
    model: Record<string, unknown>;
  };
  towerFloors: TowerFloorPrimitive[];
  unitsByFloor: Record<string, UnitPrimitive[]>;
};

export type CameraPlan = {
  frame: string;
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  label: string;
};

export type CameraControlState = {
  key: string;
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  easing: number;
  animationMs: number;
  controlsEnabled: boolean;
  label: string;
};

export type MaterialKind = 'tower-shell' | 'floor' | 'unit' | 'room' | 'window-hotspot';

export type MaterialTheme = {
  color: string;
  opacity: number;
  emissive: string;
  metalness: number;
  roughness: number;
  label: string;
};

export type ScenePresentationState = {
  shellClass: string;
  skylineClass: string;
  selectedFloorLabel: string;
  selectedUnitLabel: string;
  unitTransitionLabel: string;
  customerReadout: string;
  debugVisibleByDefault: boolean;
};

export type EditorialShowroomDirection = {
  directionName: string;
  pageClass: string;
  heroClass: string;
  sceneClass: string;
  hudClass: string;
  diagnosticClass: string;
  palette: {
    paper: string;
    ink: string;
    linen: string;
    clay: string;
    glass: string;
  };
  references: string[];
  headline: string;
  stageLabel: string;
  forbid: string[];
};

export type AvailabilityState = {
  state: 'overview' | 'empty-floor' | 'floor-ready' | 'unit-ready' | 'no-walkthrough-media' | 'unavailable-unit';
  unitCount: number;
  viewpointCount: number;
  windowCount: number;
  canChooseUnit: boolean;
  canWalk: boolean;
  canOpenWindow: boolean;
  label: string;
  hudMessage: string;
};

export type UnitCard = {
  title: string;
  subtitle: string;
  statusBadge: string;
  statusTone: string;
  availabilityCopy: string;
  ariaLabel: string;
  selectedLabel: string;
};

export type LeadContextSummary = {
  label: string;
  message: string;
};

export type ShareHandoffSummary = {
  label: string;
  copy: string;
  ariaLabel: string;
  cardClass: string;
  copyClass: string;
  buttonClass: string;
};

export type LeadSuccessSummary = {
  label: string;
  nextAction: string;
  cardClass: string;
};

export type InteractionTrailSummary = {
  label: string;
  copy: string;
  managerNote: string;
  cardClass: string;
};

export type ManagerFollowUpChecklist = {
  label: string;
  items: string[];
  copy: string;
  cardClass: string;
};

export type BrokerNextStepScript = {
  label: string;
  opener: string;
  clientNextStep: string;
  managerNote: string;
  cardClass: string;
};

export type LeadHandoffDigest = {
  label: string;
  recap: string;
  managerOneLiner: string;
  cardClass: string;
};

export type LeadHandoffPersistenceState = {
  label: string;
  copy: string;
  badge: string;
  cardClass: string;
};

export type LeadExportPayload = {
  label: string;
  copy: string;
  managerOneLiner: string;
  cardClass: string;
};

export type GroupedLeadExportFields = {
  label: string;
  groups: { title: string; rows: string[] }[];
  cardClass: string;
};

export type CrmExportAction = {
  label: string;
  buttonLabel: string;
  ariaLabel: string;
  plainText: string;
  cardClass: string;
  textClass: string;
  buttonClass: string;
};

export type CrmCopyIntentSummary = {
  analyticsAction: 'crm_copy_success' | 'crm_copy_error';
  label: string;
  managerNote: string;
  cardClass: string;
};

export type MobileCrmHandoffState = {
  mode: 'mobile' | 'desktop';
  label: string;
  stackClass: string;
  actionCardClass: string;
  textClass: string;
  auditClass: string;
};

export type LeadCtaStatus = 'idle' | 'sending' | 'success' | 'error';

export type LeadCtaState = {
  status: LeadCtaStatus;
  buttonDisabled: boolean;
  buttonClass: string;
  feedbackClass: string;
  buttonLabel: string;
};

export type ViewerAnalyticsAction = 'select_floor' | 'select_unit' | 'enter_walk_mode' | 'open_window_view' | 'lead_click' | 'lead_success' | 'lead_error' | 'crm_copy_success' | 'crm_copy_error';

export type ViewerAnalyticsEvent = {
  eventName: string;
  label: string;
  payload: Record<string, string>;
};

export type ResponsiveHudState = {
  mode: 'mobile' | 'desktop';
  stageClass: string;
  hudClass: string;
  label: string;
};

export type ViewerDeepLinkState = {
  viewerState: ViewerState;
  selectedFloorId: string | null;
  selectedUnitId: string | null;
  selectedViewpointId: string | null;
  activeWindowId: string | null;
  label: string;
};

export type UnitFootprintPrimitive = {
  id: string;
  number: string;
  label: string;
  status: string;
  center: [number, number, number];
  size: [number, number, number];
};

export type RoomFootprintPrimitive = {
  id: string;
  name: string;
  label: string;
  areaM2: number;
  center: [number, number, number];
  size: [number, number, number];
};

export type WindowHotspotPrimitive = {
  id: string;
  roomId: string;
  label: string;
  directionDegrees: number;
  center: [number, number, number];
  size: [number, number, number];
};

export type ViewpointAnchorPrimitive = {
  id: string;
  roomId: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
};

export function buildAvailabilityState({
  selectedFloor,
  selectedUnit,
}: {
  selectedFloor?: DevelopmentFloor | null;
  selectedUnit?: DevelopmentUnit | null;
}): AvailabilityState {
  const unitCount = selectedFloor?.units.length ?? 0;
  const viewpointCount = selectedUnit?.viewpoints.length ?? 0;
  const windowCount = selectedUnit?.window_views.length ?? 0;
  const unavailableUnit = selectedUnit?.status === 'sold' || selectedUnit?.status === 'hidden';
  const state: AvailabilityState['state'] = !selectedFloor
    ? 'overview'
    : unitCount === 0
      ? 'empty-floor'
      : selectedUnit && unavailableUnit
        ? 'unavailable-unit'
        : selectedUnit && viewpointCount === 0 && windowCount === 0
          ? 'no-walkthrough-media'
          : selectedUnit
            ? 'unit-ready'
            : 'floor-ready';
  const canChooseUnit = Boolean(selectedFloor && unitCount > 0 && !unavailableUnit);
  const canWalk = Boolean(selectedUnit && viewpointCount > 0 && !unavailableUnit);
  const canOpenWindow = Boolean(selectedUnit && windowCount > 0 && !unavailableUnit);
  const label = `Availability: ${state.replace(/-/g, ' ')} · units ${unitCount} · viewpoints ${viewpointCount} · windows ${windowCount}`;

  if (state === 'empty-floor') {
    return {
      state,
      unitCount,
      viewpointCount,
      windowCount,
      canChooseUnit,
      canWalk,
      canOpenWindow,
      label,
      hudMessage: 'На этом этаже пока нет доступных квартир — покажите другой этаж или оставьте заявку менеджеру.',
    };
  }
  if (state === 'unavailable-unit') {
    return {
      state,
      unitCount,
      viewpointCount,
      windowCount,
      canChooseUnit,
      canWalk,
      canOpenWindow,
      label,
      hudMessage: `Квартира ${selectedUnit?.number} сейчас недоступна для выбора, но её можно оставить в заявке менеджеру.`,
    };
  }
  if (state === 'no-walkthrough-media') {
    return {
      state,
      unitCount,
      viewpointCount,
      windowCount,
      canChooseUnit,
      canWalk,
      canOpenWindow,
      label,
      hudMessage: `Для квартиры ${selectedUnit?.number} пока нет точек прогулки или видов из окна — покажите планировку и соберите заявку.`,
    };
  }
  return {
    state,
    unitCount,
    viewpointCount,
    windowCount,
    canChooseUnit,
    canWalk,
    canOpenWindow,
    label,
    hudMessage: state === 'floor-ready' ? 'Выберите доступную квартиру на этаже, чтобы открыть планировку.' : 'Интерактивный просмотр готов: планировка, прогулка и виды из окна доступны.',
  };
}

export function buildUnitCard({ floor, unit, active = false }: { floor: DevelopmentFloor; unit: DevelopmentUnit; active?: boolean }): UnitCard {
  const statusCopy: Record<string, { badge: string; tone: string; copy: string }> = {
    available: {
      badge: 'Доступна',
      tone: 'available',
      copy: unit.viewpoints.length > 0 || unit.window_views.length > 0 ? 'Готова к просмотру: планировка, прогулка и вид из окна доступны.' : 'Доступна для заявки: покажите планировку и уточните детали у менеджера.',
    },
    reserved: {
      badge: 'Забронирована',
      tone: 'reserved',
      copy: `В резерве — менеджер уточнит статус и похожие варианты на ${floor.label}.`,
    },
    sold: {
      badge: 'Продана',
      tone: 'sold',
      copy: `Недоступна для покупки, но менеджер может предложить похожие варианты на ${floor.label}.`,
    },
    hidden: {
      badge: 'Скрыта',
      tone: 'hidden',
      copy: `Недоступна в публичном выборе, но контекст ${floor.label} можно передать менеджеру.`,
    },
  };
  const status = statusCopy[unit.status] ?? { badge: unit.status, tone: unit.status, copy: `Статус квартиры: ${unit.status}. Менеджер уточнит детали.` };
  const roomsWord = unit.rooms_count === 1 ? 'комната' : unit.rooms_count > 1 && unit.rooms_count < 5 ? 'комнаты' : 'комнат';
  const title = `Квартира ${unit.number}`;
  const subtitle = `${unit.rooms_count} ${roomsWord} · ${unit.area_m2} м² · ${unit.price}`;
  return {
    title,
    subtitle,
    statusBadge: status.badge,
    statusTone: status.tone,
    availabilityCopy: status.copy,
    ariaLabel: `${title} · ${subtitle} · ${status.badge}`,
    selectedLabel: active ? 'Выбрана для заявки' : '',
  };
}

export function buildLeadContextSummary({
  development,
  building,
  selectedFloor,
  selectedUnit,
  selectedViewpoint,
  activeWindow,
  viewerState,
}: {
  development: DevelopmentViewerPayload;
  building: DevelopmentBuilding;
  selectedFloor?: DevelopmentFloor | null;
  selectedUnit?: DevelopmentUnit | null;
  selectedViewpoint?: DevelopmentViewpoint | null;
  activeWindow?: DevelopmentWindowView | null;
  viewerState: ViewerState;
}): LeadContextSummary {
  const floorLabel = selectedFloor?.label ?? 'этаж не выбран';
  const unitLabel = selectedUnit ? `квартира ${selectedUnit.number}` : 'квартира не выбрана';
  const optionalLabelParts = [selectedViewpoint?.label, activeWindow?.label].filter(Boolean);
  const label = `Lead context: ${[development.name, building.name, floorLabel, unitLabel, viewerState, ...optionalLabelParts].join(' · ')}`;

  if (!selectedFloor || !selectedUnit) {
    return {
      label,
      message: `Покупатель смотрит ${development.name}, ${building.name}. Состояние viewer: ${viewerState}. Этаж и квартира пока не выбраны.`,
    };
  }

  const details = [`Покупатель смотрит ${development.name}, ${building.name}, ${selectedFloor.label}, квартира ${selectedUnit.number} (${selectedUnit.rooms_count} ${selectedUnit.rooms_count === 1 ? 'комната' : selectedUnit.rooms_count > 1 && selectedUnit.rooms_count < 5 ? 'комнаты' : 'комнат'}, ${selectedUnit.area_m2} м², ${selectedUnit.price}).`, `Состояние viewer: ${viewerState}.`];
  if (selectedViewpoint) {
    details.push(`Точка просмотра: ${selectedViewpoint.label}.`);
  }
  if (activeWindow) {
    details.push(`Вид из окна: ${activeWindow.label}.`);
  }
  return {
    label,
    message: details.join(' '),
  };
}

export function buildResponsiveHudState({
  viewportWidth,
  viewerState,
  hasSelectedUnit,
  hasLeadContext,
}: {
  viewportWidth: number;
  viewerState: ViewerState;
  hasSelectedUnit: boolean;
  hasLeadContext: boolean;
}): ResponsiveHudState {
  const mode: ResponsiveHudState['mode'] = viewportWidth <= 640 ? 'mobile' : 'desktop';
  const unitClass = hasSelectedUnit ? 'has-unit' : 'no-unit';
  const leadClass = hasLeadContext ? 'has-lead-context' : 'no-lead-context';
  const stageClass = `viewer-stage responsive-${mode} state-${viewerState} ${unitClass} ${leadClass}`;
  const hudClass = mode === 'mobile' ? `viewer-hud mobile-stack${hasLeadContext ? ' compact-lead' : ''}` : 'viewer-hud desktop-panel';
  const label = hasLeadContext
    ? `Responsive HUD: ${mode === 'mobile' ? 'mobile stack' : 'desktop panel'} · sticky CTA · lead context visible`
    : `Responsive HUD: ${mode === 'mobile' ? 'mobile stack' : 'desktop panel'} · exploratory browsing`;
  return { mode, stageClass, hudClass, label };
}

export function buildShareHandoffSummary({
  selectedFloor,
  selectedUnit,
  viewerState,
  shareLink,
}: {
  selectedFloor?: DevelopmentFloor | null;
  selectedUnit?: DevelopmentUnit | null;
  viewerState: ViewerState;
  shareLink: string;
}): ShareHandoffSummary | null {
  if (!selectedFloor || !selectedUnit) {
    return null;
  }
  const context = `${selectedFloor.label} · квартира ${selectedUnit.number} · ${viewerState}`;
  return {
    label: `Ссылка на выбранную квартиру готова: ${context}`,
    copy: `Ссылка для клиента: ${shareLink}`,
    ariaLabel: `Copy share link: ${context}`,
    cardClass: 'share-handoff-card glass-card desktop-inline',
    copyClass: 'share-handoff-copy copy-ready',
    buttonClass: 'share-copy-button premium-outline',
  };
}

export function buildLeadCtaState(status: LeadCtaStatus): LeadCtaState {
  if (status === 'sending') {
    return {
      status,
      buttonDisabled: true,
      buttonClass: 'lead-submit-button sending',
      feedbackClass: 'lead-feedback sending',
      buttonLabel: 'Отправляем заявку…',
    };
  }
  if (status === 'error') {
    return {
      status,
      buttonDisabled: false,
      buttonClass: 'lead-submit-button retry',
      feedbackClass: 'lead-feedback error-card',
      buttonLabel: 'Повторить отправку',
    };
  }
  if (status === 'success') {
    return {
      status,
      buttonDisabled: false,
      buttonClass: 'lead-submit-button success-ready',
      feedbackClass: 'lead-feedback success',
      buttonLabel: 'Отправить еще одну заявку',
    };
  }
  return {
    status,
    buttonDisabled: false,
    buttonClass: 'lead-submit-button ready',
    feedbackClass: 'lead-feedback idle',
    buttonLabel: 'Оставить заявку',
  };
}

export function buildViewerAnalyticsEvent({
  action,
  development,
  building,
  selectedFloor,
  selectedUnit,
  selectedViewpoint,
  activeWindow,
  viewerState,
}: {
  action: ViewerAnalyticsAction;
  development: DevelopmentViewerPayload;
  building: DevelopmentBuilding;
  selectedFloor?: DevelopmentFloor | null;
  selectedUnit?: DevelopmentUnit | null;
  selectedViewpoint?: DevelopmentViewpoint | null;
  activeWindow?: DevelopmentWindowView | null;
  viewerState: ViewerState;
}): ViewerAnalyticsEvent {
  const payload: Record<string, string> = {
    development_id: development.id,
    development_name: development.name,
    building_id: building.id,
    building_name: building.name,
    viewer_state: viewerState,
  };
  const parts = [development.name, building.name];

  if (selectedFloor) {
    payload.floor_id = selectedFloor.id;
    payload.floor_label = selectedFloor.label;
    parts.push(selectedFloor.label);
  }
  if (selectedUnit) {
    payload.unit_id = selectedUnit.id;
    payload.unit_number = selectedUnit.number;
    parts.push(`квартира ${selectedUnit.number}`);
  }
  parts.push(viewerState);
  if (selectedViewpoint) {
    payload.viewpoint_id = selectedViewpoint.id;
    payload.viewpoint_label = selectedViewpoint.label;
    parts.push(selectedViewpoint.label);
  }
  if (activeWindow) {
    payload.window_id = activeWindow.id;
    payload.window_label = activeWindow.label;
    parts.push(activeWindow.label);
  }

  return {
    eventName: `premium_viewer_${action}`,
    label: `Analytics: ${action} · ${parts.join(' · ')}`,
    payload,
  };
}

function actionFromAnalyticsLabel(label: string): ViewerAnalyticsAction | null {
  const match = label.match(/^Analytics: ([a-z_]+)/);
  if (!match) {
    return null;
  }
  const action = match[1];
  return action === 'select_floor' || action === 'select_unit' || action === 'enter_walk_mode' || action === 'open_window_view' || action === 'lead_click' || action === 'lead_success' || action === 'lead_error' || action === 'crm_copy_success' || action === 'crm_copy_error' ? action : null;
}

function pickAnalyticsPart(label: string, predicate: (part: string) => boolean): string | null {
  return label.split(' · ').map((part) => part.trim()).find(predicate) ?? null;
}

function lastForAction(labels: string[], action: ViewerAnalyticsAction): string | null {
  return [...labels].reverse().find((label) => actionFromAnalyticsLabel(label) === action) ?? null;
}

export function buildInteractionTrailSummary(labels: string[]): InteractionTrailSummary | null {
  const actions = labels.map(actionFromAnalyticsLabel).filter((action): action is ViewerAnalyticsAction => Boolean(action)).filter((action) => action === 'select_floor' || action === 'select_unit' || action === 'enter_walk_mode' || action === 'open_window_view');
  if (actions.length === 0) {
    return null;
  }

  const floorLabel = pickAnalyticsPart(lastForAction(labels, 'select_floor') ?? '', (part) => /этаж$/.test(part));
  const unitLabel = pickAnalyticsPart(lastForAction(labels, 'select_unit') ?? '', (part) => part.startsWith('квартира '));
  const viewpointLabel = (() => {
    const label = lastForAction(labels, 'enter_walk_mode');
    const parts = label?.split(' · ') ?? [];
    return parts.length > 0 ? parts[parts.length - 1] : null;
  })();
  const windowLabel = (() => {
    const label = lastForAction(labels, 'open_window_view');
    const parts = label?.split(' · ') ?? [];
    return parts.length > 0 ? parts[parts.length - 1] : null;
  })();

  const journey = [floorLabel, unitLabel, viewpointLabel, windowLabel].filter((part): part is string => Boolean(part));
  const managerParts = [
    floorLabel ? `выбрал ${floorLabel}` : null,
    unitLabel ? unitLabel.replace(/^квартира /, 'квартиру ') : null,
    viewpointLabel ? `вошел в ${viewpointLabel}` : null,
    windowLabel ? `открыл ${windowLabel}` : null,
  ].filter((part): part is string => Boolean(part));

  const managerNote = managerParts.length > 1
    ? `Менеджеру: клиент последовательно ${managerParts.slice(0, -1).join(', ')} и ${managerParts[managerParts.length - 1]}.`
    : `Менеджеру: клиент ${managerParts[0]}.`;

  return {
    label: `Interaction trail: ${actions.join(' → ')}`,
    copy: `Путь клиента: ${journey.join(' → ')}`,
    managerNote,
    cardClass: 'interaction-trail-card glass-card manager-notes-ready',
  };
}

export function buildManagerFollowUpChecklist({
  leadContext,
  interactionTrail,
  shareHandoff,
  selectedUnit,
}: {
  leadContext: LeadContextSummary | null;
  interactionTrail: InteractionTrailSummary | null;
  shareHandoff: ShareHandoffSummary | null;
  selectedUnit?: DevelopmentUnit | null;
}): ManagerFollowUpChecklist | null {
  if (!leadContext || !selectedUnit) {
    return null;
  }
  const unitLabel = `квартира ${selectedUnit.number}`;
  const items = [
    `Уточнить бюджет и срок покупки по квартире ${selectedUnit.number}.`,
    shareHandoff ? shareHandoff.copy.replace('Ссылка для клиента: ', 'Отправить клиенту ссылку: ') : 'Подготовить ссылку на выбранный вариант для клиента.',
  ];
  if (interactionTrail) {
    items.push(`Обсудить просмотренный путь: ${interactionTrail.copy}`);
  }
  return {
    label: `Manager follow-up: ${unitLabel} · ${selectedUnit.status} · ${items.length} шага`,
    items,
    copy: `CRM note: ${leadContext.label} · follow-up for ${selectedUnit.status} unit.`,
    cardClass: 'manager-follow-up-card glass-card crm-ready',
  };
}

export function buildBrokerNextStepScript({
  leadContext,
  managerFollowUp,
  shareHandoff,
  selectedUnit,
}: {
  leadContext: LeadContextSummary | null;
  managerFollowUp: ManagerFollowUpChecklist | null;
  shareHandoff: ShareHandoffSummary | null;
  selectedUnit?: DevelopmentUnit | null;
}): BrokerNextStepScript | null {
  if (!leadContext || !managerFollowUp || !shareHandoff || !selectedUnit) {
    return null;
  }
  const unitLabel = `квартира ${selectedUnit.number}`;
  const leadParts = leadContext.label.split(' · ');
  const developmentName = leadParts[0].replace('Lead context: ', '');
  const viewerState = leadParts[4] ?? 'viewer';
  const shareLink = shareHandoff.copy.replace('Ссылка для клиента: ', '');

  return {
    label: `Broker script: ${unitLabel} · ${viewerState} · ready to send`,
    opener: `Здравствуйте! Видел ваш интерес к квартире ${selectedUnit.number} в ${developmentName} — могу прислать короткую подборку и ответить по бюджету/срокам.`,
    clientNextStep: `Предложить клиенту открыть ссылку и выбрать удобное время для звонка: ${shareLink}`,
    managerNote: `Broker script note: ${unitLabel} · ${selectedUnit.status} · ${viewerState} · follow-up ready.`,
    cardClass: 'broker-script-card glass-card client-ready',
  };
}

export function buildLeadHandoffDigest({
  leadContext,
  interactionTrail,
  managerFollowUp,
  brokerScript,
  shareHandoff,
  selectedUnit,
}: {
  leadContext: LeadContextSummary | null;
  interactionTrail: InteractionTrailSummary | null;
  managerFollowUp: ManagerFollowUpChecklist | null;
  brokerScript: BrokerNextStepScript | null;
  shareHandoff: ShareHandoffSummary | null;
  selectedUnit?: DevelopmentUnit | null;
}): LeadHandoffDigest | null {
  if (!leadContext || !selectedUnit) {
    return null;
  }
  const leadParts = leadContext.label.split(' · ');
  const unitLabel = `квартира ${selectedUnit.number}`;
  const viewerState = leadParts[4] ?? 'viewer';
  const blockCount = [leadContext, interactionTrail, managerFollowUp, brokerScript, shareHandoff].filter(Boolean).length;
  const trailCopy = interactionTrail?.copy ?? 'Путь клиента пока не собран';
  const nextStep = brokerScript?.clientNextStep ?? shareHandoff?.copy ?? managerFollowUp?.items[0] ?? 'Связаться с клиентом и уточнить интерес.';

  return {
    label: `Sales-room digest: ${unitLabel} · ${viewerState} · ${blockCount} блоков`,
    recap: `Клиент смотрел ${unitLabel} в режиме ${viewerState}; путь: ${trailCopy}; следующий шаг: ${nextStep}`,
    managerOneLiner: `Digest note: ${unitLabel} · ${selectedUnit.status} · ${viewerState} · ${shareHandoff ? 'share ready' : 'share pending'} · ${managerFollowUp ? 'follow-up ready' : 'follow-up pending'}.`,
    cardClass: 'lead-handoff-digest-card glass-card sales-room-ready',
  };
}

export function buildLeadHandoffPersistenceState({ digest, status }: { digest: LeadHandoffDigest | null; status: LeadCtaStatus }): LeadHandoffPersistenceState | null {
  if (!digest || status === 'idle') {
    return null;
  }
  const digestCopy = digest.managerOneLiner.replace(/^Digest note: /, '').replace(/\.$/, '');
  if (status === 'sending') {
    return {
      label: 'Digest persistence: sending · sales-room context locked',
      copy: `Сохраняем digest рядом с заявкой: ${digestCopy}.`,
      badge: 'Digest закреплен при отправке',
      cardClass: 'lead-handoff-persistence-card sending copy-ready',
    };
  }
  if (status === 'error') {
    return {
      label: 'Digest persistence: error · retry keeps sales-room context',
      copy: `Повтор отправки сохранит digest: ${digestCopy}.`,
      badge: 'Digest сохранен для повтора',
      cardClass: 'lead-handoff-persistence-card error copy-ready',
    };
  }
  return {
    label: 'Digest persistence: success · manager handoff ready',
    copy: `Менеджерский handoff готов: ${digestCopy}.`,
    badge: 'Digest готов для менеджера',
    cardClass: 'lead-handoff-persistence-card success copy-ready',
  };
}

export function buildLeadExportPayload({
  leadContext,
  shareHandoff,
  digest,
  persistence,
  managerFollowUp,
  brokerScript,
}: {
  leadContext: LeadContextSummary | null;
  shareHandoff: ShareHandoffSummary | null;
  digest: LeadHandoffDigest | null;
  persistence: LeadHandoffPersistenceState | null;
  managerFollowUp: ManagerFollowUpChecklist | null;
  brokerScript: BrokerNextStepScript | null;
}): LeadExportPayload | null {
  if (!leadContext || !shareHandoff || !digest) {
    return null;
  }
  const leadParts = leadContext.label.replace(/^Lead context: /, '').split(' · ');
  const [development = 'development', building = 'building', floor = 'floor', unit = 'unit', viewerState = 'viewer'] = leadParts;
  const nextStep = brokerScript?.clientNextStep ?? managerFollowUp?.items[0] ?? 'Связаться с клиентом.';
  const segments = [
    development,
    building,
    floor,
    unit,
    viewerState,
    shareHandoff.copy,
    digest.managerOneLiner,
    persistence?.badge,
    nextStep,
  ].filter(Boolean);
  return {
    label: `CRM export payload: ${development} · ${unit} · ${viewerState}`,
    copy: `CRM payload: ${segments.join(' | ')}`,
    managerOneLiner: `Export note: ${unit} · ${viewerState} · share+digest+next-step ready.`,
    cardClass: 'lead-export-payload-card glass-card crm-export-ready',
  };
}

export function buildGroupedLeadExportFields(exportPayload: LeadExportPayload | null): GroupedLeadExportFields | null {
  if (!exportPayload) {
    return null;
  }
  const labelParts = exportPayload.label.replace(/^CRM export payload: /, '').split(' · ');
  const [development = 'development', unit = 'unit', viewerState = 'viewer'] = labelParts;
  const payloadParts = exportPayload.copy.replace(/^CRM payload: /, '').split(' | ');
  const [contextDevelopment = development, building = 'building', floor = 'floor', contextUnit = unit, contextViewerState = viewerState, share = '', digest = '', persistence = '', nextStep = ''] = payloadParts;
  const groups = [
    {
      title: 'Context',
      rows: [
        `ЖК: ${contextDevelopment}`,
        `Корпус: ${building}`,
        `Этаж: ${floor}`,
        `Квартира: ${contextUnit}`,
        `Viewer state: ${contextViewerState}`,
      ],
    },
    { title: 'Share', rows: [share].filter(Boolean) },
    { title: 'Digest', rows: [digest, persistence].filter(Boolean) },
    { title: 'Next step', rows: [nextStep].filter(Boolean) },
  ].filter((group) => group.rows.length > 0);

  return {
    label: `CRM fields: ${development} · ${unit} · ${viewerState} · ${groups.length} группы`,
    groups,
    cardClass: 'lead-export-fields-card glass-card crm-field-groups copy-ready',
  };
}

export function buildCrmExportAction(groupedFields: GroupedLeadExportFields | null): CrmExportAction | null {
  if (!groupedFields) {
    return null;
  }
  const labelParts = groupedFields.label.replace(/^CRM fields: /, '').split(' · ');
  const [, unit = 'unit', viewerState = 'viewer'] = labelParts;
  const fieldCount = groupedFields.groups.reduce((total, group) => total + group.rows.length, 0);
  const plainText = groupedFields.groups
    .map((group) => `${group.title}\n${group.rows.map((row) => `- ${row}`).join('\n')}`)
    .join('\n\n');

  return {
    label: `CRM copy action: ${unit} · ${viewerState} · ${fieldCount} полей`,
    buttonLabel: 'Скопировать CRM block',
    ariaLabel: `Copy CRM export block to clipboard: ${unit} · ${viewerState} · manager-ready`,
    plainText,
    cardClass: 'crm-export-action-card glass-card copy-action-ready',
    textClass: 'crm-export-action-text copy-ready',
    buttonClass: 'crm-export-action-button premium-outline',
  };
}

export function buildCrmCopyIntentSummary({ status, action }: { status: 'copied' | 'error'; action: CrmExportAction | null }): CrmCopyIntentSummary | null {
  if (!action) {
    return null;
  }
  const labelParts = action.label.replace(/^CRM copy action: /, '').split(' · ');
  const [unit = 'unit', viewerState = 'viewer', fieldCount = '0 полей'] = labelParts;
  if (status === 'copied') {
    return {
      analyticsAction: 'crm_copy_success',
      label: `CRM copy audit: copied · ${unit} · ${viewerState} · ${fieldCount}`,
      managerNote: `CRM copy audit: менеджер скопировал ${fieldCount} for ${unit} · ${viewerState}.`,
      cardClass: 'crm-copy-audit-card glass-card copied',
    };
  }
  return {
    analyticsAction: 'crm_copy_error',
    label: `CRM copy audit: fallback · ${unit} · ${viewerState} · ${fieldCount}`,
    managerNote: `CRM copy audit: clipboard fallback, CRM block остается copy-ready вручную for ${unit} · ${viewerState}.`,
    cardClass: 'crm-copy-audit-card glass-card error',
  };
}

export function buildMobileCrmHandoffState({
  viewportWidth,
  action,
  hasAuditTrail,
  hasCopyFeedback,
}: {
  viewportWidth: number;
  action: CrmExportAction | null;
  hasAuditTrail: boolean;
  hasCopyFeedback: boolean;
}): MobileCrmHandoffState | null {
  if (!action) {
    return null;
  }
  const mode: MobileCrmHandoffState['mode'] = viewportWidth <= 640 ? 'mobile' : 'desktop';
  const density = mode === 'mobile' ? 'compact' : 'desktop';
  const labelParts = action.label.replace(/^CRM copy action: /, '').split(' · ');
  const fieldCount = labelParts[2] ?? '0 полей';
  const auditClass = hasAuditTrail ? 'audit-visible' : 'audit-hidden';
  const feedbackClass = hasCopyFeedback ? 'feedback-visible' : 'feedback-hidden';
  const stackBase = mode === 'mobile' ? 'crm-handoff-stack mobile-density compact-copy' : 'crm-handoff-stack desktop-density relaxed-copy';
  const actionCardClass = mode === 'mobile' ? `${action.cardClass} mobile-density compact-copy` : `${action.cardClass} desktop-density`;
  const textClass = mode === 'mobile' ? `${action.textClass} mobile-scroll-safe` : action.textClass;
  const auditCardClass = mode === 'mobile' ? `crm-copy-audit-card glass-card mobile-density ${auditClass}` : `crm-copy-audit-card glass-card desktop-density ${auditClass}`;

  return {
    mode,
    label: `Mobile CRM handoff: ${density} · ${fieldCount} · audit ${hasAuditTrail ? 'visible' : 'hidden'} · feedback ${hasCopyFeedback ? 'visible' : 'hidden'}`,
    stackClass: `${stackBase} ${auditClass} ${feedbackClass}`,
    actionCardClass,
    textClass,
    auditClass: auditCardClass,
  };
}

export function buildLeadSuccessSummary({
  leadId,
  selectedFloor,
  selectedUnit,
  viewerState,
  shareLink,
}: {
  leadId: string;
  selectedFloor: DevelopmentFloor;
  selectedUnit: DevelopmentUnit;
  viewerState: ViewerState;
  shareLink: string;
}): LeadSuccessSummary {
  const context = `${selectedFloor.label} · квартира ${selectedUnit.number} · ${viewerState}`;
  return {
    label: `Заявка отправлена: #${leadId} · ${context}`,
    nextAction: `Менеджер получает контекст просмотра и ссылку для продолжения: ${shareLink}`,
    cardClass: 'lead-success-card glass-card follow-up-ready',
  };
}

function isViewerState(value: string | null): value is ViewerState {
  return value === 'development_overview' || value === 'floor_focus' || value === 'unit_top_down' || value === 'walk_mode' || value === 'window_view';
}

export function buildViewerDeepLinkState({ building, search }: { building: DevelopmentBuilding; search: string }): ViewerDeepLinkState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const floor = building.floors.find((candidate) => candidate.id === params.get('floor')) ?? null;
  const unit = floor?.units.find((candidate) => candidate.id === params.get('unit')) ?? null;
  const requestedView = isViewerState(params.get('view')) ? params.get('view') : null;

  if (!floor) {
    return {
      viewerState: 'development_overview',
      selectedFloorId: null,
      selectedUnitId: null,
      selectedViewpointId: null,
      activeWindowId: null,
      label: 'Deep link: overview fallback',
    };
  }

  if (!unit) {
    return {
      viewerState: 'floor_focus',
      selectedFloorId: floor.id,
      selectedUnitId: null,
      selectedViewpointId: null,
      activeWindowId: null,
      label: `Deep link: ${floor.label} · floor_focus`,
    };
  }

  const requestedWindow = unit.window_views.find((candidate) => candidate.id === params.get('window')) ?? null;
  const selectedViewpoint = unit.viewpoints.find((candidate) => candidate.id === params.get('viewpoint')) ?? unit.viewpoints.find((candidate) => candidate.room_id === requestedWindow?.room_id) ?? unit.viewpoints[0] ?? null;
  const viewerState: ViewerState = requestedView === 'window_view' && requestedWindow
    ? 'window_view'
    : requestedView === 'walk_mode' && selectedViewpoint
      ? 'walk_mode'
      : requestedView === 'floor_focus'
        ? 'floor_focus'
        : 'unit_top_down';
  const activeWindow = viewerState === 'window_view' ? requestedWindow : null;
  const labelParts = [floor.label, `квартира ${unit.number}`, viewerState, activeWindow?.label].filter(Boolean);

  return {
    viewerState,
    selectedFloorId: floor.id,
    selectedUnitId: unit.id,
    selectedViewpointId: selectedViewpoint?.id ?? null,
    activeWindowId: activeWindow?.id ?? null,
    label: `Deep link: ${labelParts.join(' · ')}`,
  };
}

export function buildViewerDeepLinkSearch({
  selectedFloor,
  selectedUnit,
  selectedViewpoint,
  activeWindow,
  viewerState,
}: {
  selectedFloor?: DevelopmentFloor | null;
  selectedUnit?: DevelopmentUnit | null;
  selectedViewpoint?: DevelopmentViewpoint | null;
  activeWindow?: DevelopmentWindowView | null;
  viewerState: ViewerState;
}): string {
  const params = new URLSearchParams();
  if (selectedFloor) {
    params.set('floor', selectedFloor.id);
  }
  if (selectedUnit) {
    params.set('unit', selectedUnit.id);
  }
  params.set('view', viewerState);
  if (selectedViewpoint) {
    params.set('viewpoint', selectedViewpoint.id);
  }
  if (activeWindow) {
    params.set('window', activeWindow.id);
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function buildMaterialTheme({
  kind,
  status = 'available',
  active = false,
  hovered = false,
  hasUnits = true,
}: {
  kind: MaterialKind;
  status?: string;
  active?: boolean;
  hovered?: boolean;
  hasUnits?: boolean;
}): MaterialTheme {
  if (kind === 'floor') {
    if (active) {
      return { color: '#d9b56e', opacity: 0.96, emissive: '#8a611f', metalness: 0.18, roughness: 0.46, label: 'Material floor: active warm-gold' };
    }
    if (hovered) {
      return { color: '#c7d8d1', opacity: 0.88, emissive: '#6f817a', metalness: 0.14, roughness: 0.5, label: 'Material floor: hover sage-highlight' };
    }
    if (!hasUnits) {
      return { color: '#d8cbb7', opacity: 0.56, emissive: '#8f806b', metalness: 0.06, roughness: 0.78, label: 'Material floor: empty warm-stone' };
    }
    return { color: '#efe0c4', opacity: 0.78, emissive: '#9a7a41', metalness: 0.08, roughness: 0.58, label: 'Material floor: available champagne-glass' };
  }
  if (kind === 'unit') {
    if (active) {
      return { color: '#d9b56e', opacity: 0.92, emissive: '#8a611f', metalness: 0.16, roughness: 0.46, label: 'Material unit: active warm-gold' };
    }
    if (status === 'sold') {
      return { color: '#b8ad9d', opacity: 0.44, emissive: '#766a5a', metalness: 0.06, roughness: 0.78, label: 'Material unit: sold warm-muted' };
    }
    if (status === 'reserved') {
      return { color: '#d89b5f', opacity: 0.76, emissive: '#8f4f20', metalness: 0.12, roughness: 0.5, label: 'Material unit: reserved warm-reserve' };
    }
    return { color: '#bdd8d0', opacity: 0.72, emissive: '#58776e', metalness: 0.1, roughness: 0.52, label: 'Material unit: available sage-glass' };
  }
  if (kind === 'room') {
    return { color: '#c9b79c', opacity: 0.78, emissive: '#7a6547', metalness: 0.08, roughness: 0.56, label: 'Material room: walkthrough warm-stone' };
  }
  if (kind === 'window-hotspot') {
    return { color: '#d9824b', opacity: 0.88, emissive: '#8f4520', metalness: 0.14, roughness: 0.44, label: 'Material window-hotspot: sunset warm-view' };
  }
  return { color: '#e8ddca', opacity: 0.32, emissive: '#9a8a72', metalness: 0.08, roughness: 0.68, label: 'Material tower-shell: warm glass' };
}

export function buildViewerScene(development: DevelopmentViewerPayload): ViewerScene {
  const building = development.buildings[0];
  const floors = [...building.floors];
  return {
    developmentId: development.id,
    building: {
      id: building.id,
      name: building.name,
      model: building.model,
    },
    towerFloors: floors
      .sort((a, b) => b.level - a.level)
      .map((floor) => ({
        id: floor.id,
        level: floor.level,
        label: floor.label,
        elevation: floor.elevation,
        hasUnits: floor.units.length > 0,
      })),
    unitsByFloor: Object.fromEntries(
      building.floors.map((floor) => [
        floor.id,
        floor.units.map((unit) => ({
          id: unit.id,
          number: unit.number,
          areaM2: unit.area_m2,
          roomsCount: unit.rooms_count,
          price: unit.price,
          status: unit.status,
        })),
      ]),
    ),
  };
}


export function buildEditorialShowroomDirection(): EditorialShowroomDirection {
  return {
    directionName: 'Warm editorial real-estate showroom',
    pageClass: 'development-viewer editorial-atelier-showroom incommonwith-direction frosted-hud-discipline scandi-hairline-discipline',
    heroClass: 'viewer-hero editorial-hero cream-paper-hero oxblood-ink-hero',
    sceneClass: 'viewer-scene immersive-model-card editorial-model-stage frosted-atmosphere-stage',
    hudClass: 'viewer-hud desktop-panel sales-hud editorial-sales-panel linen-glass-hud',
    diagnosticClass: 'viewer-stage-readouts technical-readouts-collapsed diagnostics-minimized visually-demoted-readouts editorial-diagnostics-band',
    palette: {
      paper: '#fafaf9',
      ink: '#4a0a05',
      linen: '#f8f7f1',
      clay: '#a2827f',
      glass: 'rgba(248, 247, 241, 0.74)',
    },
    references: [
      'Incommonwith: cream paper + oxblood editorial atelier',
      'General Intelligence Company: frosted floating HUD cards',
      'Stykka: invisible UI, hairline borders, object-first restraint',
    ],
    headline: 'Warm editorial real-estate showroom',
    stageLabel: 'Большая архитектурная сцена с лёгким редакционным HUD',
    forbid: ['cold SaaS blue as primary accent', 'pure black admin slabs', 'visible debug-first labels'],
  };
}

export function buildScenePresentationState({
  scene,
  selectedFloor,
  selectedUnit,
}: {
  scene: ViewerScene;
  selectedFloor?: DevelopmentFloor | null;
  selectedUnit?: DevelopmentUnit | null;
}): ScenePresentationState {
  const floorClass = selectedFloor ? ' floor-emphasis' : '';
  const unitClass = selectedUnit ? ' unit-emphasis' : '';
  const skylineFloorClass = selectedFloor ? ' selected-floor-emphasis' : '';
  const skylineUnitClass = selectedUnit ? ' selected-unit-emphasis' : '';
  const selectedFloorLabel = selectedFloor ? `Выбран ${selectedFloor.label}` : 'Общий вид комплекса';
  const selectedUnitLabel = selectedUnit ? `Квартира ${selectedUnit.number} · ${selectedUnit.area_m2} м² · ${selectedUnit.price}` : 'Квартира не выбрана';
  const unitTransitionLabel = selectedUnit ? `Плавный переход к квартире ${selectedUnit.number}` : 'Плавный выбор этажа';
  const windowCount = selectedUnit?.window_views.length ?? 0;
  const windowWord = windowCount === 1 ? 'вид из окна' : 'видов из окна';
  const customerReadout = [
    scene.building.name,
    selectedFloor?.label,
    selectedUnit ? `квартира ${selectedUnit.number}` : null,
    selectedUnit ? `${windowCount} ${windowWord}` : null,
  ].filter(Boolean).join(' · ');

  return {
    shellClass: `r3f-scene-shell warm-model-shell high-fidelity-showroom-model${floorClass}${unitClass}`,
    skylineClass: `r3f-skyline-massing premium-massing${skylineFloorClass}${skylineUnitClass}`,
    selectedFloorLabel,
    selectedUnitLabel,
    unitTransitionLabel,
    customerReadout,
    debugVisibleByDefault: false,
  };
}

export function polygonPoints(room: DevelopmentRoom): string {
  return room.polygon.map((point) => `${point.x},${point.y}`).join(' ');
}

function bounds(points: DevelopmentRoom['polygon']): { minX: number; maxX: number; minY: number; maxY: number } | null {
  if (points.length === 0) {
    return null;
  }
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

function floorTargetY(floor?: DevelopmentFloor | null): number {
  if (!floor) {
    return 1.6;
  }
  return rounded(floor.elevation / 10);
}

function scaledPlanBounds(unit: DevelopmentUnit) {
  const unitBounds = bounds(unit.plan_polygon);
  if (!unitBounds) {
    return null;
  }
  const centerX = (unitBounds.minX + unitBounds.maxX) / 2;
  const centerY = (unitBounds.minY + unitBounds.maxY) / 2;
  const width = unitBounds.maxX - unitBounds.minX || 1;
  const depth = unitBounds.maxY - unitBounds.minY || 1;
  return {
    centerX: rounded(centerX / 3),
    centerZ: rounded(centerY / 3),
    width: rounded(width / 3),
    depth: rounded(depth / 3),
  };
}

function scaledPolygonBounds(points: DevelopmentRoom['polygon']) {
  const primitiveBounds = bounds(points);
  if (!primitiveBounds) {
    return null;
  }
  const centerX = (primitiveBounds.minX + primitiveBounds.maxX) / 2;
  const centerY = (primitiveBounds.minY + primitiveBounds.maxY) / 2;
  const width = primitiveBounds.maxX - primitiveBounds.minX || 1;
  const depth = primitiveBounds.maxY - primitiveBounds.minY || 1;
  return {
    centerX: rounded(centerX / 3),
    centerZ: rounded(centerY / 3),
    width: rounded(width / 3),
    depth: rounded(depth / 3),
  };
}

export function buildUnitFootprints(floor?: DevelopmentFloor | null): UnitFootprintPrimitive[] {
  if (!floor) {
    return [];
  }
  const y = rounded(floorTargetY(floor) + 0.08);
  return floor.units.flatMap((unit) => {
    const footprint = scaledPlanBounds(unit);
    if (!footprint) {
      return [];
    }
    return [
      {
        id: unit.id,
        number: unit.number,
        label: `квартира ${unit.number}`,
        status: unit.status,
        center: [footprint.centerX, y, footprint.centerZ],
        size: [footprint.width, 0.06, footprint.depth],
      },
    ];
  });
}

export function buildRoomFootprints(unit?: DevelopmentUnit | null, floor?: DevelopmentFloor | null): RoomFootprintPrimitive[] {
  if (!unit) {
    return [];
  }
  const y = rounded(floorTargetY(floor) + 0.16);
  return unit.rooms.flatMap((room) => {
    const footprint = scaledPolygonBounds(room.polygon);
    if (!footprint) {
      return [];
    }
    return [
      {
        id: room.id,
        name: room.name,
        label: room.name,
        areaM2: room.area_m2,
        center: [footprint.centerX, y, footprint.centerZ],
        size: [footprint.width, 0.04, footprint.depth],
      },
    ];
  });
}

export function buildWindowHotspots(unit?: DevelopmentUnit | null, floor?: DevelopmentFloor | null): WindowHotspotPrimitive[] {
  if (!unit) {
    return [];
  }
  const y = rounded(floorTargetY(floor) + 0.22);
  return unit.window_views.flatMap((windowView) => {
    const room = unit.rooms.find((candidate) => candidate.id === windowView.room_id);
    const footprint = room ? scaledPolygonBounds(room.polygon) : scaledPlanBounds(unit);
    if (!footprint) {
      return [];
    }
    return [
      {
        id: windowView.id,
        roomId: windowView.room_id,
        label: windowView.label,
        directionDegrees: windowView.direction_degrees,
        center: [footprint.centerX, y, footprint.centerZ],
        size: [Math.max(0.24, rounded(footprint.width * 0.27)), 0.1, 0.1],
      },
    ];
  });
}

function viewpointVector(point: DevelopmentViewpoint['position'], floor?: DevelopmentFloor | null): [number, number, number] {
  const y = floorTargetY(floor);
  return [rounded(point.x / 3), rounded(y + point.z), rounded(point.y / 3)];
}

function directionVector(degrees: number): { x: number; z: number } {
  const radians = (degrees * Math.PI) / 180;
  return { x: Math.sin(radians), z: Math.cos(radians) };
}

function windowCameraVector({
  windowView,
  floor,
  unit,
  selectedViewpoint,
}: {
  windowView: DevelopmentWindowView;
  floor?: DevelopmentFloor | null;
  unit?: DevelopmentUnit | null;
  selectedViewpoint?: DevelopmentViewpoint | null;
}): Pick<CameraPlan, 'position' | 'target'> {
  const baseViewpoint = selectedViewpoint ?? unit?.viewpoints.find((viewpoint) => viewpoint.room_id === windowView.room_id) ?? unit?.viewpoints[0];
  const basePosition = baseViewpoint ? viewpointVector(baseViewpoint.position, floor) : ([0, rounded(floorTargetY(floor) + 1.6), 0] as [number, number, number]);
  const direction = directionVector(windowView.direction_degrees);
  const eyeY = rounded(basePosition[1] + 0.3);
  return {
    position: [rounded(basePosition[0] - direction.x), eyeY, rounded(basePosition[2] - direction.z * 1.94)],
    target: [rounded(basePosition[0] + direction.x * 1.36), eyeY, rounded(basePosition[2] + direction.z * 1.94)],
  };
}

export function buildViewpointAnchors(unit?: DevelopmentUnit | null, floor?: DevelopmentFloor | null): ViewpointAnchorPrimitive[] {
  if (!unit) {
    return [];
  }
  return unit.viewpoints.map((viewpoint) => ({
    id: viewpoint.id,
    roomId: viewpoint.room_id,
    label: viewpoint.label,
    position: viewpointVector(viewpoint.position, floor),
    target: viewpointVector(viewpoint.target, floor),
  }));
}

function pct(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}%`;
}

export function roomPlanStyle(room: DevelopmentRoom, unit: DevelopmentUnit): React.CSSProperties {
  const roomBounds = bounds(room.polygon);
  const unitBounds = bounds(unit.plan_polygon.length > 0 ? unit.plan_polygon : room.polygon);
  if (!roomBounds || !unitBounds) {
    return {};
  }

  const unitWidth = unitBounds.maxX - unitBounds.minX || 1;
  const unitHeight = unitBounds.maxY - unitBounds.minY || 1;
  return {
    left: pct(((roomBounds.minX - unitBounds.minX) / unitWidth) * 100),
    top: pct(((roomBounds.minY - unitBounds.minY) / unitHeight) * 100),
    width: pct(((roomBounds.maxX - roomBounds.minX) / unitWidth) * 100),
    height: pct(((roomBounds.maxY - roomBounds.minY) / unitHeight) * 100),
  };
}

export function cameraMessageForState({
  viewerState,
  selectedFloor,
  selectedUnit,
  selectedViewpoint,
  activeWindow,
}: {
  viewerState: ViewerState;
  selectedFloor?: DevelopmentFloor | null;
  selectedUnit?: DevelopmentUnit | null;
  selectedViewpoint?: DevelopmentViewpoint | null;
  activeWindow?: DevelopmentWindowView | null;
}): string {
  if (viewerState === 'window_view' && activeWindow) {
    return `Панорама из окна: ${activeWindow.label}`;
  }
  if (viewerState === 'walk_mode' && selectedViewpoint) {
    return `Walk mode: ${selectedViewpoint.label}`;
  }
  if (viewerState === 'unit_top_down' && selectedUnit) {
    return `Top-down план квартиры ${selectedUnit.number}`;
  }
  if (viewerState === 'floor_focus' && selectedFloor) {
    return `Камера поднимается на ${selectedFloor.label}`;
  }
  return 'Общий вид ЖК и плавный подлет к корпусу';
}

export function buildCameraPlan({
  scene,
  viewerState,
  selectedFloor,
  selectedUnit,
  selectedViewpoint,
  activeWindow,
}: {
  scene: ViewerScene;
  viewerState: ViewerState;
  selectedFloor?: DevelopmentFloor | null;
  selectedUnit?: DevelopmentUnit | null;
  selectedViewpoint?: DevelopmentViewpoint | null;
  activeWindow?: DevelopmentWindowView | null;
}): CameraPlan {
  if (viewerState === 'window_view' && activeWindow) {
    const camera = windowCameraVector({ windowView: activeWindow, floor: selectedFloor, unit: selectedUnit, selectedViewpoint });
    return {
      frame: activeWindow.id,
      position: camera.position,
      target: camera.target,
      zoom: 1.64,
      label: `Window camera: ${activeWindow.label}`,
    };
  }
  if (viewerState === 'walk_mode' && selectedFloor && selectedViewpoint) {
    return {
      frame: selectedViewpoint.id,
      position: viewpointVector(selectedViewpoint.position, selectedFloor),
      target: viewpointVector(selectedViewpoint.target, selectedFloor),
      zoom: 1.72,
      label: `Viewpoint camera: ${selectedViewpoint.label}`,
    };
  }
  if ((viewerState === 'unit_top_down' || viewerState === 'walk_mode' || viewerState === 'window_view') && selectedFloor && selectedUnit) {
    const y = floorTargetY(selectedFloor);
    return {
      frame: selectedUnit.id,
      position: [0, rounded(y + 5.5), 0.01],
      target: [0, y, 0],
      zoom: 1.45,
      label: `Unit camera: квартира ${selectedUnit.number}`,
    };
  }
  if (viewerState === 'floor_focus' && selectedFloor) {
    const y = floorTargetY(selectedFloor);
    return {
      frame: selectedFloor.id,
      position: [3.8, rounded(y + 2.75), 5.6],
      target: [0, y, 0],
      zoom: 1.18,
      label: `Floor camera: ${selectedFloor.label}`,
    };
  }
  return {
    frame: 'overview',
    position: [4.8, 4.2, 7.2],
    target: [0, 1.6, 0],
    zoom: 1,
    label: `Overview camera: ${scene.building.name}`,
  };
}

export function buildCameraControlState(plan: CameraPlan, viewerState: ViewerState): CameraControlState {
  const animationMs = viewerState === 'development_overview' ? 900 : 650;
  const easing = viewerState === 'development_overview' ? 0.06 : 0.08;
  return {
    key: `${viewerState}:${plan.frame}`,
    position: plan.position,
    target: plan.target,
    zoom: plan.zoom,
    easing,
    animationMs,
    controlsEnabled: viewerState !== 'development_overview',
    label: `Camera controls: animated ${animationMs}ms · target ${plan.target.join(',')} · frame ${plan.frame}`,
  };
}
