type MetricCardProps = {
  label: string;
  value: number;
};

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <article className="metric-card">
      <h2>{label}</h2>
      <strong>{value}</strong>
    </article>
  );
}
