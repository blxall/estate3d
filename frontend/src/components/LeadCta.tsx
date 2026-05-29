import type { LeadContextSummary } from '../viewer/sceneAdapter';

type Props = {
  leadMessage: string;
  leadContext: LeadContextSummary | null;
  onSubmit: () => void;
};

export function LeadCta({ leadMessage, leadContext, onSubmit }: Props) {
  return (
    <div className="lead-card">
      <p className="eyebrow">Sales CTA</p>
      <h3>Зафиксировать интерес</h3>
      <p>Передаем менеджеру контекст просмотра: ЖК, корпус, этаж, квартира, режим камеры.</p>
      {leadContext && (
        <div className="lead-context">
          <p>{leadContext.label}</p>
          <small>{leadContext.message}</small>
        </div>
      )}
      <button type="button" onClick={onSubmit}>Оставить заявку</button>
      {leadMessage && <p className="lead-message">{leadMessage}</p>}
    </div>
  );
}
