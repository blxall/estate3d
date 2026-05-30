import { buildLeadCtaState, type BrokerNextStepScript, type InteractionTrailSummary, type LeadContextSummary, type LeadCtaStatus, type LeadSuccessSummary, type ManagerFollowUpChecklist, type ShareHandoffSummary } from '../viewer/sceneAdapter';

type Props = {
  leadMessage: string;
  leadStatus: LeadCtaStatus;
  leadContext: LeadContextSummary | null;
  leadSuccess: LeadSuccessSummary | null;
  interactionTrail: InteractionTrailSummary | null;
  shareHandoff: ShareHandoffSummary | null;
  managerFollowUp: ManagerFollowUpChecklist | null;
  brokerScript: BrokerNextStepScript | null;
  onSubmit: () => void;
};

export function LeadCta({ leadMessage, leadStatus, leadContext, leadSuccess, interactionTrail, shareHandoff, managerFollowUp, brokerScript, onSubmit }: Props) {
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
      {interactionTrail && (
        <div className={interactionTrail.cardClass}>
          <p>{interactionTrail.label}</p>
          <small>{interactionTrail.copy}</small>
          <small className="interaction-manager-note">{interactionTrail.managerNote}</small>
        </div>
      )}
      {shareHandoff && (
        <div className={shareHandoff.cardClass}>
          <p>{shareHandoff.label}</p>
          <small className={shareHandoff.copyClass}>{shareHandoff.copy}</small>
          <button type="button" className={shareHandoff.buttonClass} aria-label={shareHandoff.ariaLabel}>Ссылка готова к отправке</button>
        </div>
      )}
      {managerFollowUp && (
        <div className={managerFollowUp.cardClass}>
          <p>{managerFollowUp.label}</p>
          <ul>
            {managerFollowUp.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <small className="manager-follow-up-copy">{managerFollowUp.copy}</small>
        </div>
      )}
      {brokerScript && (
        <div className={brokerScript.cardClass}>
          <p>{brokerScript.label}</p>
          <small className="broker-script-opener">{brokerScript.opener}</small>
          <small className="broker-script-next-step">{brokerScript.clientNextStep}</small>
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
