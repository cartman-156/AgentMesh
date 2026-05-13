import { useEffect, useMemo, useState } from 'react';
import { listAgents, approveAgent, deregisterAgent } from '../api';
import type { AgentModel } from '../api/types';
import AgentCard from '../components/AgentCard';

const AgentsPage = () => {
  const [agents, setAgents] = useState<AgentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'approved' | 'deregistered'>('all');
  const [message, setMessage] = useState<string | null>(null);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listAgents();
      setAgents(result.agents);
    } catch (err) {
      setError('Unable to load agents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const filteredAgents = useMemo(() => {
    const filterStatus = (agent: AgentModel) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'registered') return agent.approved === 0 && agent.deregistered === 0;
      if (statusFilter === 'approved') return agent.approved === 1 && agent.deregistered === 0;
      if (statusFilter === 'deregistered') return agent.deregistered === 1;
      return true;
    };

    return agents.filter(filterStatus);
  }, [agents, statusFilter]);

  const handleApprove = async (agentId: string) => {
    setMessage(null);
    setActionLoadingId(agentId);

    try {
      const response = await approveAgent(agentId, { action: 'approve' });
      setMessage(`Agent ${response.id} was approved successfully.`);
      await loadAgents();
    } catch (err) {
      setError('Approval failed. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (agentId: string) => {
    const confirmed = window.confirm('Are you sure you want to reject this agent? This action permanently removes the agent from the registry.');
    if (!confirmed) return;

    setMessage(null);
    setActionLoadingId(agentId);

    try {
      const response = await approveAgent(agentId, { action: 'reject' });
      setMessage(`Agent ${response.id} was rejected successfully.`);
      await loadAgents();
    } catch (err) {
      setError('Rejection failed. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeregister = async (agentId: string) => {
    const confirmed = window.confirm('Are you sure you want to deregister this agent? This action preserves history but removes the agent from active discovery.');
    if (!confirmed) return;

    setMessage(null);
    setActionLoadingId(agentId);

    try {
      const response = await deregisterAgent(agentId);
      setMessage(`Agent ${response.id} was deregistered successfully.`);
      await loadAgents();
    } catch (err) {
      setError('Deregistration failed. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <main style={{ padding: '2rem', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#111827' }}>Agents</h1>
            <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>
              A registry view of agents with lifecycle actions and status information.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['all', 'registered', 'approved', 'deregistered'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '0.75rem',
                  border: statusFilter === status ? '1px solid #2563eb' : '1px solid #d1d5db',
                  backgroundColor: statusFilter === status ? '#eff6ff' : '#ffffff',
                  color: '#111827',
                  cursor: 'pointer',
                  fontWeight: statusFilter === status ? 700 : 500,
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {message && (
        <section style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '1rem', backgroundColor: '#ecfdf5', color: '#166534', border: '1px solid #a7f3d0' }}>
          {message}
        </section>
      )}
      {error && (
        <section style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '1rem', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
          {error}
        </section>
      )}

      {loading ? (
        <p>Loading agents…</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredAgents.length === 0 ? (
            <p>No agents found for the selected status.</p>
          ) : (
            filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isActionLoading={actionLoadingId === agent.id}
                onApprove={handleApprove}
                onReject={handleReject}
                onDeregister={handleDeregister}
              />
            ))
          )}
        </div>
      )}
    </main>
  );
};

export default AgentsPage;
