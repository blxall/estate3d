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
