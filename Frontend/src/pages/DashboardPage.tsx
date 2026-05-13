import { useEffect, useMemo, useState } from 'react';
import { getSystemHealth, listAgents } from '../api';
import type { AgentModel, SystemHealthResponse } from '../api/types';
import MetricCard from '../components/MetricCard';

const parseCapabilityDistribution = (agents: AgentModel[]) => {
  const counts = new Map<string, number>();

  agents.forEach((agent) => {
    try {
      const payload = JSON.parse(agent.capabilities) as Record<string, unknown>;
      const canonical = Array.isArray(payload?.canonical_capabilities)
        ? payload.canonical_capabilities
        : [];

      canonical.forEach((cap) => {
        if (typeof cap === 'string' && cap.trim()) {
          counts.set(cap, (counts.get(cap) ?? 0) + 1);
        }
      });
    } catch {
      // Ignore malformed capability payloads.
    }
  });

  return Array.from(counts.entries())
    .map(([capability, count]) => ({ capability, count }))
    .sort((a, b) => b.count - a.count);
};

const DashboardPage = () => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [agents, setAgents] = useState<AgentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [healthResponse, agentsResponse] = await Promise.all([
          getSystemHealth(),
          listAgents(),
        ]);

        setHealth(healthResponse);
        setAgents(agentsResponse.agents);
      } catch (err) {
        setError('Unable to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const capabilityDistribution = useMemo(
    () => parseCapabilityDistribution(agents),
    [agents]
  );

  const registeredCount = agents.filter(
    (agent) => agent.approved === 0 && agent.deregistered === 0
  ).length;
  const approvedCount = agents.filter(
    (agent) => agent.approved === 1 && agent.deregistered === 0
  ).length;
  const deregisteredCount = agents.filter((agent) => agent.deregistered === 1).length;

  return (
    <main style={{ padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: '#111827' }}>Dashboard</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>
          System health overview and capability distribution for the AgentMesh registry.
        </p>
      </header>

      {loading ? (
        <p>Loading dashboard data...</p>
      ) : error ? (
        <p style={{ color: '#b91c1c' }}>{error}</p>
      ) : (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <MetricCard label="Total agents" value={health?.agents_total ?? agents.length} />
            <MetricCard label="Healthy agents" value={health?.healthy ?? 0} />
            <MetricCard label="Unhealthy agents" value={health?.unhealthy ?? 0} />
            <MetricCard label="Registered agents" value={registeredCount} />
            <MetricCard label="Approved agents" value={approvedCount} />
            <MetricCard label="Deregistered agents" value={deregisteredCount} />
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
            <div style={{ border: '1px solid #d1d5db', borderRadius: '0.75rem', padding: '1.5rem', backgroundColor: '#fff' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Capability Distribution</h2>
              <p style={{ margin: '0.5rem 0 1rem', color: '#6b7280' }}>
                Canonical capabilities found across registered agents.
              </p>
              {capabilityDistribution.length === 0 ? (
                <p>No capability data available yet.</p>
              ) : (
                <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  {capabilityDistribution.slice(0, 10).map((item) => (
                    <li key={item.capability} style={{ marginBottom: '0.75rem', color: '#374151' }}>
                      <strong>{item.capability}</strong> — {item.count} agent{item.count === 1 ? '' : 's'}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div style={{ border: '1px solid #d1d5db', borderRadius: '0.75rem', padding: '1.5rem', backgroundColor: '#fff' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>System-wide stats</h2>
              <p style={{ margin: '0.5rem 0 1rem', color: '#6b7280' }}>
                Summary metrics derived from backend health and registry data.
              </p>
              <dl style={{ display: 'grid', gap: '0.75rem', margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <dt style={{ color: '#4b5563' }}>Average latency</dt>
                  <dd style={{ margin: 0, fontWeight: 700, color: '#111827' }}>{health?.avg_latency_ms ?? 'N/A'} ms</dd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <dt style={{ color: '#4b5563' }}>Capability categories</dt>
                  <dd style={{ margin: 0, fontWeight: 700, color: '#111827' }}>{capabilityDistribution.length}</dd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <dt style={{ color: '#4b5563' }}>Agents with health data</dt>
                  <dd style={{ margin: 0, fontWeight: 700, color: '#111827' }}>{agents.filter((agent) => agent.latency_ms !== null).length}</dd>
                </div>
              </dl>
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default DashboardPage;
