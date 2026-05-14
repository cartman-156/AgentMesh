import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { listAgents, approveAgent, deregisterAgent } from '../api';
import type { AgentModel } from '../api/types';
import AgentCard from '../components/AgentCard';
import AgentDetailModal from '../components/AgentDetailModal';
import './AgentsPage.css';

const AgentsPage = () => {
  const [agents, setAgents] = useState<AgentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'approved' | 'deregistered'>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const result = await listAgents();
      setAgents(result.agents);
    } catch (err) {
      toast.error('Unable to load agents.');
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
    setActionLoadingId(agentId);

    try {
      const response = await approveAgent(agentId, { action: 'approve' });
      toast.success(`Agent ${response.id} was approved successfully.`);
      await loadAgents();
    } catch (err) {
      toast.error('Approval failed. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (agentId: string) => {
    const confirmed = window.confirm('Are you sure you want to reject this agent? This action permanently removes the agent from the registry.');
    if (!confirmed) return;

    setActionLoadingId(agentId);

    try {
      const response = await approveAgent(agentId, { action: 'reject' });
      toast.success(`Agent ${response.id} was rejected successfully.`);
      await loadAgents();
    } catch (err) {
      toast.error('Rejection failed. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeregister = async (agentId: string) => {
    const confirmed = window.confirm('Are you sure you want to deregister this agent? This action preserves history but removes the agent from active discovery.');
    if (!confirmed) return;

    setActionLoadingId(agentId);

    try {
      const response = await deregisterAgent(agentId);
      toast.success(`Agent ${response.id} was deregistered successfully.`);
      await loadAgents();
    } catch (err) {
      toast.error('Deregistration failed. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewDetails = (agentId: string) => {
    setSelectedAgentId(agentId);
  };

  const closeDetailModal = () => {
    setSelectedAgentId(null);
  };

  return (
    <main className="page-shell">
      <header className="agents-page__header">
        <div className="agents-page__header-row">
          <div>
            <h1 className="agents-page__title">Agents</h1>
            <p className="agents-page__copy">
              A registry view of agents with lifecycle actions and status information.
            </p>
          </div>
          <div className="agents-page__filters">
            {(['all', 'registered', 'approved', 'deregistered'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`filter-button ${statusFilter === status ? 'filter-button--active' : ''}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <p>Loading agents…</p>
      ) : (
        <div className="agents-page__cards">
          {filteredAgents.length === 0 ? (
            <p>No agents found.</p>
          ) : (
            filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isActionLoading={actionLoadingId === agent.id}
                onApprove={handleApprove}
                onReject={handleReject}
                onDeregister={handleDeregister}
                onView={handleViewDetails}
              />
            ))
          )}
        </div>
      )}

      {selectedAgentId && (
        <AgentDetailModal
          agentId={selectedAgentId}
          onClose={closeDetailModal}
          onActionComplete={loadAgents}
        />
      )}
    </main>
  );
};

export default AgentsPage;
