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
      const payload = typeof agent.capabilities === 'string'
        ? JSON.parse(agent.capabilities || '{}')
        : agent.capabilities;

      if (!payload || typeof payload !== 'object') return;

      let capabilityNames: string[] = [];
      if (Array.isArray(payload.canonical_capabilities)) {
        capabilityNames = payload.canonical_capabilities;
      } else {
        capabilityNames = Object.entries(payload)
          .filter(([_, value]) => value === true)
          .map(([key]) => key);
      }

      capabilityNames.forEach((cap) => {
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

const parseSkillDistribution = (agents: AgentModel[]) => {
  const counts = new Map<string, number>();

  agents.forEach((agent) => {
    try {
      const skills = typeof agent.skills === 'string'
        ? JSON.parse(agent.skills || '[]')
        : agent.skills;

      if (!Array.isArray(skills)) return;

      skills.forEach((skill) => {
        const skillName = typeof skill === 'object' && skill !== null ? skill.name : String(skill);
        if (skillName && skillName.trim()) {
          counts.set(skillName, (counts.get(skillName) ?? 0) + 1);
        }
      });
    } catch {
      // Ignore malformed skill payloads.
    }
  });

  return Array.from(counts.entries())
    .map(([skill, count]) => ({ skill, count }))
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

  const skillDistribution = useMemo(
    () => parseSkillDistribution(agents),
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
    name: item.capability,
    count: item.count,
  }));

  const skillChartData = skillDistribution.slice(0, 6).map((item) => ({
    name: item.skill,
    count: item.count,
  }));

  const statusChartData = [
    { name: 'Registered', value: registeredCount },
    { name: 'Approved', value: approvedCount },
    { name: 'Deregistered', value: deregisteredCount },
  ];

  const statusColors: Record<string, string> = {
    'Registered': '#2563eb',
    'Approved': '#16a34a',
    'Deregistered': '#ef4444',
  };

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

            <section className="dashboard-page__analytics dashboard-page__analytics--split">
              <div className="analytics-card">
                <div className="analytics-card__header">
                  <h2 className="analytics-card__title">Agent Lifecycle Overview</h2>
                  <p className="analytics-card__copy">Breakdown of registered, approved, and deregistered agents.</p>
                </div>
                <div className="chart-wrapper">
                  {statusChartData.every((entry) => entry.value === 0) ?
                    <div className="analytics-no-data">No status chart data available yet.</div>
                   : 
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData.filter(d => d.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        >
                          {statusChartData.filter(d => d.value > 0).map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={statusColors[entry.name]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                        <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  }
                </div>
              </div>

              <div className="analytics-card stats-card">
                <div className="analytics-card__header">
                  <h2 className="analytics-card__title">System Status Summary</h2>
                  <p className="analytics-card__copy">Key metrics derived from backend health and registry data.</p>
                </div>
                <dl className="stats-list" style={{ marginTop: '1.25rem' }}>
                  <div className="stats-item">
                    <dt className="stats-item__label">Healthy Ratio</dt>
                    <dd className="stats-item__value">
                      {health ? ((health.healthy / (health.agents_total || 1)) * 100).toFixed(0) : 0}%
                    </dd>
                  </div>
                  <div className="stats-item">
                    <dt className="stats-item__label">Active Registry</dt>
                    <dd className="stats-item__value">
                      {agents.filter(a => a.deregistered === 0).length} agents
                    </dd>
                  </div>
                  <div className="stats-item">
                    <dt className="stats-item__label">Fastest response</dt>
                    <dd className="stats-item__value">
                      {Math.min(...agents.map(a => a.latency_ms).filter((l): l is number => l !== null), Infinity) === Infinity 
                        ? 'N/A' 
                        : `${Math.min(...agents.map(a => a.latency_ms).filter((l): l is number => l !== null))} ms`
                      }
                    </dd>
                  </div>
                  <div className="stats-item">
                    <dt className="stats-item__label">Average latency</dt>
                    <dd className="stats-item__value">{health?.avg_latency_ms ?? 'N/A'} ms</dd>
                  </div>
                  <div className="stats-item">
                    <dt className="stats-item__label">Capability categories</dt>
                    <dd className="stats-item__value">{capabilityDistribution.length}</dd>
                  </div>
                  <div className="stats-item">
                    <dt className="stats-item__label">Skill categories</dt>
                    <dd className="stats-item__value">{skillDistribution.length}</dd>
                  </div>
                  <div className="stats-item">
                    <dt className="stats-item__label">Skills density</dt>
                    <dd className="stats-item__value">
                      {(skillDistribution.reduce((acc, curr) => acc + curr.count, 0) / (agents.length || 1)).toFixed(1)} / agent
                    </dd>
                  </div>
                  <div className="stats-item">
                    <dt className="stats-item__label">Health records</dt>
                    <dd className="stats-item__value">{agents.filter((agent) => agent.latency_ms !== null).length} agents</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="dashboard-page__stats-grid">
              {/* Row 3: Capabilities Bar */}
              <div className="analytics-card">
                <div className="analytics-card__header">
                  <h2 className="analytics-card__title">Top Capabilities</h2>
                  <p className="analytics-card__copy">Most common canonical capability tags across active agents.</p>
                </div>
                <div className="chart-wrapper">
                  {capabilityChartData.length === 0 ?
                    <div className="analytics-no-data">No capability data available.</div>
                   : 
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={capabilityChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                        <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  }
                </div>
              </div>

              {/* Row 3: Skills Bar */}
              <div className="analytics-card">
                <div className="analytics-card__header">
                  <h2 className="analytics-card__title">Top Skills</h2>
                  <p className="analytics-card__copy">Most frequent individual skills defined across the registry.</p>
                </div>
                <div className="chart-wrapper">
                  {skillChartData.length === 0 ?
                    <div className="analytics-no-data">No skill data available.</div>
                   : 
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={skillChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  }
                </div>
              </div>

              {/* Row 3: Capability List */}
              <div className="analytics-card">
                <div className="analytics-card__header">
                  <h2 className="analytics-card__title">Capability Index</h2>
                  <p className="analytics-card__copy">Full distribution of identified capabilities.</p>
                </div>
                <div className="stats-scroll-list">
                  {capabilityDistribution.length === 0 ? (
                    <p className="analytics-no-data">No data</p>
                  ) : (
                    <ol className="stats-scroll-list__items">
                      {capabilityDistribution.map((item) => (
                        <li key={item.capability} className="stats-scroll-list__item">
                          <span>{item.capability}</span>
                          <span className="stats-scroll-list__count">{item.count}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>

              {/* Row 3: Skill List */}
              <div className="analytics-card">
                <div className="analytics-card__header">
                  <h2 className="analytics-card__title">Skill Index</h2>
                  <p className="analytics-card__copy">Full distribution of identified agent skills.</p>
                </div>
                <div className="stats-scroll-list">
                  {skillDistribution.length === 0 ? (
                    <p className="analytics-no-data">No data</p>
                  ) : (
                    <ol className="stats-scroll-list__items">
                      {skillDistribution.map((item) => (
                        <li key={item.skill} className="stats-scroll-list__item">
                          <span>{item.skill}</span>
                          <span className="stats-scroll-list__count">{item.count}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default DashboardPage;
