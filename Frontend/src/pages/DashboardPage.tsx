import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getSystemHealth, listAgents } from '../api';
import type { AgentModel, SystemHealthResponse } from '../api/types';
import MetricCard from '../components/MetricCard';
import '../styles/DashboardPage.css';

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
        toast.error('Unable to load dashboard metrics.');
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

  const capabilityChartData = capabilityDistribution.slice(0, 6).map((item) => ({
    capability: item.capability,
    count: item.count,
  }));

  const statusChartData = [
    { name: 'Registered', value: registeredCount },
    { name: 'Approved', value: approvedCount },
    { name: 'Deregistered', value: deregisteredCount },
  ];

  const statusColors = ['#2563eb', '#16a34a', '#ef4444'];

  return (
    <main className="page-shell">
      <div className="dashboard-page">
        <header className="dashboard-page__header">
          <div className="dashboard-page__title-section">
            <h1 className="dashboard-page__title">Dashboard</h1>
            <p className="dashboard-page__copy">System health overview and capability distribution for the AgentMesh registry.</p>
          </div>
        </header>

        {loading ? (
          <p>Loading dashboard data...</p>
        ) : (
          <>
            <section className="dashboard-page__metrics grid metrics-grid">
              <MetricCard label="Total agents" value={health?.agents_total ?? agents.length} />
              <MetricCard label="Healthy agents" value={health?.healthy ?? 0} />
              <MetricCard label="Unhealthy agents" value={health?.unhealthy ?? 0} />
              <MetricCard label="Registered agents" value={registeredCount} />
              <MetricCard label="Approved agents" value={approvedCount} />
              <MetricCard label="Deregistered agents" value={deregisteredCount} />
            </section>

            <section className="dashboard-page__analytics">
              <div className="analytics-card">
                <div className="analytics-card__header">
                  <h2 className="analytics-card__title">Top Capabilities</h2>
                  <p className="analytics-card__copy">The most common canonical capability tags across your active agents.</p>
                </div>
                <div className="chart-wrapper">
                {capabilityChartData.length === 0 ? (
                  <div className="analytics-no-data">No capability chart data available yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={capabilityChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                      <XAxis dataKey="capability" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                      <Bar dataKey="count" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              </div>

              <div className="analytics-card">
                <div className="analytics-card__header">
                  <h2 className="analytics-card__title">Agent Status Share</h2>
                  <p className="analytics-card__copy">Breakdown of registered, approved, and deregistered agents.</p>
                </div>
                <div className="chart-wrapper">
                  {statusChartData.every((entry) => entry.value === 0) ? (
                    <div className="analytics-no-data">No status chart data available yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={statusColors[index % statusColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                        <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </section>

            <section className="dashboard-page__stats">
              <div className="capability-section">
                <h2 className="capability-section__title">Capability Distribution</h2>
                <p className="capability-section__copy">
                  Canonical capabilities found across registered agents.
                </p>
                {capabilityDistribution.length === 0 ? (
                  <p>No capability data available yet.</p>
                ) : (
                  <ol className="capability-list">
                    {capabilityDistribution.slice(0, 10).map((item) => (
                      <li key={item.capability} className="capability-item">
                        <span className="capability-item__name">{item.capability}</span> — {item.count} agent{item.count === 1 ? '' : 's'}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="stats-section">
                <h2 className="stats-section__title">System-wide stats</h2>
                <p className="stats-section__copy">
                  Summary metrics derived from backend health and registry data.
                </p>
                <dl className="stats-list">
                  <div className="stats-item">
                    <dt className="stats-item__label">Average latency</dt>
                    <dd className="stats-item__value">{health?.avg_latency_ms ?? 'N/A'} ms</dd>
                  </div>
                  <div className="stats-item">
                    <dt className="stats-item__label">Capability categories</dt>
                    <dd className="stats-item__value">{capabilityDistribution.length}</dd>
                  </div>
                  <div className="stats-item">
                    <dt className="stats-item__label">Agents with health data</dt>
                    <dd className="stats-item__value">{agents.filter((agent) => agent.latency_ms !== null).length}</dd>
                  </div>
                </dl>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default DashboardPage;
