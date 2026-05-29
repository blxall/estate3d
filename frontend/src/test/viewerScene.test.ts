import { describe, expect, it } from 'vitest';

import { buildCameraPlan, buildRoomFootprints, buildUnitFootprints, buildViewerScene, cameraMessageForState, polygonPoints, roomPlanStyle } from '../viewer/sceneAdapter';
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
});
