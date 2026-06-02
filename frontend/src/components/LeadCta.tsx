import { buildGroupedLeadExportFields, buildLeadCtaState, buildLeadExportPayload, buildLeadHandoffPersistenceState, type BrokerNextStepScript, type InteractionTrailSummary, type LeadContextSummary, type LeadCtaStatus, type LeadHandoffDigest, type LeadSuccessSummary, type ManagerFollowUpChecklist, type ShareHandoffSummary } from '../viewer/sceneAdapter';

type Props = {
  leadMessage: string;
  leadStatus: LeadCtaStatus;
  leadContext: LeadContextSummary | null;
  leadSuccess: LeadSuccessSummary | null;
  interactionTrail: InteractionTrailSummary | null;
  shareHandoff: ShareHandoffSummary | null;
  managerFollowUp: ManagerFollowUpChecklist | null;
  brokerScript: BrokerNextStepScript | null;
  leadHandoffDigest: LeadHandoffDigest | null;
  onSubmit: () => void;
};

export function LeadCta({ leadMessage, leadStatus, leadContext, leadSuccess, interactionTrail, shareHandoff, managerFollowUp, brokerScript, leadHandoffDigest, onSubmit }: Props) {
  const leadCtaState = buildLeadCtaState(leadStatus);
  const digestPersistence = buildLeadHandoffPersistenceState({ digest: leadHandoffDigest, status: leadStatus });
  const leadExportPayload = buildLeadExportPayload({ leadContext, shareHandoff, digest: leadHandoffDigest, persistence: digestPersistence, managerFollowUp, brokerScript });
  const groupedLeadExportFields = buildGroupedLeadExportFields(leadExportPayload);
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
      {leadHandoffDigest && (
        <div className={leadHandoffDigest.cardClass}>
          <p>{leadHandoffDigest.label}</p>
          <small className="lead-handoff-digest-recap">{leadHandoffDigest.recap}</small>
          <small className="lead-handoff-digest-note">{leadHandoffDigest.managerOneLiner}</small>
        </div>
      )}
      {digestPersistence && (
        <div className={digestPersistence.cardClass}>
          <p>{digestPersistence.label}</p>
          <small className="lead-handoff-persistence-copy">{digestPersistence.copy}</small>
          <small className="lead-handoff-persistence-badge">{digestPersistence.badge}</small>
        </div>
      )}
      {leadExportPayload && (
        <div className={leadExportPayload.cardClass}>
          <p>{leadExportPayload.label}</p>
          <small className="lead-export-payload-copy">{leadExportPayload.copy}</small>
          <small className="lead-export-payload-note">{leadExportPayload.managerOneLiner}</small>
        </div>
      )}
      {groupedLeadExportFields && (
        <div className={groupedLeadExportFields.cardClass}>
          <p>{groupedLeadExportFields.label}</p>
          {groupedLeadExportFields.groups.map((group) => (
            <div className="lead-export-field-group" key={group.title}>
              <small className="lead-export-field-title">{group.title}</small>
              {group.rows.map((row) => <small className="lead-export-field-row" key={`${group.title}:${row}`}>{row}</small>)}
            </div>
          ))}
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
