import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
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
  registered: { backgroundColor: '#f8fafc', color: '#0369a1', border: '1px solid #bae6fd' },
  approved: { backgroundColor: '#ecfdf5', color: '#166534', border: '1px solid #a7f3d0' },
  deregistered: { backgroundColor: '#fff1f2', color: '#991b1b', border: '1px solid #fecaca' },
  healthy: { backgroundColor: '#ecfdf5', color: '#166534', border: '1px solid #a7f3d0' },
  unhealthy: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' },
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
  const [message, setMessage] = useState<string | null>(null);
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
      setMessage(null);
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
    setMessage(null);

    try {
      const response = await approveAgent(id, { action: 'approve' });
      setMessage(`Agent ${response.id} was approved successfully.`);
      await loadAgent();
    } catch (err) {
      setError('Approval failed. Please try again.');
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
    setMessage(null);

    try {
      const response = await approveAgent(id, { action: 'reject' });
      setMessage(`Agent ${response.id} was rejected successfully.`);
      setAgent(null);
      setHealth(null);
      setDebugInfo(null);
    } catch (err) {
      setError('Rejection failed. Please try again.');
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
    setMessage(null);

    try {
      const response = await deregisterAgent(id);
      setMessage(`Agent ${response.id} was deregistered successfully.`);
      await loadAgent();
    } catch (err) {
      setError('Deregistration failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: '#111827' }}>Agent Details</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>
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

      {message && (
        <section style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '1rem', backgroundColor: '#ecfdf5', color: '#166534', border: '1px solid #a7f3d0' }}>
          {message}
        </section>
      )}

      {loading ? (
        <p>Loading agent details...</p>
      ) : error ? (
        <p style={{ color: '#dc2626' }}>{error}</p>
      ) : agent ? (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>{agent.name}</h2>
              <p style={{ margin: '0.5rem 0 0', color: '#4b5563' }}>Agent ID: {agent.id}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {renderBadge(lifecycleStatus, lifecycleStatus)}
              {agent.status && renderBadge(agent.status, agent.status)}
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ borderRadius: '1rem', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#111827' }}>Metadata</h3>
              <dl style={{ display: 'grid', gap: '0.75rem', margin: 0 }}>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: '#6b7280' }}>URL</dt>
                  <dd style={{ margin: 0, color: '#111827' }}>{agent.url || 'N/A'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: '#6b7280' }}>Version</dt>
                  <dd style={{ margin: 0, color: '#111827' }}>{agent.version || 'N/A'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: '#6b7280' }}>Domain</dt>
                  <dd style={{ margin: 0, color: '#111827' }}>{agent.domain || 'N/A'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: '#6b7280' }}>Company</dt>
                  <dd style={{ margin: 0, color: '#111827' }}>{agent.company || 'N/A'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: '#6b7280' }}>Provider</dt>
                  <dd style={{ margin: 0, color: '#111827' }}>{(rawAgentCard?.provider as string) ?? 'N/A'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: '#6b7280' }}>Lifecycle state</dt>
                  <dd style={{ margin: 0, color: '#111827' }}>{lifecycleStatus}</dd>
                </div>
              </dl>
            </div>

            <div style={{ borderRadius: '1rem', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#111827' }}>Health</h3>
              <dl style={{ display: 'grid', gap: '0.75rem', margin: 0 }}>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: '#6b7280' }}>Status</dt>
                  <dd style={{ margin: 0, color: '#111827' }}>{health?.status ?? 'Unavailable'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: '#6b7280' }}>Latency</dt>
                  <dd style={{ margin: 0, color: '#111827' }}>{health?.latency_ms != null ? `${health?.latency_ms} ms` : 'Unavailable'}</dd>
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <dt style={{ color: '#6b7280' }}>Last checked</dt>
                  <dd style={{ margin: 0, color: '#111827' }}>{health?.last_checked ?? 'Unavailable'}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ borderRadius: '1rem', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#111827' }}>Capabilities</h3>
              <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem', color: '#6b7280', fontSize: '0.95rem' }}>Raw capabilities</p>
                  {capabilities.raw.length === 0 ? (
                    <p style={{ margin: 0, color: '#4b5563' }}>No raw capability data available.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {capabilities.raw.map((capability) => (
                        <span key={capability} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem' }}>
                          {capability}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem', color: '#6b7280', fontSize: '0.95rem' }}>Canonical capabilities</p>
                  {capabilities.canonical.length === 0 ? (
                    <p style={{ margin: 0, color: '#4b5563' }}>No canonical capability data available.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {capabilities.canonical.map((capability) => (
                        <span key={capability} style={{ backgroundColor: '#ecfdf5', color: '#166534', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem' }}>
                          {capability}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ borderRadius: '1rem', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#111827' }}>Debug information</h3>
              {debugInfo ? (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem', color: '#111827', margin: 0, maxHeight: '420px', overflowY: 'auto' }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              ) : (
                <p style={{ margin: 0, color: '#4b5563' }}>
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
