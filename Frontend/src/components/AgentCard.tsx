import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import type { AgentModel } from '../api/types';

export type AgentCardProps = {
  agent: AgentModel;
  isActionLoading: boolean;
  onApprove: (agentId: string) => void;
  onReject: (agentId: string) => void;
  onDeregister: (agentId: string) => void;
};

const badgeStyles: Record<string, CSSProperties> = {
  registered: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' },
  approved: { backgroundColor: '#ecfdf5', color: '#166534', border: '1px solid #a7f3d0' },
  deregistered: { backgroundColor: '#f5f3f7', color: '#581c87', border: '1px solid #ddd6fe' },
  healthy: { backgroundColor: '#ecfdf5', color: '#166534', border: '1px solid #a7f3d0' },
  unhealthy: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' },
};

const getLifecycleStatus = (agent: AgentModel) => {
  if (agent.deregistered === 1) return 'deregistered';
  if (agent.approved === 1) return 'approved';
  return 'registered';
};

const getCanonicalCapabilities = (agent: AgentModel) => {
  try {
    const payload = JSON.parse(agent.capabilities) as Record<string, unknown>;
    return Array.isArray(payload?.canonical_capabilities)
      ? payload.canonical_capabilities.filter((cap): cap is string => typeof cap === 'string')
      : [];
  } catch {
    return [];
  }
};

const AgentCard = ({ agent, isActionLoading, onApprove, onReject, onDeregister }: AgentCardProps) => {
  const lifecycleStatus = getLifecycleStatus(agent);
  const canonicalCapabilities = getCanonicalCapabilities(agent);

  return (
    <article style={{ borderRadius: '1rem', border: '1px solid #e5e7eb', padding: '1.25rem', backgroundColor: '#ffffff', display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>{agent.name}</h2>
          <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>{agent.id}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ borderRadius: '9999px', padding: '0.45rem 0.85rem', fontWeight: 600, fontSize: '0.85rem', ...badgeStyles[lifecycleStatus] }}>{lifecycleStatus}</span>
          <Link
            to={`/agents/${encodeURIComponent(agent.id)}`}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              color: '#1f2937',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            View
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {canonicalCapabilities.length > 0 ? (
          canonicalCapabilities.map((capability) => (
            <span key={capability} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem' }}>
              {capability}
            </span>
          ))
        ) : (
          <span style={{ color: '#6b7280' }}>No canonical capabilities</span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ color: '#4b5563' }}>
          <strong>Status:</strong> {agent.status}
        </div>
        <div style={{ color: '#4b5563' }}>
          <strong>Latency:</strong> {agent.latency_ms !== null ? `${agent.latency_ms} ms` : 'N/A'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {lifecycleStatus === 'registered' && (
          <button
            type="button"
            onClick={() => onApprove(agent.id)}
            disabled={isActionLoading}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid #2563eb',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              cursor: isActionLoading ? 'not-allowed' : 'pointer',
              opacity: isActionLoading ? 0.7 : 1,
            }}
          >
            Approve
          </button>
        )}
        {lifecycleStatus === 'registered' && (
          <button
            type="button"
            onClick={() => onReject(agent.id)}
            disabled={isActionLoading}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid #ef4444',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              cursor: isActionLoading ? 'not-allowed' : 'pointer',
              opacity: isActionLoading ? 0.7 : 1,
            }}
          >
            Reject
          </button>
        )}
        <button
          type="button"
          onClick={() => onDeregister(agent.id)}
          disabled={isActionLoading || lifecycleStatus === 'deregistered'}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            border: '1px solid #ef4444',
            backgroundColor: lifecycleStatus === 'deregistered' ? '#fef2f2' : '#ef4444',
            color: lifecycleStatus === 'deregistered' ? '#9b1c1c' : '#ffffff',
            cursor: lifecycleStatus === 'deregistered' || isActionLoading ? 'not-allowed' : 'pointer',
            opacity: lifecycleStatus === 'deregistered' ? 0.6 : 1,
          }}
        >
          {isActionLoading ? 'Processing…' : 'Deregister'}
        </button>
      </div>
    </article>
  );
};

export default AgentCard;
