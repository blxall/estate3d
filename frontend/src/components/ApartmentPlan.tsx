import type { DevelopmentUnit } from '../types';
import { roomPlanStyle } from '../viewer/sceneAdapter';

type Props = {
  unit: DevelopmentUnit;
};

export function ApartmentPlan({ unit }: Props) {
  return (
    <div className="floating-plan" aria-label={`Планировка квартиры ${unit.number}`}>
      {unit.rooms.map((room) => (
        <div key={room.id} className="plan-room" style={roomPlanStyle(room, unit)}>
          <span>{room.name}</span>
        </div>
      ))}
    </div>
  );
}
