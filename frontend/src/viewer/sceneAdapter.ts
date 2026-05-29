import type {
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
      return { color: '#f6d77b', opacity: 0.98, emissive: '#7c5f1b', metalness: 0.42, roughness: 0.38, label: 'Material floor: active premium-gold' };
    }
    if (hovered) {
      return { color: '#7dd3fc', opacity: 0.9, emissive: '#075985', metalness: 0.28, roughness: 0.42, label: 'Material floor: hover sky-highlight' };
    }
    if (!hasUnits) {
      return { color: '#24344d', opacity: 0.42, emissive: '#020617', metalness: 0.12, roughness: 0.7, label: 'Material floor: empty muted-shell' };
    }
    return { color: '#4aa3ff', opacity: 0.72, emissive: '#0f3c68', metalness: 0.2, roughness: 0.48, label: 'Material floor: available blue-glass' };
  }
  if (kind === 'unit') {
    if (active) {
      return { color: '#f6d77b', opacity: 0.94, emissive: '#7c5f1b', metalness: 0.36, roughness: 0.4, label: 'Material unit: active premium-gold' };
    }
    if (status === 'sold') {
      return { color: '#64748b', opacity: 0.34, emissive: '#0f172a', metalness: 0.12, roughness: 0.76, label: 'Material unit: sold muted-unavailable' };
    }
    if (status === 'reserved') {
      return { color: '#fb923c', opacity: 0.74, emissive: '#7c2d12', metalness: 0.24, roughness: 0.48, label: 'Material unit: reserved warm-reserve' };
    }
    return { color: '#22d3ee', opacity: 0.72, emissive: '#164e63', metalness: 0.22, roughness: 0.46, label: 'Material unit: available cyan-glass' };
  }
  if (kind === 'room') {
    return { color: '#a78bfa', opacity: 0.82, emissive: '#4c1d95', metalness: 0.18, roughness: 0.5, label: 'Material room: walkthrough violet' };
  }
  if (kind === 'window-hotspot') {
    return { color: '#f97316', opacity: 0.92, emissive: '#7c2d12', metalness: 0.3, roughness: 0.36, label: 'Material window-hotspot: sunset view-hotspot' };
  }
  return { color: '#0f172a', opacity: 0.18, emissive: '#020617', metalness: 0.2, roughness: 0.62, label: 'Material tower-shell: midnight glass' };
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
