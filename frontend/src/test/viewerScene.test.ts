import { describe, expect, it } from 'vitest';

import {
  buildCameraControlState,
  buildCameraPlan,
  buildAvailabilityState,
  buildLeadContextSummary,
  buildLeadCtaState,
  buildInteractionTrailSummary,
  buildLeadSuccessSummary,
  buildManagerFollowUpChecklist,
  buildBrokerNextStepScript,
  buildLeadHandoffDigest,
  buildLeadHandoffPersistenceState,
  buildLeadExportPayload,
  buildGroupedLeadExportFields,
  buildCrmExportAction,
  buildCrmCopyIntentSummary,
  buildEditorialShowroomDirection,
  buildMobileCrmHandoffState,
  buildMaterialTheme,
  buildResponsiveHudState,
  buildShareHandoffSummary,
  buildViewerAnalyticsEvent,
  buildViewerDeepLinkSearch,
  buildViewerDeepLinkState,
  buildRoomFootprints,
  buildScenePresentationState,
  buildShowroomAssetReadiness,
  buildUnitCard,
  buildUnitFootprints,
  buildViewpointAnchors,
  buildViewerScene,
  buildWindowHotspots,
  cameraMessageForState,
  polygonPoints,
  roomPlanStyle,
} from '../viewer/sceneAdapter';
import type { DevelopmentViewerPayload } from '../types';

const payload: DevelopmentViewerPayload = {
  id: 'dev_demo_premium',
  name: 'Estate3D Skyline',
  city: 'Москва',
  hero: { tagline: 'tag', headline: 'headline', lead: 'lead' },
  viewer_config: {},
  buildings: [
    {
      id: 'building_a',
      name: 'Корпус A',
      floors_count: 3,
      model: { kind: 'procedural_tower' },
      floors: [
        { id: 'floor_1', level: 1, label: '1 этаж', elevation: 3.25, units: [] },
        {
          id: 'floor_2',
          level: 2,
          label: '2 этаж',
          elevation: 6.5,
          units: [
            {
              id: 'unit_2_1',
              number: '21',
              area_m2: 61,
              rooms_count: 2,
              price: 'от 20 млн ₽',
              status: 'available',
              plan_polygon: [
                { x: -2, y: 1, z: 0 },
                { x: 4, y: 1, z: 0 },
                { x: 4, y: 7, z: 0 },
                { x: -2, y: 7, z: 0 },
              ],
              rooms: [
                {
                  id: 'room_living',
                  name: 'Гостиная',
                  area_m2: 24,
                  polygon: [
                    { x: -2, y: 1, z: 0 },
                    { x: 2, y: 1, z: 0 },
                    { x: 2, y: 4, z: 0 },
                    { x: -2, y: 4, z: 0 },
                  ],
                },
              ],
              viewpoints: [{ id: 'vp_living', room_id: 'room_living', label: 'Войти в гостиную', mode: 'walk', position: { x: 0, y: 1, z: 1.6 }, target: { x: 2, y: 4, z: 1.4 } }],
              window_views: [{ id: 'window_city', room_id: 'room_living', label: 'Вид из окна', image_url: '/window.jpg', direction_degrees: 120 }],
            },
          ],
        },
        { id: 'floor_3', level: 3, label: '3 этаж', elevation: 9.75, units: [] },
      ],
    },
  ],
};

