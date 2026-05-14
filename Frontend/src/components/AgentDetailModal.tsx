import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import toast from 'react-hot-toast';
import Editor from 'react-simple-code-editor';
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";
import {
  getAgent,
  getAgentHealth,
  getDebugAgent,
  approveAgent,
  deregisterAgent,
} from '../api';
import type { AgentModel, AgentHealthResponse, Provider } from '../api/types';
import { CheckIcon, CloseIcon, TrashIcon, XIcon } from '../utils/icons';
import './AgentDetailModal.css';

const badgeStyles: Record<string, CSSProperties> = {
  registered: { backgroundColor: 'var(--surface-soft)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
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

const parseRawAgentCard = (agent: AgentModel) => {
  try {
    const raw = JSON.parse(agent.raw_agent_card);
    // Support both old string format and new Provider object format
    if (raw && typeof raw.provider === 'object' && raw.provider !== null) {
      return raw as { provider: Provider; [key: string]: unknown };
    }
    return raw as Record<string, unknown>;
  } catch {
    return null;
  }
};

const AgentDetailModal = ({ agentId, onClose, onActionComplete }: any) => {
  const [agent, setAgent] = useState<AgentModel | null>(null);
  const [health, setHealth] = useState<AgentHealthResponse | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAgent = async () => {
    try {
      setLoading(true);
      setError(null);
      const [agentResponse, healthResponse] = await Promise.all([
        getAgent(agentId),
        getAgentHealth(agentId),
      ]);

      setAgent(agentResponse.agent);
      setHealth(healthResponse);

      try {
        const debugResponse = await getDebugAgent(agentId);
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
  }, [agentId]);

  const rawAgentCard = useMemo(() => {
    if (!agent) return null;
    return parseRawAgentCard(agent);
  }, [agent]);


  const lifecycleStatus = useMemo(() => {
    if (!agent) return 'unknown';
    if (agent.deregistered === 1) return 'deregistered';
    if (agent.approved === 1) return 'approved';
    return 'registered';
  }, [agent]);

  const handleApprove = async () => {
    if (!agentId) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await approveAgent(agentId, { action: 'approve' });
      toast.success(`Agent ${response.id} was approved successfully.`);
      await loadAgent();
      onActionComplete?.();
    } catch (err) {
      toast.error('Approval failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!agentId) return;

    const confirmed = window.confirm('Rejecting this agent will permanently remove it from the registry. Continue?');
    if (!confirmed) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await approveAgent(agentId, { action: 'reject' });
      toast.success(`Agent ${response.id} was rejected successfully.`);
      onActionComplete?.();
      onClose();
    } catch (err) {
      toast.error('Rejection failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeregister = async () => {
    if (!agentId) return;

    const confirmed = window.confirm('Deregistering this agent will remove it from the registry. Continue?');
    if (!confirmed) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await deregisterAgent(agentId);
      toast.success(`Agent ${response.id} was deregistered successfully.`);
      await loadAgent();
      onActionComplete?.();
    } catch (err) {
      toast.error('Deregistration failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div style={{ flex: 1 }}>
            {!loading && agent ? (
              <>
                <h2 className="modal-dialog__heading">{agent.name}</h2>
                <p className="modal-dialog__description" style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                  {agent.description}
                </p>
              </>
            ) : (
              <h2 className="modal-dialog__heading">Agent details</h2>
            )}
          </div>
          <div className="modal-header__actions">
            {lifecycleStatus === 'registered' && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
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
                onClick={handleReject}
                disabled={actionLoading}
                className="action-button action-button--danger"
                title="Reject agent"
                aria-label="Reject agent"
              >
                <CloseIcon className="action-button__icon" />
              </button>
            )}
            {lifecycleStatus !== 'deregistered' && (
              <button
                type="button"
                onClick={handleDeregister}
                disabled={actionLoading}
                className="action-button action-button--deregister"
                title="Deregister agent"
                aria-label="Deregister agent"
              >
                <TrashIcon className="action-button__icon" />
              </button>
            )}
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close details modal" title="Close details modal">
              <XIcon className="action-button__icon" />
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading agent details…</p>
        ) : error ? (
          <p>{error}</p>
        ) : !agent ? (
          <p>Agent details are unavailable.</p>
        ) : (
          <div className="modal-section">
            {!loading && agent && (
              <div className="modal-badge-row" style={{ marginBottom: '1.5rem' }}>
                {renderBadge(lifecycleStatus, lifecycleStatus)}
                {agent.status && renderBadge(agent.status, agent.status)}
              </div>
            )}

            <div className="card modal-card">
              <h4 className="modal-dialog__heading">Agent Information</h4>
              <dl className="detail-meta">
                <div>
                  <dt>Endpoint</dt>
                  <dd>
                    {agent.url ? (
                      <a href={agent.url} target="_blank" rel="noopener noreferrer" className="provider-link">
                        {agent.url}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{agent.version || 'N/A'}</dd>
                </div>
                <div>
                  <dt>Company</dt>
                  <dd>{agent.company || 'N/A'}</dd>
                </div>
                <div>
                  <dt>Provider</dt>
                  <dd>
                    {rawAgentCard?.provider && typeof rawAgentCard.provider === 'object' ? (
                      <div className="provider-info">
                        <span className="provider-info__name">{(rawAgentCard.provider as Provider).name}</span>
                        <div className="provider-info__links">
                          <a 
                            href={(rawAgentCard.provider as Provider).website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="provider-link"
                          >
                            Website
                          </a>
                          <span className="provider-info__divider">|</span>
                          <a 
                            href={`mailto:${(rawAgentCard.provider as Provider).contact_email}`}
                            className="provider-link"
                          >
                            Contact
                          </a>
                        </div>
                      </div>
                    ) : (
                      (rawAgentCard?.provider as string) ?? 'N/A'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Lifecycle state</dt>
                  <dd>{lifecycleStatus}</dd>
                </div>
              </dl>
            </div>

            <div className="modal-dialog__two-col" style={{ marginTop: '1.5rem' }}>
              <div className="card modal-card">
                <h4 className="modal-dialog__heading" style={{ marginBottom: '1rem' }}>Capabilities</h4>
                <div className="capabilities-grid">
                  {agent.capabilities && (() => {
                    try {
                      const caps = typeof agent.capabilities === 'string'
                        ? JSON.parse(agent.capabilities || '{}')
                        : agent.capabilities;
                        
                      if (!caps || typeof caps !== 'object') return null;
                      
                      return Object.entries(caps).map(([name, value]) => (
                        <div key={name} className="capability-item">
                          <span className={`capability-icon ${value ? 'capability-icon--true' : 'capability-icon--false'}`}>
                            {value ? <CheckIcon /> : <CloseIcon />}
                          </span>
                          <span className="capability-name">
                            {name.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ));
                    } catch {
                      return <p className="detail-debug__status">Invalid capability data.</p>;
                    }
                  })()}
                </div>
              </div>

              <div className="card modal-card">
                <h4 className="modal-dialog__heading" style={{ marginBottom: '1rem' }}>Skills</h4>
                <div className="detail-tags__group">
                  {(() => {
                    try {
                      const skills = typeof agent.skills === 'string'
                        ? JSON.parse(agent.skills || '[]')
                        : agent.skills;
                        
                      if (!Array.isArray(skills) || skills.length === 0) {
                        return <p className="detail-debug__status">No skills available.</p>;
                      }
                      return skills.map((skill: any, idx: number) => {
                        const skillLabel = typeof skill === 'object' && skill !== null 
                          ? (skill.name || JSON.stringify(skill)) 
                          : String(skill);
                        return (
                          <span key={`${skillLabel}-${idx}`} className="tag tag--skill">
                            {skillLabel}
                          </span>
                        );
                      });
                    } catch {
                      return <p className="detail-debug__status">No skills available.</p>;
                    }
                  })()}
                </div>
              </div>
            </div>

            <details className="card modal-card debug-details" style={{ marginTop: '1.5rem' }}>
              <summary className="modal-dialog__row" style={{ cursor: 'pointer', listStyle: 'none' }}>
                <h4 className="modal-dialog__heading" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  Health Metrics
                  <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Click to expand)</span>
                </h4>
              </summary>
              <div style={{ marginTop: '1.5rem' }}>
                <dl className="detail-meta">
                  <div>
                    <dt>Status</dt>
                    <dd>{health?.status ?? 'Unavailable'}</dd>
                  </div>
                  <div>
                    <dt>Latency</dt>
                    <dd>{health?.latency_ms != null ? `${health?.latency_ms} ms` : 'Unavailable'}</dd>
                  </div>
                  <div>
                    <dt>Last checked</dt>
                    <dd>{health?.last_checked ?? 'Unavailable'}</dd>
                  </div>
                </dl>
              </div>
            </details>

            <details className="card modal-card debug-details">
              <summary className="modal-dialog__row" style={{ cursor: 'pointer', listStyle: 'none' }}>
                <h4 className="modal-dialog__heading" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  Debug information
                  <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Click to expand)</span>
                </h4>
              </summary>
              <div style={{ marginTop: '1rem' }}>
                <div className="detail-debug__status" style={{ marginBottom: '0.5rem' }}>
                  {debugInfo ? 'Loaded from debug API' : 'Debug details unavailable'}
                </div>
                {debugInfo ? (
                  <div className="detail-debug__editor">
                    <Editor
                      value={JSON.stringify(debugInfo, null, 2)}
                      onValueChange={() => {}}
                      highlight={(code) => Prism.highlight(code, Prism.languages.json, 'json')}
                      padding={15}
                      style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                        backgroundColor: 'var(--color-background-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--border-radius)',
                      }}
                      readOnly
                    />
                  </div>
                ) : (
                  <p className="detail-debug__status">
                    Debug details are not available for this agent or the debug API did not return additional information.
                  </p>
                )}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDetailModal;
