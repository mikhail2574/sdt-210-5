type ApplicationStatusGridProps = {
  application: {
    staffModifiedFields: string[];
    status: string;
    timeline: Array<{
      at: string;
      note?: string;
      status: string;
    }>;
    trackingCode: string | null;
  };
  modifiedFieldsTitle: string;
  statusTitle: string;
  timelineTitle: string;
};

export function ApplicationStatusGrid({
  application,
  modifiedFieldsTitle,
  statusTitle,
  timelineTitle
}: ApplicationStatusGridProps) {
  return (
    <div className="status-grid">
      <section className="status-card">
        <h3>{statusTitle}</h3>
        <p className="status-chip">{application.status}</p>
        <p>{application.trackingCode}</p>
        {application.staffModifiedFields.length > 0 ? (
          <p>
            {modifiedFieldsTitle}: {application.staffModifiedFields.length}
          </p>
        ) : null}
      </section>

      <section className="status-card">
        <h3>{timelineTitle}</h3>
        <ol className="timeline-list">
          {application.timeline.map((entry) => (
            <li key={`${entry.status}-${entry.at}`}>
              <strong>{entry.status}</strong>
              <span>{entry.note ?? entry.at}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
