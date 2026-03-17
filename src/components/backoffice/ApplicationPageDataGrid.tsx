type ApplicationPageDataGridProps = {
  pageData: Record<string, Record<string, unknown>>;
};

export function ApplicationPageDataGrid({ pageData }: ApplicationPageDataGridProps) {
  return (
    <section className="review-grid">
      {Object.entries(pageData).map(([pageKey, data]) => (
        <article className="review-card" key={pageKey}>
          <h3>{pageKey}</h3>
          <dl className="review-list">
            {Object.entries(data).map(([fieldKey, value]) => (
              <div key={fieldKey}>
                <dt>{fieldKey}</dt>
                <dd>{formatPageDataValue(value)}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </section>
  );
}

function formatPageDataValue(value: unknown) {
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    return JSON.stringify(value);
  }

  return String(value ?? "");
}