describe('viewer scene adapter', () => {
  it('builds sorted R3F-ready render primitives from development payload', () => {
    const scene = buildViewerScene(payload);

    expect(scene.developmentId).toBe('dev_demo_premium');
    expect(scene.building.id).toBe('building_a');
    expect(scene.towerFloors.map((floor) => floor.label)).toEqual(['3 этаж', '2 этаж', '1 этаж']);
    expect(scene.towerFloors[1]).toMatchObject({ id: 'floor_2', level: 2, hasUnits: true, elevation: 6.5 });
    expect(scene.unitsByFloor.floor_2[0]).toMatchObject({ id: 'unit_2_1', number: '21', roomsCount: 2 });
  });

  it('normalizes room polygons into stable percent-based plan styles', () => {
    const unit = payload.buildings[0].floors[1].units[0];
    const room = unit.rooms[0];

    expect(polygonPoints(room)).toBe('-2,1 2,1 2,4 -2,4');
    expect(roomPlanStyle(room, unit)).toEqual({
      left: '0%',
      top: '0%',
      width: '66.67%',
      height: '50%',
    });
  });

  it('describes camera states independently from React component state', () => {
    const floor = payload.buildings[0].floors[1];
    const unit = floor.units[0];
    const viewpoint = unit.viewpoints[0];
    const windowView = unit.window_views[0];

    expect(cameraMessageForState({ viewerState: 'development_overview' })).toBe('Общий вид ЖК и плавный подлет к корпусу');
    expect(cameraMessageForState({ viewerState: 'floor_focus', selectedFloor: floor })).toBe('Камера поднимается на 2 этаж');
    expect(cameraMessageForState({ viewerState: 'unit_top_down', selectedUnit: unit })).toBe('Top-down план квартиры 21');
    expect(cameraMessageForState({ viewerState: 'walk_mode', selectedViewpoint: viewpoint })).toBe('Walk mode: Войти в гостиную');
    expect(cameraMessageForState({ viewerState: 'window_view', activeWindow: windowView })).toBe('Панорама из окна: Вид из окна');
  });

  it('builds deterministic camera target plans for overview, floor, and unit focus', () => {
    const scene = buildViewerScene(payload);
    const floor = payload.buildings[0].floors[1];
    const unit = floor.units[0];

    expect(buildCameraPlan({ scene, viewerState: 'development_overview' })).toEqual({
      frame: 'overview',
      position: [4.8, 4.2, 7.2],
      target: [0, 1.6, 0],
      zoom: 1,
      label: 'Overview camera: Корпус A',
    });
    expect(buildCameraPlan({ scene, viewerState: 'floor_focus', selectedFloor: floor })).toEqual({
      frame: 'floor_2',
      position: [3.8, 3.4, 5.6],
      target: [0, 0.65, 0],
      zoom: 1.18,
      label: 'Floor camera: 2 этаж',
    });
    expect(buildCameraPlan({ scene, viewerState: 'unit_top_down', selectedFloor: floor, selectedUnit: unit })).toEqual({
      frame: 'unit_2_1',
      position: [0, 6.15, 0.01],
      target: [0, 0.65, 0],
      zoom: 1.45,
      label: 'Unit camera: квартира 21',
    });
    expect(buildCameraPlan({ scene, viewerState: 'window_view', selectedFloor: floor, selectedUnit: unit, activeWindow: unit.window_views[0] })).toEqual({
      frame: 'window_city',
      position: [-0.87, 2.55, 1.3],
      target: [1.18, 2.55, -0.64],
      zoom: 1.64,
      label: 'Window camera: Вид из окна',
    });
  });

  it('describes animated camera controls for R3F transitions while preserving deterministic fallback data', () => {
    const scene = buildViewerScene(payload);
    const floor = payload.buildings[0].floors[1];
    const unit = floor.units[0];
    const viewpoint = unit.viewpoints[0];
    const plan = buildCameraPlan({ scene, viewerState: 'walk_mode', selectedFloor: floor, selectedUnit: unit, selectedViewpoint: viewpoint });

    expect(buildCameraControlState(plan, 'walk_mode')).toEqual({
      key: 'walk_mode:vp_living',
      position: [0, 2.25, 0.33],
      target: [0.67, 2.05, 1.33],
      zoom: 1.72,
      easing: 0.08,
      animationMs: 650,
      controlsEnabled: true,
      label: 'Camera controls: animated 650ms · target 0.67,2.05,1.33 · frame vp_living',
    });
  });

  it('maps warm no-black R3F material themes for floor, unit, room, and window states', () => {
    expect(buildMaterialTheme({ kind: 'floor', active: true, hasUnits: true })).toEqual({
      color: '#d9b56e',
      opacity: 0.96,
      emissive: '#8a611f',
      metalness: 0.18,
      roughness: 0.46,
      label: 'Material floor: active warm-gold',
    });
    expect(buildMaterialTheme({ kind: 'floor', hovered: true, hasUnits: true })).toMatchObject({
      color: '#c7d8d1',
      opacity: 0.88,
      label: 'Material floor: hover sage-highlight',
    });
    expect(buildMaterialTheme({ kind: 'floor', hasUnits: false })).toMatchObject({
      color: '#d8cbb7',
      opacity: 0.56,
      label: 'Material floor: empty warm-stone',
    });
    expect(buildMaterialTheme({ kind: 'unit', status: 'reserved' })).toMatchObject({
      color: '#d89b5f',
      opacity: 0.76,
      label: 'Material unit: reserved warm-reserve',
    });
    expect(buildMaterialTheme({ kind: 'unit', status: 'sold' })).toMatchObject({
      color: '#b8ad9d',
      opacity: 0.44,
      label: 'Material unit: sold warm-muted',
    });
    expect(buildMaterialTheme({ kind: 'room' })).toMatchObject({ color: '#c9b79c', opacity: 0.78, label: 'Material room: walkthrough warm-stone' });
    expect(buildMaterialTheme({ kind: 'window-hotspot' })).toMatchObject({ color: '#d9824b', opacity: 0.88, label: 'Material window-hotspot: sunset warm-view' });
  });

  it('describes selected reference mix as a warm editorial real-estate showroom direction', () => {
    expect(buildEditorialShowroomDirection()).toEqual({
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
    });
  });

  it('describes a premium 3D presentation layer with customer-facing labels instead of raw debug copy', () => {
    const scene = buildViewerScene(payload);
    const floor = payload.buildings[0].floors[1];
    const unit = floor.units[0];
    const presentation = buildScenePresentationState({ scene, selectedFloor: floor, selectedUnit: unit });

    expect(presentation).toEqual({
      shellClass: 'r3f-scene-shell warm-model-shell high-fidelity-showroom-model source-backed-architectural-model floor-emphasis unit-emphasis',
      skylineClass: 'r3f-skyline-massing premium-massing source-backed-depth selected-floor-emphasis selected-unit-emphasis',
      selectedFloorLabel: 'Выбран 2 этаж',
      selectedUnitLabel: 'Квартира 21 · 61 м² · от 20 млн ₽',
      unitTransitionLabel: 'Плавный переход к квартире 21',
      customerReadout: 'Корпус A · 2 этаж · квартира 21 · 1 вид из окна',
      debugVisibleByDefault: false,
      depthLayerLabel: 'Source-backed architectural depth · 3 massing layers · 16 facade bays · 4 foreground planes',
    });
    expect(presentation.customerReadout).not.toMatch(/R3F|debug|mesh|footprint/i);
    expect(presentation.depthLayerLabel).not.toMatch(/debug|raw|mesh/i);
  });

  it('builds customer-facing source asset readiness for the showroom model without exposing renderer/debug jargon', () => {
    const scene = buildViewerScene({
      ...payload,
      buildings: [
        {
          ...payload.buildings[0],
          model: {
            kind: 'source_backed_architectural_scene',
            source_url: '/demo/source/estate3d-skyline-massing.glb',
            preview_url: '/demo/editorial-development-hero.jpg',
            source_type: 'glb_model',
            source_quality: 'artist_approved',
            facade_bays: 16,
            foreground_planes: 4,
          },
        },
      ],
    });

    expect(buildShowroomAssetReadiness(scene)).toEqual({
      mode: 'source-backed',
      label: 'Основа сцены: подготовленная 3D-модель комплекса',
      detail: 'GLB · artist-approved · 16 фасадных модулей · 4 плана окружения',
      assetUrl: '/demo/source/estate3d-skyline-massing.glb',
      previewUrl: '/demo/editorial-development-hero.jpg',
      cardClass: 'showroom-asset-card source-backed-asset-ready customer-facing-asset-note',
      debugCopyVisible: false,
    });
  });

  it('describes premium empty and unavailable states for sparse floor/unit data', () => {
    const emptyFloor = payload.buildings[0].floors[0];
    const floor = payload.buildings[0].floors[1];
    const unitWithoutMedia = {
      ...floor.units[0],
      status: 'sold',
      viewpoints: [],
      window_views: [],
    };

    expect(buildAvailabilityState({ selectedFloor: emptyFloor })).toEqual({
      state: 'empty-floor',
      unitCount: 0,
      viewpointCount: 0,
      windowCount: 0,
      canChooseUnit: false,
      canWalk: false,
      canOpenWindow: false,
      label: 'Availability: empty floor · units 0 · viewpoints 0 · windows 0',
      hudMessage: 'На этом этаже пока нет доступных квартир — покажите другой этаж или оставьте заявку менеджеру.',
    });
    expect(buildAvailabilityState({ selectedFloor: floor, selectedUnit: unitWithoutMedia })).toEqual({
      state: 'unavailable-unit',
      unitCount: 1,
      viewpointCount: 0,
      windowCount: 0,
      canChooseUnit: false,
      canWalk: false,
      canOpenWindow: false,
      label: 'Availability: unavailable unit · units 1 · viewpoints 0 · windows 0',
      hudMessage: 'Квартира 21 сейчас недоступна для выбора, но её можно оставить в заявке менеджеру.',
    });
  });

  it('builds data-rich premium unit cards with status and sales copy', () => {
    const floor = payload.buildings[0].floors[1];
    const availableUnit = floor.units[0];
    const soldUnit = { ...availableUnit, status: 'sold' };

    expect(buildUnitCard({ floor, unit: availableUnit, active: true })).toEqual({
      title: 'Квартира 21',
      subtitle: '2 комнаты · 61 м² · от 20 млн ₽',
      statusBadge: 'Доступна',
      statusTone: 'available',
      availabilityCopy: 'Готова к просмотру: планировка, прогулка и вид из окна доступны.',
      ariaLabel: 'Квартира 21 · 2 комнаты · 61 м² · от 20 млн ₽ · Доступна',
      selectedLabel: 'Выбрана для заявки',
    });
    expect(buildUnitCard({ floor, unit: soldUnit, active: false })).toMatchObject({
      statusBadge: 'Продана',
      statusTone: 'sold',
      availabilityCopy: 'Недоступна для покупки, но менеджер может предложить похожие варианты на 2 этаж.',
      selectedLabel: '',
    });
  });

  it('summarizes lead context across development, building, floor, unit, viewer state, viewpoint, and window', () => {
    const building = payload.buildings[0];
    const floor = building.floors[1];
    const unit = floor.units[0];
    const viewpoint = unit.viewpoints[0];
    const windowView = unit.window_views[0];

    expect(
      buildLeadContextSummary({
        development: payload,
        building,
        selectedFloor: floor,
        selectedUnit: unit,
        selectedViewpoint: viewpoint,
        activeWindow: windowView,
        viewerState: 'window_view',
      }),
    ).toEqual({
      label: 'Lead context: Estate3D Skyline · Корпус A · 2 этаж · квартира 21 · window_view · Войти в гостиную · Вид из окна',
      message: 'Покупатель смотрит Estate3D Skyline, Корпус A, 2 этаж, квартира 21 (2 комнаты, 61 м², от 20 млн ₽). Состояние viewer: window_view. Точка просмотра: Войти в гостиную. Вид из окна: Вид из окна.',
    });
  });

  it('plans responsive premium HUD states for mobile and desktop fallback layouts', () => {
    expect(buildResponsiveHudState({ viewportWidth: 390, viewerState: 'window_view', hasSelectedUnit: true, hasLeadContext: true })).toEqual({
      mode: 'mobile',
      stageClass: 'viewer-stage responsive-mobile state-window_view has-unit has-lead-context',
      hudClass: 'viewer-hud mobile-stack compact-lead',
      label: 'Responsive HUD: mobile stack · sticky CTA · lead context visible',
    });
    expect(buildResponsiveHudState({ viewportWidth: 1180, viewerState: 'floor_focus', hasSelectedUnit: false, hasLeadContext: false })).toEqual({
      mode: 'desktop',
      stageClass: 'viewer-stage responsive-desktop state-floor_focus no-unit no-lead-context',
      hudClass: 'viewer-hud desktop-panel',
      label: 'Responsive HUD: desktop panel · exploratory browsing',
    });
  });

  it('builds copy-ready share handoff summaries for selected units', () => {
    const floor = payload.buildings[0].floors[1];
    const unit = floor.units[0];

    expect(buildShareHandoffSummary({ selectedFloor: floor, selectedUnit: unit, viewerState: 'window_view', shareLink: '/developments/demo-premium/viewer?floor=floor_2&unit=unit_2_1&view=window_view&viewpoint=vp_living&window=window_city' })).toEqual({
      label: 'Ссылка на выбранную квартиру готова: 2 этаж · квартира 21 · вид из окна',
      copy: 'Ссылка для клиента: /developments/demo-premium/viewer?floor=floor_2&unit=unit_2_1&view=window_view&viewpoint=vp_living&window=window_city',
      ariaLabel: 'Copy share link: 2 этаж · квартира 21 · вид из окна',
      cardClass: 'share-handoff-card glass-card desktop-inline',
      copyClass: 'share-handoff-copy copy-ready',
      buttonClass: 'share-copy-button premium-outline',
    });
  });

  it('builds premium lead CTA state contracts for idle, sending, success, and error flows', () => {
    expect(buildLeadCtaState('idle')).toEqual({
      status: 'idle',
      buttonDisabled: false,
      buttonClass: 'lead-submit-button ready',
      feedbackClass: 'lead-feedback idle',
      buttonLabel: 'Оставить заявку',
    });
    expect(buildLeadCtaState('sending')).toEqual({
      status: 'sending',
      buttonDisabled: true,
      buttonClass: 'lead-submit-button sending',
      feedbackClass: 'lead-feedback sending',
      buttonLabel: 'Отправляем заявку…',
    });
    expect(buildLeadCtaState('error')).toMatchObject({
      buttonDisabled: false,
      buttonClass: 'lead-submit-button retry',
      feedbackClass: 'lead-feedback error-card',
      buttonLabel: 'Повторить отправку',
    });
  });

  it('builds lightweight premium viewer analytics events with selected context', () => {
    const building = payload.buildings[0];
    const floor = building.floors[1];
    const unit = floor.units[0];
    const viewpoint = unit.viewpoints[0];
    const windowView = unit.window_views[0];

    expect(buildViewerAnalyticsEvent({ action: 'select_unit', development: payload, building, selectedFloor: floor, selectedUnit: unit, viewerState: 'unit_top_down' })).toEqual({
      eventName: 'premium_viewer_select_unit',
      label: 'Analytics: select_unit · Estate3D Skyline · Корпус A · 2 этаж · квартира 21 · unit_top_down',
      payload: {
        development_id: 'dev_demo_premium',
        development_name: 'Estate3D Skyline',
        building_id: 'building_a',
        building_name: 'Корпус A',
        floor_id: 'floor_2',
        floor_label: '2 этаж',
        unit_id: 'unit_2_1',
        unit_number: '21',
        viewer_state: 'unit_top_down',
      },
    });
    expect(buildViewerAnalyticsEvent({ action: 'lead_error', development: payload, building, selectedFloor: floor, selectedUnit: unit, selectedViewpoint: viewpoint, activeWindow: windowView, viewerState: 'window_view' }).label).toBe(
      'Analytics: lead_error · Estate3D Skyline · Корпус A · 2 этаж · квартира 21 · window_view · Войти в гостиную · Вид из окна',
    );
  });

  it('summarizes recent premium viewer interactions for sales handoff notes', () => {
    expect(
      buildInteractionTrailSummary([
        'Analytics: select_floor · Estate3D Skyline · Корпус A · 8 этаж · floor_focus',
        'Analytics: select_unit · Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · unit_top_down',
        'Analytics: enter_walk_mode · Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · walk_mode · Войти в гостиную',
        'Analytics: open_window_view · Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · window_view · Войти в гостиную · Вид из окна на город',
      ]),
    ).toEqual({
      label: 'Interaction trail: select_floor → select_unit → enter_walk_mode → open_window_view',
      copy: 'Путь клиента: 8 этаж → квартира 81 → Войти в гостиную → Вид из окна на город',
      managerNote: 'Менеджеру: клиент последовательно выбрал 8 этаж, квартиру 81, вошел в Войти в гостиную и открыл Вид из окна на город.',
      cardClass: 'interaction-trail-card glass-card manager-notes-ready',
    });

    expect(buildInteractionTrailSummary([])).toBeNull();
  });

  it('builds manager follow-up checklist from lead context, interaction trail, and share handoff', () => {
    const floor = payload.buildings[0].floors[1];
    const unit = floor.units[0];
    const leadContext = buildLeadContextSummary({
      development: payload,
      building: payload.buildings[0],
      selectedFloor: floor,
      selectedUnit: unit,
      selectedViewpoint: unit.viewpoints[0],
      activeWindow: unit.window_views[0],
      viewerState: 'window_view',
    });
    const interactionTrail = buildInteractionTrailSummary([
      'Analytics: select_floor · Estate3D Skyline · Корпус A · 2 этаж · floor_focus',
      'Analytics: select_unit · Estate3D Skyline · Корпус A · 2 этаж · квартира 21 · unit_top_down',
      'Analytics: open_window_view · Estate3D Skyline · Корпус A · 2 этаж · квартира 21 · window_view · Вид из окна',
    ]);
    const shareHandoff = buildShareHandoffSummary({ selectedFloor: floor, selectedUnit: unit, viewerState: 'window_view', shareLink: '/developments/demo-premium/viewer?floor=floor_2&unit=unit_2_1&view=window_view' });

    expect(buildManagerFollowUpChecklist({ leadContext, interactionTrail, shareHandoff, selectedUnit: unit })).toEqual({
      label: 'Manager follow-up: квартира 21 · available · 3 шага',
      items: [
        'Уточнить бюджет и срок покупки по квартире 21.',
        'Отправить клиенту ссылку: /developments/demo-premium/viewer?floor=floor_2&unit=unit_2_1&view=window_view',
        'Обсудить просмотренный путь: Путь клиента: 2 этаж → квартира 21 → Вид из окна',
      ],
      copy: 'CRM note: Lead context: Estate3D Skyline · Корпус A · 2 этаж · квартира 21 · window_view · Войти в гостиную · Вид из окна · follow-up for available unit.',
      cardClass: 'manager-follow-up-card glass-card crm-ready',
    });
  });

  it('builds broker next-step script from manager follow-up and share context', () => {
    const floor = payload.buildings[0].floors[1];
    const unit = floor.units[0];
    const leadContext = buildLeadContextSummary({
      development: payload,
      building: payload.buildings[0],
      selectedFloor: floor,
      selectedUnit: unit,
      selectedViewpoint: unit.viewpoints[0],
      activeWindow: unit.window_views[0],
      viewerState: 'window_view',
    });
    const shareHandoff = buildShareHandoffSummary({ selectedFloor: floor, selectedUnit: unit, viewerState: 'window_view', shareLink: '/developments/demo-premium/viewer?floor=floor_2&unit=unit_2_1&view=window_view' });
    const managerFollowUp = buildManagerFollowUpChecklist({ leadContext, interactionTrail: null, shareHandoff, selectedUnit: unit });

    expect(buildBrokerNextStepScript({ leadContext, managerFollowUp, shareHandoff, selectedUnit: unit })).toEqual({
      label: 'Broker script: квартира 21 · window_view · ready to send',
      opener: 'Здравствуйте! Видел ваш интерес к квартире 21 в Estate3D Skyline — могу прислать короткую подборку и ответить по бюджету/срокам.',
      clientNextStep: 'Предложить клиенту открыть ссылку и выбрать удобное время для звонка: /developments/demo-premium/viewer?floor=floor_2&unit=unit_2_1&view=window_view',
      managerNote: 'Broker script note: квартира 21 · available · window_view · follow-up ready.',
      cardClass: 'broker-script-card glass-card client-ready',
    });
    expect(buildBrokerNextStepScript({ leadContext: null, managerFollowUp, shareHandoff, selectedUnit: unit })).toBeNull();
  });

  it('builds compact premium lead handoff digest from sales handoff blocks', () => {
    const floor = payload.buildings[0].floors[1];
    const unit = floor.units[0];
    const leadContext = buildLeadContextSummary({
      development: payload,
      building: payload.buildings[0],
      selectedFloor: floor,
      selectedUnit: unit,
      selectedViewpoint: unit.viewpoints[0],
      activeWindow: unit.window_views[0],
      viewerState: 'window_view',
    });
    const interactionTrail = buildInteractionTrailSummary([
      'Analytics: select_floor · Estate3D Skyline · Корпус A · 2 этаж · floor_focus',
      'Analytics: select_unit · Estate3D Skyline · Корпус A · 2 этаж · квартира 21 · unit_top_down',
      'Analytics: open_window_view · Estate3D Skyline · Корпус A · 2 этаж · квартира 21 · window_view · Вид из окна',
    ]);
    const shareHandoff = buildShareHandoffSummary({ selectedFloor: floor, selectedUnit: unit, viewerState: 'window_view', shareLink: '/developments/demo-premium/viewer?floor=floor_2&unit=unit_2_1&view=window_view' });
    const managerFollowUp = buildManagerFollowUpChecklist({ leadContext, interactionTrail, shareHandoff, selectedUnit: unit });
    const brokerScript = buildBrokerNextStepScript({ leadContext, managerFollowUp, shareHandoff, selectedUnit: unit });

    expect(buildLeadHandoffDigest({ leadContext, interactionTrail, managerFollowUp, brokerScript, shareHandoff, selectedUnit: unit })).toEqual({
      label: 'Sales-room digest: квартира 21 · window_view · 5 блоков',
      recap: 'Клиент смотрел квартира 21 в режиме window_view; путь: Путь клиента: 2 этаж → квартира 21 → Вид из окна; следующий шаг: Предложить клиенту открыть ссылку и выбрать удобное время для звонка: /developments/demo-premium/viewer?floor=floor_2&unit=unit_2_1&view=window_view',
      managerOneLiner: 'Digest note: квартира 21 · available · window_view · share ready · follow-up ready.',
      cardClass: 'lead-handoff-digest-card glass-card sales-room-ready',
    });
    expect(buildLeadHandoffDigest({ leadContext: null, interactionTrail, managerFollowUp, brokerScript, shareHandoff, selectedUnit: unit })).toBeNull();
  });

  it('builds lead handoff persistence states for sending, error, and success', () => {
    const digest = {
      label: 'Sales-room digest: квартира 21 · window_view · 5 блоков',
      recap: 'Клиент смотрел квартира 21 в режиме window_view; путь: Путь клиента: 2 этаж → квартира 21 → Вид из окна; следующий шаг: отправить ссылку',
      managerOneLiner: 'Digest note: квартира 21 · available · window_view · share ready · follow-up ready.',
      cardClass: 'lead-handoff-digest-card glass-card sales-room-ready',
    };

    expect(buildLeadHandoffPersistenceState({ digest, status: 'sending' })).toEqual({
      label: 'Digest persistence: sending · sales-room context locked',
      copy: 'Сохраняем digest рядом с заявкой: квартира 21 · available · window_view · share ready · follow-up ready.',
      badge: 'Digest закреплен при отправке',
      cardClass: 'lead-handoff-persistence-card sending copy-ready',
    });
    expect(buildLeadHandoffPersistenceState({ digest, status: 'error' })).toMatchObject({
      label: 'Digest persistence: error · retry keeps sales-room context',
      badge: 'Digest сохранен для повтора',
      cardClass: 'lead-handoff-persistence-card error copy-ready',
    });
    expect(buildLeadHandoffPersistenceState({ digest, status: 'success' })).toMatchObject({
      label: 'Digest persistence: success · manager handoff ready',
      badge: 'Digest готов для менеджера',
      cardClass: 'lead-handoff-persistence-card success copy-ready',
    });
    expect(buildLeadHandoffPersistenceState({ digest: null, status: 'success' })).toBeNull();
  });

  it('builds CRM export-ready lead payload copy from digest and handoff blocks', () => {
    const leadContext = {
      label: 'Lead context: Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · window_view · Войти в гостиную · Вид из окна на город',
      message: 'Клиент смотрит Estate3D Skyline, Корпус A, 8 этаж, квартира 81 в режиме window_view.',
      payload: {
        development: 'Estate3D Skyline',
        building: 'Корпус A',
        floor: '8 этаж',
        unit: 'квартира 81',
        viewer_state: 'window_view',
      },
    };
    const shareHandoff = {
      label: 'Ссылка на выбранную квартиру готова: 8 этаж · квартира 81 · window_view',
      copy: 'Copy-ready link: /developments/demo-premium/viewer?floor=floor_8',
      ariaLabel: 'Скопировать ссылку для менеджера: 8 этаж · квартира 81 · window_view',
      cardClass: 'share-handoff-card glass-card copy-ready',
      buttonClass: 'share-handoff-button',
      copyClass: 'share-handoff-copy',
    };
    const digest = {
      label: 'Sales-room digest: квартира 81 · window_view · 5 блоков',
      recap: 'Клиент смотрел квартира 81 в режиме window_view; путь: Путь клиента: 8 этаж → квартира 81 → Вид из окна; следующий шаг: отправить ссылку',
      managerOneLiner: 'Digest note: квартира 81 · available · window_view · share ready · follow-up ready.',
      cardClass: 'lead-handoff-digest-card glass-card sales-room-ready',
    };
    const persistence = buildLeadHandoffPersistenceState({ digest, status: 'success' });
    const managerFollowUp = {
      label: 'Manager follow-up: 4 шага · квартира 81',
      items: ['Открыть ссылку', 'Подтвердить интерес'],
      copy: 'Follow-up note: открыть ссылку и подтвердить интерес.',
      cardClass: 'manager-follow-up-card glass-card crm-ready',
    };
    const brokerScript = {
      label: 'Broker script: квартира 81 · share-ready',
      opener: 'Здравствуйте! Отправляю ссылку на квартиру 81.',
      clientNextStep: 'Следующий шаг: открыть ссылку и выбрать время звонка.',
      managerNote: 'Broker note: отправить ссылку и назначить звонок.',
      cardClass: 'broker-script-card glass-card client-ready',
    };

    expect(buildLeadExportPayload({ leadContext, shareHandoff, digest, persistence, managerFollowUp, brokerScript })).toEqual({
      label: 'CRM export payload: Estate3D Skyline · квартира 81 · window_view',
      copy: 'CRM payload: Estate3D Skyline | Корпус A | 8 этаж | квартира 81 | window_view | Copy-ready link: /developments/demo-premium/viewer?floor=floor_8 | Digest note: квартира 81 · available · window_view · share ready · follow-up ready. | Digest готов для менеджера | Следующий шаг: открыть ссылку и выбрать время звонка.',
      managerOneLiner: 'Export note: квартира 81 · window_view · share+digest+next-step ready.',
      cardClass: 'lead-export-payload-card glass-card crm-export-ready',
    });
    expect(buildLeadExportPayload({ leadContext: null, shareHandoff, digest, persistence, managerFollowUp, brokerScript })).toBeNull();
  });

  it('groups CRM export payload fields into manager-readable sections', () => {
    const exportPayload = {
      label: 'CRM export payload: Estate3D Skyline · квартира 81 · window_view',
      copy: 'CRM payload: Estate3D Skyline | Корпус A | 8 этаж | квартира 81 | window_view | Copy-ready link: /developments/demo-premium/viewer?floor=floor_8 | Digest note: квартира 81 · available · window_view · share ready · follow-up ready. | Digest готов для менеджера | Следующий шаг: открыть ссылку и выбрать время звонка.',
      managerOneLiner: 'Export note: квартира 81 · window_view · share+digest+next-step ready.',
      cardClass: 'lead-export-payload-card glass-card crm-export-ready',
    };

    expect(buildGroupedLeadExportFields(exportPayload)).toEqual({
      label: 'CRM fields: Estate3D Skyline · квартира 81 · window_view · 4 группы',
      groups: [
        { title: 'Context', rows: ['ЖК: Estate3D Skyline', 'Корпус: Корпус A', 'Этаж: 8 этаж', 'Квартира: квартира 81', 'Viewer state: window_view'] },
        { title: 'Share', rows: ['Copy-ready link: /developments/demo-premium/viewer?floor=floor_8'] },
        { title: 'Digest', rows: ['Digest note: квартира 81 · available · window_view · share ready · follow-up ready.', 'Digest готов для менеджера'] },
        { title: 'Next step', rows: ['Следующий шаг: открыть ссылку и выбрать время звонка.'] },
      ],
      cardClass: 'lead-export-fields-card glass-card crm-field-groups copy-ready',
    });
    expect(buildGroupedLeadExportFields(null)).toBeNull();
  });

  it('builds copy-ready CRM export action text from grouped field rows', () => {
    const groupedFields = {
      label: 'CRM fields: Estate3D Skyline · квартира 81 · window_view · 4 группы',
      groups: [
        { title: 'Context', rows: ['ЖК: Estate3D Skyline', 'Корпус: Корпус A', 'Этаж: 8 этаж', 'Квартира: квартира 81', 'Viewer state: window_view'] },
        { title: 'Share', rows: ['Copy-ready link: /developments/demo-premium/viewer?floor=floor_8'] },
        { title: 'Digest', rows: ['Digest note: квартира 81 · available · window_view · share ready · follow-up ready.', 'Digest готов для менеджера'] },
        { title: 'Next step', rows: ['Следующий шаг: открыть ссылку и выбрать время звонка.'] },
      ],
      cardClass: 'lead-export-fields-card glass-card crm-field-groups copy-ready',
    };

    expect(buildCrmExportAction(groupedFields)).toEqual({
      label: 'CRM copy action: квартира 81 · вид из окна · 9 полей',
      buttonLabel: 'Скопировать CRM block',
      ariaLabel: 'Copy CRM export block to clipboard: квартира 81 · вид из окна · manager-ready',
      plainText: 'Context\n- ЖК: Estate3D Skyline\n- Корпус: Корпус A\n- Этаж: 8 этаж\n- Квартира: квартира 81\n- Viewer state: window_view\n\nShare\n- Copy-ready link: /developments/demo-premium/viewer?floor=floor_8\n\nDigest\n- Digest note: квартира 81 · available · window_view · share ready · follow-up ready.\n- Digest готов для менеджера\n\nNext step\n- Следующий шаг: открыть ссылку и выбрать время звонка.',
      cardClass: 'crm-export-action-card glass-card copy-action-ready',
      textClass: 'crm-export-action-text copy-ready',
      buttonClass: 'crm-export-action-button premium-outline',
    });
    expect(buildCrmExportAction(null)).toBeNull();
  });

  it('builds CRM copy intent analytics summaries for manager audit trail', () => {
    const action = {
      label: 'CRM copy action: квартира 81 · вид из окна · 9 полей',
      buttonLabel: 'Скопировать CRM block',
      ariaLabel: 'Copy CRM export block: квартира 81 · window_view',
      plainText: 'Context\n- ЖК: Estate3D Skyline\n- Корпус: Корпус A',
      cardClass: 'crm-export-action-card glass-card copy-action-ready',
      textClass: 'crm-export-action-text copy-ready',
      buttonClass: 'crm-export-action-button premium-outline',
    };

    expect(buildCrmCopyIntentSummary({ status: 'copied', action })).toEqual({
      analyticsAction: 'crm_copy_success',
      label: 'CRM copy audit: copied · квартира 81 · вид из окна · 9 полей',
      managerNote: 'CRM copy audit: менеджер скопировал 9 полей for квартира 81 · вид из окна.',
      cardClass: 'crm-copy-audit-card glass-card copied',
    });
    expect(buildCrmCopyIntentSummary({ status: 'error', action })).toEqual({
      analyticsAction: 'crm_copy_error',
      label: 'CRM copy audit: fallback · квартира 81 · вид из окна · 9 полей',
      managerNote: 'CRM copy audit: clipboard fallback, CRM block остается copy-ready вручную for квартира 81 · вид из окна.',
      cardClass: 'crm-copy-audit-card glass-card error',
    });
    expect(buildCrmCopyIntentSummary({ status: 'copied', action: null })).toBeNull();
  });

  it('builds mobile CRM handoff density classes for compact sales demos', () => {
    const action = {
      label: 'CRM copy action: квартира 81 · вид из окна · 9 полей',
      buttonLabel: 'Скопировать CRM block',
      ariaLabel: 'Copy CRM export block: квартира 81 · window_view',
      plainText: 'Context\n- ЖК: Estate3D Skyline\n- Корпус: Корпус A\n\nShare\n- Copy-ready link: /developments/demo-premium/viewer?floor=floor_8&unit=unit_8_1&view=window_view&viewpoint=vp_living&window=window_city\n\nDigest\n- Digest note: квартира 81 · available · window_view · share ready · follow-up ready.\n- Digest готов для менеджера\n\nNext step\n- Предложить клиенту открыть ссылку и выбрать удобное время для звонка.',
      cardClass: 'crm-export-action-card glass-card copy-action-ready',
      textClass: 'crm-export-action-text copy-ready',
      buttonClass: 'crm-export-action-button premium-outline',
    };

    expect(buildMobileCrmHandoffState({ viewportWidth: 390, action, hasAuditTrail: true, hasCopyFeedback: true })).toEqual({
      mode: 'mobile',
      label: 'Mobile CRM handoff: compact · 9 полей · audit visible · feedback visible',
      stackClass: 'crm-handoff-stack mobile-density compact-copy audit-visible feedback-visible',
      actionCardClass: 'crm-export-action-card glass-card copy-action-ready mobile-density compact-copy',
      textClass: 'crm-export-action-text copy-ready mobile-scroll-safe',
      auditClass: 'crm-copy-audit-card glass-card mobile-density audit-visible',
    });
    expect(buildMobileCrmHandoffState({ viewportWidth: 1180, action, hasAuditTrail: false, hasCopyFeedback: false })).toMatchObject({
      mode: 'desktop',
      label: 'Mobile CRM handoff: desktop · 9 полей · audit hidden · feedback hidden',
    });
    expect(buildMobileCrmHandoffState({ viewportWidth: 390, action: null, hasAuditTrail: false, hasCopyFeedback: false })).toBeNull();
  });

  it('builds premium lead success summaries with viewer context and follow-up copy', () => {
    const floor = payload.buildings[0].floors[1];
    const unit = floor.units[0];

    expect(buildLeadSuccessSummary({ leadId: 'lead_123', selectedFloor: floor, selectedUnit: unit, viewerState: 'window_view', shareLink: '/developments/demo-premium/viewer?floor=floor_2&unit=unit_2_1&view=window_view' })).toEqual({
      label: 'Заявка отправлена: #lead_123 · 2 этаж · квартира 21 · window_view',
      nextAction: 'Менеджер получает контекст просмотра и ссылку для продолжения: /developments/demo-premium/viewer?floor=floor_2&unit=unit_2_1&view=window_view',
      cardClass: 'lead-success-card glass-card follow-up-ready',
    });
  });

  it('parses and serializes shareable deep links into safe viewer selection state', () => {
    const building = payload.buildings[0];
    const floor = building.floors[1];
    const unit = floor.units[0];

    expect(buildViewerDeepLinkState({ building, search: '?floor=floor_2&unit=unit_2_1&view=window_view&window=window_city' })).toEqual({
      viewerState: 'window_view',
      selectedFloorId: 'floor_2',
      selectedUnitId: 'unit_2_1',
      selectedViewpointId: 'vp_living',
      activeWindowId: 'window_city',
      label: 'Deep link: 2 этаж · квартира 21 · window_view · Вид из окна',
    });
    expect(buildViewerDeepLinkSearch({ selectedFloor: floor, selectedUnit: unit, selectedViewpoint: unit.viewpoints[0], activeWindow: unit.window_views[0], viewerState: 'window_view' })).toBe('?floor=floor_2&unit=unit_2_1&view=window_view&viewpoint=vp_living&window=window_city');
    expect(buildViewerDeepLinkState({ building, search: '?floor=missing&unit=bad&view=window_view' })).toEqual({
      viewerState: 'development_overview',
      selectedFloorId: null,
      selectedUnitId: null,
      selectedViewpointId: null,
      activeWindowId: null,
      label: 'Deep link: overview fallback',
    });
  });

  it('builds unit footprint primitives for the selected floor', () => {
    const floor = payload.buildings[0].floors[1];

    expect(buildUnitFootprints(floor)).toEqual([
      {
        id: 'unit_2_1',
        number: '21',
        label: 'квартира 21',
        status: 'available',
        center: [0.33, 0.73, 1.33],
        size: [2, 0.06, 2],
      },
    ]);
  });

  it('builds room footprint primitives for the selected apartment', () => {
    const floor = payload.buildings[0].floors[1];
    const unit = floor.units[0];

    expect(buildRoomFootprints(unit, floor)).toEqual([
      {
        id: 'room_living',
        name: 'Гостиная',
        label: 'Гостиная',
        areaM2: 24,
        center: [0, 0.81, 0.83],
        size: [1.33, 0.04, 1],
      },
    ]);
  });

  it('builds window hotspot primitives for the selected apartment', () => {
    const floor = payload.buildings[0].floors[1];
    const unit = floor.units[0];

    expect(buildWindowHotspots(unit, floor)).toEqual([
      {
        id: 'window_city',
        roomId: 'room_living',
        label: 'Вид из окна',
        directionDegrees: 120,
        center: [0, 0.87, 0.83],
        size: [0.36, 0.1, 0.1],
      },
    ]);
  });

  it('builds room viewpoint anchors and targets walk mode camera from the selected viewpoint', () => {
    const scene = buildViewerScene(payload);
    const floor = payload.buildings[0].floors[1];
    const unit = floor.units[0];
    const viewpoint = unit.viewpoints[0];

    expect(buildViewpointAnchors(unit, floor)).toEqual([
      {
        id: 'vp_living',
        roomId: 'room_living',
        label: 'Войти в гостиную',
        position: [0, 2.25, 0.33],
        target: [0.67, 2.05, 1.33],
      },
    ]);
    expect(buildCameraPlan({ scene, viewerState: 'walk_mode', selectedFloor: floor, selectedUnit: unit, selectedViewpoint: viewpoint })).toEqual({
      frame: 'vp_living',
      position: [0, 2.25, 0.33],
      target: [0.67, 2.05, 1.33],
      zoom: 1.72,
      label: 'Viewpoint camera: Войти в гостиную',
    });
  });
});
