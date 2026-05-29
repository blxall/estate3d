import type { DevelopmentViewpoint } from '../types';

type Props = {
  viewpoint: DevelopmentViewpoint;
};

export function WalkModePanel({ viewpoint }: Props) {
  return (
    <div className="walk-mode-card">
      <p className="eyebrow">Walk mode</p>
      <h3>Walk mode: {viewpoint.label}</h3>
      <p>
        Камера: {viewpoint.position.x}, {viewpoint.position.y}, {viewpoint.position.z} → target {viewpoint.target.x}, {viewpoint.target.y}, {viewpoint.target.z}
      </p>
    </div>
  );
}
