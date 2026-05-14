import type { AgentModel } from '../api/types';
import './AgentCard.css';

export type AgentCardProps = {
  agent: AgentModel;
  isActionLoading: boolean;
  onApprove: (agentId: string) => void;
  onReject: (agentId: string) => void;
  onDeregister: (agentId: string) => void;
  onView: (agentId: string) => void;
};

type IconProps = {
  className?: string;
};

const EyeIcon = ({ className }: IconProps) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CheckIcon = ({ className }: IconProps) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const CloseIcon = ({ className }: IconProps) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

const TrashIcon = ({ className }: IconProps) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6 17.5 20H6.5L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

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

const AgentCard = ({
  agent,
  isActionLoading,
  onApprove,
  onReject,
  onDeregister,
  onView,
}: AgentCardProps) => {
  const lifecycleStatus = getLifecycleStatus(agent);
  const canonicalCapabilities = getCanonicalCapabilities(agent);
  const statusClass = `badge badge-${lifecycleStatus}`;

  return (
    <article className="card agent-card">
      <div className="agent-card__header">
        <div>
          <h2 className="agent-card__title">{agent.name}</h2>
          <p className="agent-card__description">{agent.description}</p>
          <p className="agent-card__meta">ID: {agent.id}</p>
        </div>
        <div className="agent-card__status-row">
          <span className={statusClass}>{lifecycleStatus}</span>
          <button
            type="button"
            onClick={() => onView(agent.id)}
            className="action-button action-button--secondary action-button--text"
            title="View agent details"
            aria-label="View agent details"
          >
            <EyeIcon className="action-button__icon" />
          </button>
        </div>
      </div>

      <div className="agent-card__tags">
        {canonicalCapabilities.length > 0 ? (
          canonicalCapabilities.map((capability) => (
            <span key={capability} className="tag">
              {capability}
            </span>
          ))
        ) : (
          <span className="agent-card__meta">No canonical capabilities</span>
        )}
      </div>

      <div className="agent-card__stats">
        <div>
          <strong>Status:</strong> {agent.status}
        </div>
        <div>
          <strong>Latency:</strong> {agent.latency_ms !== null ? `${agent.latency_ms} ms` : 'N/A'}
        </div>
      </div>

      <div className="agent-card__actions">
        {lifecycleStatus === 'registered' && (
          <button
            type="button"
            onClick={() => onApprove(agent.id)}
            disabled={isActionLoading}
            className="action-button action-button--approve"
            title="Approve agent"
            aria-label="Approve agent"
          >
            <CheckIcon className="action-button__icon" />
          </button>
        )}
        {lifecycleStatus === 'registered' && (
          <button
            type="button"
            onClick={() => onReject(agent.id)}
            disabled={isActionLoading}
            className="action-button action-button--danger"
            title="Reject agent"
            aria-label="Reject agent"
          >
            <CloseIcon className="action-button__icon" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDeregister(agent.id)}
          disabled={isActionLoading || lifecycleStatus === 'deregistered'}
          className={`action-button ${lifecycleStatus === 'deregistered' ? 'action-button--secondary' : 'action-button--deregister'}`}
          title="Deregister agent"
          aria-label="Deregister agent"
        >
          <TrashIcon className="action-button__icon" />
        </button>
      </div>
    </article>
  );
};

export default AgentCard;
