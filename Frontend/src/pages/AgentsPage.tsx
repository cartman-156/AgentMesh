import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { listAgents, approveAgent, deregisterAgent } from '../api';
import type { AgentModel } from '../api/types';
import AgentCard from '../components/AgentCard';
import AgentDetailModal from '../components/AgentDetailModal';
import RegisterAgentModal from '../components/RegisterAgentModal';
import '../styles/AgentsPage.css';

const AgentsPage = () => {
  const [agents, setAgents] = useState<AgentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'approved' | 'deregistered'>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const openRegisterModal = () => setShowRegisterModal(true);
  const closeRegisterModal = () => setShowRegisterModal(false);
  const handleRegisterSuccess = () => {
    loadAgents();
  };

  const loadAgents = async () => {
    try {
      setLoading(true);
      const result = await listAgents();
      setAgents(Array.isArray(result?.agents) ? result.agents : []);
    } catch (err) {
      toast.error('Unable to load agents.');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const filteredAgents = useMemo(() => {
    if (!Array.isArray(agents)) return [];
    
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

  const handleDownloadSample = () => {
    const sampleAgent = {
      "id": "agent-7f3c9a21-demo",
      "name": "ContextAwareAssistant",
      "description": "A general-purpose AI agent capable of reasoning, tool use, and multi-step task execution across domains.",
      "version": "0.1.0",
      "status": "active",
      "company": "Demo AI Systems",
      "url": "https://example.ai/agents/context-aware-assistant",
      "provider": {
        "name": "Demo AI Systems",
        "website": "https://example.ai",
        "contact_email": "support@example.ai"
      },
      "endpoints": {
        "base_url": "https://api.example.ai/agents/context-aware-assistant",
        "a2a_message_endpoint": "/v1/messages",
        "a2a_stream_endpoint": "/v1/stream",
        "health_check": "/health"
      },
      "authentication": {
        "type": "bearer_token",
        "token_url": "https://auth.example.ai/oauth/token",
        "scopes": ["agent.execute", "agent.read", "agent.stream"]
      },
      "capabilities": {
        "streaming": true,
        "multi_turn_conversation": true,
        "tool_use": true,
        "memory": false,
        "async_execution": true
      },
      "skills": [
        {
          "name": "reasoning",
          "description": "Multi-step logical reasoning and planning",
          "tags": ["planning", "analysis", "decision-making"]
        },
        {
          "name": "code_generation",
          "description": "Generates and explains code in multiple languages",
          "tags": ["python", "javascript", "backend", "frontend"]
        },
        {
          "name": "data_analysis",
          "description": "Performs structured data interpretation and summarization",
          "tags": ["csv", "json", "analytics"]
        }
      ]
    };

    const blob = new Blob([JSON.stringify(sampleAgent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-agent.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="page-shell">
      <header className="agents-page__header">
        <div className="agents-page__action-row">
          <button
            type="button"
            onClick={handleDownloadSample}
            className="btn btn--outline"
          >
            Download Sample
          </button>
          <button
            type="button"
            onClick={openRegisterModal}
            className="btn btn-primary agents-page__register-button"
          >
            Register Agent
          </button>
        </div>
        
        <div className="agents-page__info-row">
          <div>
            <h1 className="agents-page__title">Agents</h1>
            <p className="agents-page__copy">
              A registry view of agents with lifecycle actions and status information.
            </p>
          </div>
        </div>

        <div className="agents-page__filter-row">
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

      {showRegisterModal && (
        <RegisterAgentModal
          onClose={closeRegisterModal}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}
    </main>
  );
};

export default AgentsPage;
