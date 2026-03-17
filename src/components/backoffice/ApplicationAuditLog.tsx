type ApplicationAuditLogProps = {
  auditChangedToLabel: string;
  auditEntries: Array<{
    fieldPath: string;
    id: string;
    newValue: unknown;
    reason: string;
  }>;
  title: string;
};

export function ApplicationAuditLog({ auditChangedToLabel, auditEntries, title }: ApplicationAuditLogProps) {
  return (
    <section className="review-card">
      <h3>{title}</h3>
      <ul className="compact-list">
        {auditEntries.map((entry) => (
          <li key={entry.id}>
            <strong>{entry.fieldPath}</strong> {auditChangedToLabel} {String(entry.newValue)} ({entry.reason})
          </li>
        ))}
      </ul>
    </section>
  );
}
