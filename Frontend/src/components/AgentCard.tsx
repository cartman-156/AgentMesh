import type { AgentModel, Provider } from '../api/types';
import { EyeIcon, CheckIcon, TrashIcon, StopIcon } from '../utils/icons';
import './AgentCard.css';

export type AgentCardProps = {
  agent: AgentModel;
  isActionLoading: boolean;
  onApprove: (agentId: string) => void;
  onReject: (agentId: string) => void;
  onDeregister: (agentId: string) => void;
  onView: (agentId: string) => void;
  showActions?: boolean;
};

const getLifecycleStatus = (agent: AgentModel) => {
  if (agent.deregistered === 1) return 'deregistered';
  if (agent.approved === 1) return 'approved';
  return 'registered';
};

const getProvider = (agent: AgentModel): Provider | string | null => {
  try {
    const raw = typeof agent.raw_agent_card === 'string' 
      ? JSON.parse(agent.raw_agent_card || '{}') 
      : agent.raw_agent_card;
    return raw?.provider || null;
  } catch {
    return null;
  }
};

const getEnabledCapabilities = (agent: AgentModel) => {
  try {
    const payload = typeof agent.capabilities === 'string'
      ? JSON.parse(agent.capabilities || '{}')
      : agent.capabilities;
      
    if (!payload || typeof payload !== 'object') return [];
    
    return Object.entries(payload)
      .filter(([_, value]) => value === true)
      .map(([key]) => key.replace(/_/g, ' '));
  } catch {
    return [];
  }
};

const getSkills = (agent: AgentModel) => {
  try {
    const skills = typeof agent.skills === 'string'
      ? JSON.parse(agent.skills || '[]')
      : agent.skills;
      
    return Array.isArray(skills) ? skills : [];
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
  showActions = true,
}: AgentCardProps) => {
  const lifecycleStatus = getLifecycleStatus(agent);
  const enabledCapabilities = getEnabledCapabilities(agent);
  const skills = getSkills(agent);
  const statusClass = `badge badge-${lifecycleStatus}`;

  return (
    <article className="card agent-card">
      <div className="agent-card__header">
        <div>
          <div className="agent-card__title-row">
            <h2 
              className="agent-card__title clickable-title"
              onClick={() => agent?.id && onView(agent.id)}
              style={{ cursor: 'pointer' }}
              title="Click to view details"
            >
              {String(agent?.name ?? 'Unnamed Agent')}
            </h2>
            {(() => {
              const provider = getProvider(agent);
              if (!provider) return null;
              try {
                const providerName = (typeof provider === 'object' && provider !== null) 
                  ? (provider as Provider).name 
                  : String(provider);
                return <span className="agent-card__provider">by {String(providerName)}</span>;
              } catch {
                return null;
              }
            })()}
          </div>
          <p className="agent-card__meta">ID: {String(agent?.id ?? 'N/A')}</p>
        </div>
        <div className="agent-card__status-row">
          <span className={statusClass}>{lifecycleStatus}</span>
          <button
            type="button"
            onClick={() => agent?.id && onView(agent.id)}
            className="action-button action-button--secondary action-button--text"
            title="View agent details"
            aria-label="View agent details"
          >
            <EyeIcon className="action-button__icon" />
          </button>
        </div>
      </div>

      <div className="agent-card__tags-section">
        {enabledCapabilities.length > 0 && (
          <div className="agent-card__tag-group">
            <span className="agent-card__tag-label">Capabilities:</span>
            <div className="agent-card__tags">
              {enabledCapabilities.map((capability) => (
                <span key={String(capability)} className="tag">
                  {String(capability)}
                </span>
              ))}
            </div>
          </div>
        )}
        {(skills || []).length > 0 && (
          <div className="agent-card__tag-group" style={{ marginTop: '0.75rem' }}>
            <span className="agent-card__tag-label">Skills:</span>
            <div className="agent-card__tags">
              {(skills || []).map((skill: any, idx: number) => {
                const skillLabel = typeof skill === 'object' && skill !== null 
                  ? (skill.name || JSON.stringify(skill)) 
                  : String(skill);
                return (
                  <span key={`${skillLabel}-${idx}`} className="tag tag--skill">
                    {skillLabel}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {enabledCapabilities.length === 0 && (skills || []).length === 0 && (
          <span className="agent-card__meta">No capabilities or skills</span>
        )}
      </div>

      <div className="agent-card__stats">
        <div>
          <strong>Status:</strong> {String(agent?.status ?? 'unknown')}
        </div>
        <div>
          <strong>Latency:</strong> {agent?.latency_ms != null ? `${agent.latency_ms} ms` : 'N/A'}
        </div>
      </div>

      {showActions && (
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
              <TrashIcon className="action-button__icon" />
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
            <StopIcon className="action-button__icon" />
          </button>
        </div>
      )}
    </article>
  );
};

export default AgentCard;
