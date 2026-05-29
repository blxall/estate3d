import type { LeadContextSummary, ShareHandoffSummary } from '../viewer/sceneAdapter';

type Props = {
  leadMessage: string;
  leadContext: LeadContextSummary | null;
  shareHandoff: ShareHandoffSummary | null;
  onSubmit: () => void;
};

export function LeadCta({ leadMessage, leadContext, shareHandoff, onSubmit }: Props) {
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
      {shareHandoff && (
        <div className="share-handoff-card">
          <p>{shareHandoff.label}</p>
          <small>{shareHandoff.copy}</small>
          <button type="button" aria-label={shareHandoff.ariaLabel}>Ссылка готова к отправке</button>
        </div>
      )}
      <button type="button" onClick={onSubmit}>Оставить заявку</button>
      {leadMessage && <p className="lead-message">{leadMessage}</p>}
    </div>
  );
}
