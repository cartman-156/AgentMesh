type MetricCardProps = {
  label: string;
  value: string | number;
  description?: string;
};

const MetricCard = ({ label, value, description }: MetricCardProps) => {
  return (
    <section style={{ border: '1px solid #d1d5db', borderRadius: '0.75rem', padding: '1rem', minWidth: 180, backgroundColor: '#fff' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{label}</p>
      <p style={{ margin: '0.5rem 0 0', fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>{value}</p>
      {description ? <p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem', color: '#4b5563' }}>{description}</p> : null}
    </section>
  );
};

export default MetricCard;
