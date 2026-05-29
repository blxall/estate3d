import { describe, expect, it } from 'vitest';

import {
  buildCameraControlState,
  buildCameraPlan,
  buildAvailabilityState,
  buildLeadContextSummary,
  buildMaterialTheme,
  buildResponsiveHudState,
  buildShareHandoffSummary,
  buildViewerDeepLinkSearch,
  buildViewerDeepLinkState,
  buildRoomFootprints,
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

  it('maps premium R3F material themes for floor, unit, room, and window states', () => {
    expect(buildMaterialTheme({ kind: 'floor', active: true, hasUnits: true })).toEqual({
      color: '#f6d77b',
      opacity: 0.98,
      emissive: '#7c5f1b',
      metalness: 0.42,
      roughness: 0.38,
      label: 'Material floor: active premium-gold',
    });
    expect(buildMaterialTheme({ kind: 'floor', hovered: true, hasUnits: true })).toMatchObject({
      color: '#7dd3fc',
      opacity: 0.9,
      label: 'Material floor: hover sky-highlight',
    });
    expect(buildMaterialTheme({ kind: 'floor', hasUnits: false })).toMatchObject({
      color: '#24344d',
      opacity: 0.42,
      label: 'Material floor: empty muted-shell',
    });
    expect(buildMaterialTheme({ kind: 'unit', status: 'reserved' })).toMatchObject({
      color: '#fb923c',
      opacity: 0.74,
      label: 'Material unit: reserved warm-reserve',
    });
    expect(buildMaterialTheme({ kind: 'unit', status: 'sold' })).toMatchObject({
      color: '#64748b',
      opacity: 0.34,
      label: 'Material unit: sold muted-unavailable',
    });
    expect(buildMaterialTheme({ kind: 'room' })).toMatchObject({ color: '#a78bfa', opacity: 0.82, label: 'Material room: walkthrough violet' });
    expect(buildMaterialTheme({ kind: 'window-hotspot' })).toMatchObject({ color: '#f97316', opacity: 0.92, label: 'Material window-hotspot: sunset view-hotspot' });
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
      label: 'Share handoff: 2 этаж · квартира 21 · window_view',
      copy: 'Ссылка для клиента: /developments/demo-premium/viewer?floor=floor_2&unit=unit_2_1&view=window_view&viewpoint=vp_living&window=window_city',
      ariaLabel: 'Copy share link: 2 этаж · квартира 21 · window_view',
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
