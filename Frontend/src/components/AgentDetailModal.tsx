import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Editor from 'react-simple-code-editor';
import {
  approveAgent,
  deregisterAgent,
  getAgent,
  getAgentHealth,
  getDebugAgent,
} from '../api';
import type { AgentHealthResponse, AgentModel } from '../api/types';
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
    return JSON.parse(agent.raw_agent_card) as Record<string, unknown>;
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
          <div>
            <h2 className="modal-dialog__heading">Agent details</h2>
            <p className="modal-dialog__subtext">
              View lifecycle state, health, capabilities, and debug diagnostics.
            </p>
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
            <div className="modal-dialog__row">
              <div>
                <h3 className="modal-dialog__heading">{agent.name}</h3>
                <p className="modal-dialog__subtext">Agent ID: {agent.id}</p>
              </div>
              <div className="modal-badge-row">
                {renderBadge(lifecycleStatus, lifecycleStatus)}
                {agent.status && renderBadge(agent.status, agent.status)}
              </div>
            </div>

            <div className="modal-dialog__two-col">
              <div className="card modal-card">
                <h4 className="modal-dialog__heading">Metadata</h4>
                <dl className="detail-meta">
                  <div>
                    <dt>URL</dt>
                    <dd>{agent.url || 'N/A'}</dd>
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
                    <dd>{(rawAgentCard?.provider as string) ?? 'N/A'}</dd>
                  </div>
                  <div>
                    <dt>Lifecycle state</dt>
                    <dd>{lifecycleStatus}</dd>
                  </div>
                </dl>
              </div>

              <div className="card modal-card">
                <h4 className="modal-dialog__heading">Health</h4>
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
            </div>

            <div className="card modal-card">
              <div className="modal-dialog__row">
                <h4 className="modal-dialog__heading">Capabilities</h4>
                <div className="detail-debug__status">
                  {capabilities.raw.length > 0 ? `${capabilities.raw.length} raw` : 'No raw capabilities'}
                  {capabilities.canonical.length > 0 ? ` · ${capabilities.canonical.length} canonical` : ''}
                </div>
              </div>

              <div className="detail-tags">
                <div>
                  <p className="detail-tags__heading">Raw capability tags</p>
                  {capabilities.raw.length === 0 ? (
                    <p className="detail-debug__status">No raw capability data available.</p>
                  ) : (
                    <div className="detail-tags__group">
                      {capabilities.raw.map((capability) => (
                        <span key={capability} className="tag tag--raw">
                          {capability}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="detail-tags__heading">Canonical capability tags</p>
                  {capabilities.canonical.length === 0 ? (
                    <p className="detail-debug__status">No canonical capability data available.</p>
                  ) : (
                    <div className="detail-tags__group">
                      {capabilities.canonical.map((capability) => (
                        <span key={capability} className="tag tag--canonical">
                          {capability}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card modal-card">
              <div className="modal-dialog__row">
                <h4 className="modal-dialog__heading">Debug information</h4>
                <div className="detail-debug__status">{debugInfo ? 'Loaded from debug API' : 'Debug details unavailable'}</div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDetailModal;
