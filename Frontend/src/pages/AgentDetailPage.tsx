import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import {
  approveAgent,
  deregisterAgent,
  getAgent,
  getAgentHealth,
  getDebugAgent,
} from '../api';
import type { AgentHealthResponse, AgentModel } from '../api/types';

const badgeStyles: Record<string, CSSProperties> = {
  registered: { backgroundColor: 'var(--surface-soft)', color: 'var(--accent)', border: '1px solid var(--border)' },
  approved: { backgroundColor: 'var(--success-soft)', color: 'var(--success)', border: '1px solid rgba(74, 222, 128, 0.3)' },
  deregistered: { backgroundColor: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid rgba(248, 113, 113, 0.3)' },
  healthy: { backgroundColor: 'var(--success-soft)', color: 'var(--success)', border: '1px solid rgba(74, 222, 128, 0.3)' },
  unhealthy: { backgroundColor: 'var(--warning-soft)', color: 'var(--warning)', border: '1px solid rgba(251, 191, 36, 0.3)' },
};

const renderBadge = (text: string, type: string) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.35rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.85rem',
      fontWeight: 600,
      ...badgeStyles[type],
    }}
  >
    {text}
  </span>
);

const AgentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<AgentModel | null>(null);
  const [health, setHealth] = useState<AgentHealthResponse | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAgent = async () => {
    if (!id) {
      setError('Agent ID is required.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [agentResponse, healthResponse] = await Promise.all([
        getAgent(id),
        getAgentHealth(id),
      ]);

      setAgent(agentResponse.agent);
      setHealth(healthResponse);

      try {
        const debugResponse = await getDebugAgent(id);
        setDebugInfo(debugResponse);
      } catch {
        setDebugInfo(null);
      }
    } catch (err) {
      setError('Unable to load agent details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgent();
  }, [id]);

  const rawAgentCard = useMemo(() => {
    if (!agent) return null;
    try {
      return JSON.parse(agent.raw_agent_card) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [agent]);

  const capabilities = useMemo(() => {
    if (!agent) return { raw: [], canonical: [] as string[] };

    let canonical: string[] = [];
    try {
      const payload = JSON.parse(agent.capabilities) as Record<string, unknown>;
      canonical = Array.isArray(payload?.canonical_capabilities)
        ? payload.canonical_capabilities.filter((cap): cap is string => typeof cap === 'string')
        : [];
    } catch {
      canonical = [];
    }

    const raw = Array.isArray(rawAgentCard?.capabilities)
      ? rawAgentCard.capabilities.filter((item): item is string => typeof item === 'string')
      : [];

    return { raw, canonical };
  }, [agent, rawAgentCard]);

  const lifecycleStatus = useMemo(() => {
    if (!agent) return 'unknown';
    if (agent.deregistered === 1) return 'deregistered';
    if (agent.approved === 1) return 'approved';
    return 'registered';
  }, [agent]);

  const handleApprove = async () => {
    if (!id) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await approveAgent(id, { action: 'approve' });
      toast.success(`Agent ${response.id} was approved successfully.`);
      await loadAgent();
    } catch (err) {
      toast.error('Approval failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;

    const confirmed = window.confirm('Rejecting this agent will permanently remove it from the registry. Continue?');
    if (!confirmed) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await approveAgent(id, { action: 'reject' });
      toast.success(`Agent ${response.id} was rejected successfully.`);
      setAgent(null);
      setHealth(null);
      setDebugInfo(null);
    } catch (err) {
      toast.error('Rejection failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeregister = async () => {
    if (!id) return;

    const confirmed = window.confirm('Deregistering this agent will remove it from the registry. Continue?');
    if (!confirmed) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await deregisterAgent(id);
      toast.success(`Agent ${response.id} was deregistered successfully.`);
      await loadAgent();
    } catch (err) {
      toast.error('Deregistration failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-primary)' }}>Agent Details</h1>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)' }}>
          Detailed metadata, lifecycle state, and debug diagnostics for the selected agent.
        </p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {lifecycleStatus === 'registered' && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={actionLoading}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid #2563eb',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              Approve
            </button>
          )}
          {lifecycleStatus === 'registered' && (
            <button
              type="button"
              onClick={handleReject}
              disabled={actionLoading}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid #ef4444',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              Reject
            </button>
          )}
          {lifecycleStatus !== 'deregistered' && (
            <button
              type="button"
              onClick={handleDeregister}
              disabled={actionLoading}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid #ef4444',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              {actionLoading ? 'Processing…' : 'Deregister'}
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <p>Loading agent details...</p>
      ) : !agent ? (
        <p>Unable to load agent details.</p>
      ) : agent ? (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{agent.name}</h2>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>Agent ID: {agent.id}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {renderBadge(lifecycleStatus, lifecycleStatus)}
              {agent.status && renderBadge(agent.status, agent.status)}
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Metadata</h3>
              <dl style={{ display: 'grid', gap: '0.75rem', margin: 0 }}>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>URL</dt>
                  <dd style={{ margin: 0, color: 'var(--text-primary)' }}>{agent.url || 'N/A'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>Version</dt>
                  <dd style={{ margin: 0, color: 'var(--text-primary)' }}>{agent.version || 'N/A'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>Domain</dt>
                  <dd style={{ margin: 0, color: 'var(--text-primary)' }}>{agent.domain || 'N/A'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>Company</dt>
                  <dd style={{ margin: 0, color: 'var(--text-primary)' }}>{agent.company || 'N/A'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>Provider</dt>
                  <dd style={{ margin: 0, color: 'var(--text-primary)' }}>{(rawAgentCard?.provider as string) ?? 'N/A'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>Lifecycle state</dt>
                  <dd style={{ margin: 0, color: 'var(--text-primary)' }}>{lifecycleStatus}</dd>
                </div>
              </dl>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Health</h3>
              <dl style={{ display: 'grid', gap: '0.75rem', margin: 0 }}>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>Status</dt>
                  <dd style={{ margin: 0, color: 'var(--text-primary)' }}>{health?.status ?? 'Unavailable'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>Latency</dt>
                  <dd style={{ margin: 0, color: 'var(--text-primary)' }}>{health?.latency_ms != null ? `${health?.latency_ms} ms` : 'Unavailable'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>Last checked</dt>
                  <dd style={{ margin: 0, color: 'var(--text-primary)' }}>{health?.last_checked ?? 'Unavailable'}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section style={{ display: 'grid', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Capabilities</h3>
              <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Raw capabilities</p>
                  {capabilities.raw.length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No raw capability data available.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {capabilities.raw.map((capability) => (
                        <span key={capability} style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem' }}>
                          {capability}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Canonical capabilities</p>
                  {capabilities.canonical.length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No canonical capability data available.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {capabilities.canonical.map((capability) => (
                        <span key={capability} style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem' }}>
                          {capability}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Debug information</h3>
              {debugInfo ? (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, maxHeight: '420px', overflowY: 'auto' }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Debug details are not available for this agent or the debug API did not return additional information.
                </p>
              )}
            </div>
          </section>
        </div>
      ) : (
        <p>Agent not found.</p>
      )}
    </main>
  );
};

export default AgentDetailPage;
