import { useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';
import { registerAgent } from '../api';
import { XIcon } from '../utils/icons';
import './RegisterAgentModal.css';

type RegisterAgentModalProps = {
  onClose: () => void;
  onRegisterSuccess?: () => void;
};

const RegisterAgentModal = ({ onClose, onRegisterSuccess }: RegisterAgentModalProps) => {
  const [mode, setMode] = useState<'json' | 'url'>('json');
  const [agentCard, setAgentCard] = useState<string>('');
  const [agentUrl, setAgentUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: Record<string, unknown> = {};

    if (mode === 'json') {
      if (!agentCard.trim()) {
        toast.error('Please provide a valid JSON agent card.');
        return;
      }

      try {
        payload.agent_card = JSON.parse(agentCard);
      } catch (err) {
        try {
          const fixedCard = agentCard.replace(/([\]}"a-zA-Z0-9])\s*\n\s*"/g, '$1,\n"');
          payload.agent_card = JSON.parse(fixedCard);
        } catch {
          toast.error('Invalid JSON. Please correct the agent card and try again.');
          return;
        }
      }
    } else {
      if (!agentUrl.trim()) {
        toast.error('Please provide a URL to fetch the agent card.');
        return;
      }
      payload.url = agentUrl.trim();
    }

    try {
      setLoading(true);
      const result = await registerAgent(payload);
      toast.success(`Agent registered successfully. ID: ${result.id}`);
      setAgentCard('');
      setAgentUrl('');
      onRegisterSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && err !== null && 'data' in err) {
        const apiError = err as Record<string, unknown>;
        toast.error(
          typeof apiError.data === 'string'
            ? (apiError.data as string)
            : JSON.stringify(apiError.data ?? 'Registration failed.')
        );
      } else {
        toast.error('Registration failed. Please check your input and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog register-agent-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header register-agent-modal__header">
          <div>
            <h2 className="register-agent-modal__title">Register Agent</h2>
            <p className="register-agent-modal__subtext">
              Submit an agent card as JSON or provide an agent URL to register a new agent.
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close registration modal">
            <XIcon className="action-button__icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="register-agent-modal__form">
          <div className="register-agent-modal__toggle">
            <button
              type="button"
              onClick={() => setMode('json')}
              className={`register-agent-modal__toggle-button${mode === 'json' ? ' active' : ''}`}
            >
              JSON Agent Card
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`register-agent-modal__toggle-button${mode === 'url' ? ' active' : ''}`}
            >
              Agent URL
            </button>
          </div>

          <p className="register-agent-modal__hint">
            {mode === 'json'
              ? 'Paste a complete agent JSON card below. We will validate the structure before sending it to the backend.'
              : 'Provide a valid URL where the backend can fetch the agent card from.'}
          </p>

          {mode === 'json' ? (
            <label className="register-agent-modal__field">
              <span className="register-agent-modal__label">Agent Card JSON</span>
              <Editor
                value={agentCard}
                onValueChange={setAgentCard}
                highlight={(code) => Prism.highlight(code, Prism.languages.json, 'json')}
                padding={16}
                placeholder='{
  "name": "Example Agent",
  "description": "An A2A-compatible agent",
  "url": "https://example.com/agent",
  "version": "1.0",
  "domain": "finance",
  "company": "Acme Corp",
  "capabilities": ["weather", "forecast"]
}'
                 style={{
                      fontFamily: '"Fira code", "Fira Mono", monospace',
                      fontSize: 12,
                      backgroundColor: 'var(--color-background-secondary)',
                      borderRadius: '12px',
                      minHeight: '300px',
                       border: "1px solid #334155"
                    }}
              />
            </label>
          ) : (
            <label className="register-agent-modal__field">
              <span className="register-agent-modal__label">Agent Card URL</span>
              <input
                type="url"
                value={agentUrl}
                onChange={(event) => setAgentUrl(event.target.value)}
                placeholder="https://example.com"
                className="register-agent-modal__input"
              />
            </label>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary register-agent-modal__submit">
            {loading ? 'Registering…' : 'Register Agent'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterAgentModal;
