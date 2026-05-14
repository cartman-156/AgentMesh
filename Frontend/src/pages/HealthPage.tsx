import '../styles/HealthPage.css';

const HealthPage = () => {
  return (
    <main className="page-shell">
      <header className="health-page__header">
        <h1 className="health-page__title">System Health</h1>
        <p className="health-page__copy">Monitor system health metrics and agent status.</p>
      </header>

      <div className="health-page__content">
        <section className="health-page__card">
          <h2 className="health-page__section-title">Health Metrics</h2>
          <p>This page shows system health metrics using the /api/v1/health endpoint.</p>
        </section>
      </div>
    </main>
  );
};

export default HealthPage;
