type MetricCardProps = {
  label: string;
  value: string | number;
  description?: string;
};

const MetricCard = ({ label, value, description }: MetricCardProps) => {
  return (
    <section className="card" style={{ minWidth: 180 }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</p>
      <p style={{ margin: '0.5rem 0 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
      {description ? (
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{description}</p>
      ) : null}
    </section>
  );
};

export default MetricCard;
