import { useMemo, useState } from 'react';

import type { DevelopmentFloor, DevelopmentRoom, DevelopmentUnit, DevelopmentViewerPayload, DevelopmentViewpoint } from '../types';

type Props = {
  development: DevelopmentViewerPayload;
};

type ViewerState = 'development_overview' | 'floor_focus' | 'unit_top_down' | 'walk_mode' | 'window_view';

function polygonPoints(room: DevelopmentRoom): string {
  return room.polygon.map((point) => `${point.x},${point.y}`).join(' ');
}

function planStyle(room: DevelopmentRoom): React.CSSProperties {
  if (room.polygon.length === 0) {
    return {};
  }
  const xs = room.polygon.map((point) => point.x);
  const ys = room.polygon.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    left: `${minX * 9 + 8}%`,
    top: `${minY * 7 + 8}%`,
    width: `${Math.max(18, (maxX - minX) * 9)}%`,
    height: `${Math.max(18, (maxY - minY) * 7)}%`,
  };
}

export function DevelopmentViewer({ development }: Props) {
  const building = development.buildings[0];
  const [viewerState, setViewerState] = useState<ViewerState>('development_overview');
  const [selectedFloor, setSelectedFloor] = useState<DevelopmentFloor | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<DevelopmentUnit | null>(null);
  const [selectedViewpoint, setSelectedViewpoint] = useState<DevelopmentViewpoint | null>(null);
  const [leadMessage, setLeadMessage] = useState('');

  const towerFloors = useMemo(() => [...building.floors].sort((a, b) => b.level - a.level), [building.floors]);
  const activeWindow = selectedUnit?.window_views[0] ?? null;
  const firstViewpoint = selectedUnit?.viewpoints[0] ?? null;

  function chooseFloor(floor: DevelopmentFloor) {
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

  function prepareLead() {
    setLeadMessage(`Заявка подготовлена: ${development.name}, ${building.name}, ${selectedFloor?.label ?? 'этаж не выбран'}, квартира ${selectedUnit?.number ?? 'не выбрана'}`);
  }

  const cameraMessage =
    viewerState === 'window_view' && activeWindow
      ? `Панорама из окна: ${activeWindow.label}`
      : viewerState === 'walk_mode' && selectedViewpoint
        ? `Walk mode: ${selectedViewpoint.label}`
        : viewerState === 'unit_top_down' && selectedUnit
          ? `Top-down план квартиры ${selectedUnit.number}`
          : viewerState === 'floor_focus' && selectedFloor
            ? `Камера поднимается на ${selectedFloor.label}`
            : 'Общий вид ЖК и плавный подлет к корпусу';

  return (
    <main className={`development-viewer state-${viewerState}`}>
      <section className="viewer-hero">
        <p className="eyebrow">Premium Interactive Development Viewer</p>
        <h1>{development.name}</h1>
        <p className="viewer-tagline">{development.hero.tagline}</p>
        <p>{development.hero.lead}</p>
      </section>

      <section className="viewer-stage" aria-label="Интерактивная 3D сцена ЖК">
        <div className="viewer-scene">
          <div className="state-pill">State: {viewerState}</div>
          <div className="camera-path">{cameraMessage}</div>
          <div className="procedural-tower" aria-label={building.name}>
            {towerFloors.map((floor) => (
              <button
                key={floor.id}
                type="button"
                className={`tower-floor ${selectedFloor?.id === floor.id ? 'active' : ''} ${floor.units.length > 0 ? 'has-units' : ''}`}
                onClick={() => chooseFloor(floor)}
              >
                {floor.label}
              </button>
            ))}
          </div>

          {selectedUnit && (
            <div className="floating-plan" aria-label={`Планировка квартиры ${selectedUnit.number}`}>
              {selectedUnit.rooms.map((room) => (
                <div key={room.id} className="plan-room" style={planStyle(room)}>
                  <span>{room.name}</span>
                </div>
              ))}
            </div>
          )}

          {viewerState === 'walk_mode' && selectedViewpoint && (
            <div className="walk-mode-card">
              <p className="eyebrow">Walk mode</p>
              <h3>Walk mode: {selectedViewpoint.label}</h3>
              <p>
                Камера: {selectedViewpoint.position.x}, {selectedViewpoint.position.y}, {selectedViewpoint.position.z} → target {selectedViewpoint.target.x}, {selectedViewpoint.target.y}, {selectedViewpoint.target.z}
              </p>
            </div>
          )}
        </div>

        <aside className="viewer-hud">
          <p className="eyebrow">{building.name}</p>
          <h2>{selectedFloor ? selectedFloor.label : 'Выберите этаж'}</h2>
          {!selectedFloor && <p>Нажмите на 8 этаж, чтобы увидеть доступные квартиры и перейти в режим плана.</p>}

          {selectedFloor && selectedFloor.units.length === 0 && <p>Для демо наполнен 8 этаж. Остальные этажи показывают механику выбора.</p>}

          {selectedFloor && selectedFloor.units.length > 0 && (
            <div className="unit-list">
              {selectedFloor.units.map((unit) => (
                <button key={unit.id} type="button" onClick={() => chooseUnit(unit)} className={selectedUnit?.id === unit.id ? 'active' : ''}>
                  Квартира {unit.number} · {unit.area_m2} м² · {unit.price}
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
                <button type="button" className="walk-button" onClick={() => enterWalkMode(firstViewpoint)}>
                  {firstViewpoint.label}
                </button>
              )}
              {activeWindow && (
                <button type="button" className="window-button" onClick={showWindowView}>
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

          {selectedUnit && (
            <div className="lead-card">
              <p className="eyebrow">Sales CTA</p>
              <h3>Зафиксировать интерес</h3>
              <p>Передаем менеджеру контекст просмотра: ЖК, корпус, этаж, квартира, режим камеры.</p>
              <button type="button" onClick={prepareLead}>Оставить заявку</button>
              {leadMessage && <p className="lead-message">{leadMessage}</p>}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
