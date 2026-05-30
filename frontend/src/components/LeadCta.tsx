import { buildLeadCtaState, type LeadContextSummary, type LeadCtaStatus, type LeadSuccessSummary, type ShareHandoffSummary } from '../viewer/sceneAdapter';

type Props = {
  leadMessage: string;
  leadStatus: LeadCtaStatus;
  leadContext: LeadContextSummary | null;
  leadSuccess: LeadSuccessSummary | null;
  shareHandoff: ShareHandoffSummary | null;
  onSubmit: () => void;
};

export function LeadCta({ leadMessage, leadStatus, leadContext, leadSuccess, shareHandoff, onSubmit }: Props) {
  const leadCtaState = buildLeadCtaState(leadStatus);
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
      <button type="button" className={leadCtaState.buttonClass} disabled={leadCtaState.buttonDisabled} onClick={onSubmit}>{leadCtaState.buttonLabel}</button>
      {leadSuccess && (
        <div className={leadSuccess.cardClass}>
          <p>{leadSuccess.label}</p>
          <small>{leadSuccess.nextAction}</small>
        </div>
      )}
      {leadMessage && <p className={leadCtaState.feedbackClass}>{leadMessage}</p>}
    </div>
  );
}
