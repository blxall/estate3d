import { useMemo, useState } from 'react';

import type { DevelopmentFloor, DevelopmentUnit, DevelopmentViewerPayload } from '../types';

type Props = {
  development: DevelopmentViewerPayload;
};

export function DevelopmentViewer({ development }: Props) {
  const building = development.buildings[0];
  const [selectedFloor, setSelectedFloor] = useState<DevelopmentFloor | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<DevelopmentUnit | null>(null);
  const [showWindowView, setShowWindowView] = useState(false);

  const towerFloors = useMemo(() => [...building.floors].sort((a, b) => b.level - a.level), [building.floors]);
  const activeWindow = selectedUnit?.window_views[0] ?? null;

  function chooseFloor(floor: DevelopmentFloor) {
    setSelectedFloor(floor);
    setSelectedUnit(null);
    setShowWindowView(false);
  }

  function chooseUnit(unit: DevelopmentUnit) {
    setSelectedUnit(unit);
    setShowWindowView(false);
  }

  return (
    <main className="development-viewer">
      <section className="viewer-hero">
        <p className="eyebrow">Premium Interactive Development Viewer</p>
        <h1>{development.name}</h1>
        <p className="viewer-tagline">{development.hero.tagline}</p>
        <p>{development.hero.lead}</p>
      </section>

      <section className="viewer-stage" aria-label="Интерактивная 3D сцена ЖК">
        <div className="viewer-scene">
          <div className="camera-path">
            {selectedUnit
              ? `Top-down план квартиры ${selectedUnit.number}`
              : selectedFloor
                ? `Камера поднимается на ${selectedFloor.label}`
                : 'Общий вид ЖК и плавный подлет к корпусу'}
          </div>
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
                  </div>
                ))}
              </div>
              {activeWindow && (
                <button type="button" className="window-button" onClick={() => setShowWindowView(true)}>
                  {activeWindow.label}
                </button>
              )}
            </div>
          )}

          {showWindowView && activeWindow && (
            <div className="window-view-card">
              <p className="eyebrow">Панорама из окна</p>
              <h3>{activeWindow.label}</h3>
              <p>Заготовленный вид: {activeWindow.image_url}</p>
              <p>Направление камеры: {activeWindow.direction_degrees}°</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
