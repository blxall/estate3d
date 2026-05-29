import type { LeadContextSummary, LeadSuccessSummary, ShareHandoffSummary } from '../viewer/sceneAdapter';

type Props = {
  leadMessage: string;
  leadContext: LeadContextSummary | null;
  leadSuccess: LeadSuccessSummary | null;
  shareHandoff: ShareHandoffSummary | null;
  onSubmit: () => void;
};

export function LeadCta({ leadMessage, leadContext, leadSuccess, shareHandoff, onSubmit }: Props) {
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
        <div className={shareHandoff.cardClass}>
          <p>{shareHandoff.label}</p>
          <small className={shareHandoff.copyClass}>{shareHandoff.copy}</small>
          <button type="button" className={shareHandoff.buttonClass} aria-label={shareHandoff.ariaLabel}>Ссылка готова к отправке</button>
        </div>
      )}
      <button type="button" onClick={onSubmit}>Оставить заявку</button>
      {leadSuccess && (
        <div className={leadSuccess.cardClass}>
          <p>{leadSuccess.label}</p>
          <small>{leadSuccess.nextAction}</small>
        </div>
      )}
      {leadMessage && <p className="lead-message">{leadMessage}</p>}
    </div>
  );
}
