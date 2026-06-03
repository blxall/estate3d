import type { DevelopmentViewpoint } from '../types';

type Props = {
  viewpoint: DevelopmentViewpoint;
};

export function WalkModePanel({ viewpoint }: Props) {
  return (
    <div className="walk-mode-card">
      <p className="eyebrow">Прогулка по квартире</p>
      <h3>{viewpoint.label}</h3>
      <p>Открыт обзор комнаты. Можно продолжить к виду из окна или передать этот контекст менеджеру.</p>
    </div>
  );
}
