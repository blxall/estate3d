type Props = {
  leadMessage: string;
  onSubmit: () => void;
};

export function LeadCta({ leadMessage, onSubmit }: Props) {
  return (
    <div className="lead-card">
      <p className="eyebrow">Sales CTA</p>
      <h3>Зафиксировать интерес</h3>
      <p>Передаем менеджеру контекст просмотра: ЖК, корпус, этаж, квартира, режим камеры.</p>
      <button type="button" onClick={onSubmit}>Оставить заявку</button>
      {leadMessage && <p className="lead-message">{leadMessage}</p>}
    </div>
  );
}
