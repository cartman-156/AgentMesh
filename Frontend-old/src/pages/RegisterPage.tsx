import { useState } from 'react';
import type { FormEvent } from 'react';
import { registerAgent } from '../api';
import type { RegisterAgentResponse } from '../api/types';

const RegisterPage = () => {
  const [mode, setMode] = useState<'json' | 'url'>('json');
  const [agentCard, setAgentCard] = useState<string>('');
  const [agentUrl, setAgentUrl] = useState<string>('');
  const [response, setResponse] = useState<RegisterAgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResponse(null);
    setError(null);

    const payload: Record<string, unknown> = {};

    if (mode === 'json') {
      if (!agentCard.trim()) {
        setError('Please provide a valid JSON agent card.');
        return;
      }

      try {
        payload.agent_card = JSON.parse(agentCard);
      } catch (err) {
        try {
          // Auto-fix missing commas between lines for common copy-paste errors
          const fixedCard = agentCard.replace(/([\]}"a-zA-Z0-9])\s*\n\s*"/g, '$1,\n"');
          payload.agent_card = JSON.parse(fixedCard);
        } catch (innerErr) {
          setError('Invalid JSON. Please correct the agent card and try again.');
          return;
        }
      }
    } else {
      if (!agentUrl.trim()) {
        setError('Please provide a URL to fetch the agent card.');
        return;
      }

      payload.url = agentUrl.trim();
    }

    try {
      setLoading(true);
      const result = await registerAgent(payload);
      setResponse(result);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && err !== null && 'data' in err) {
        // API client error format
        const apiError = err as Record<string, unknown>;
        setError(
          typeof apiError.data === 'string'
            ? (apiError.data as string)
            : JSON.stringify(apiError.data ?? 'Registration failed.')
        );
      } else {
        setError('Registration failed. Please check your input and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: '#111827' }}>Register Agent</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>
          Submit a JSON agent card or provide a URL to register an agent with the backend.
        </p>
      </header>

      <section style={{ display: 'grid', gap: '1rem', maxWidth: 900 }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setMode('json')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: mode === 'json' ? '1px solid #3b82f6' : '1px solid #d1d5db',
              backgroundColor: mode === 'json' ? '#eff6ff' : '#ffffff',
              color: '#1f2937',
              cursor: 'pointer',
            }}
          >
            JSON Agent Card
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: mode === 'url' ? '1px solid #3b82f6' : '1px solid #d1d5db',
              backgroundColor: mode === 'url' ? '#eff6ff' : '#ffffff',
              color: '#1f2937',
              cursor: 'pointer',
            }}
          >
            Agent URL
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          {mode === 'json' ? (
            <label style={{ display: 'grid', gap: '0.5rem' }}>
              <span style={{ color: '#374151', fontWeight: 600 }}>Agent Card JSON</span>
              <textarea
                value={agentCard}
                onChange={(event) => setAgentCard(event.target.value)}
                rows={12}
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
                  width: '100%',
                  minHeight: '260px',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: '0.95rem',
                  color: '#111827',
                }}
              />
            </label>
          ) : (
            <label style={{ display: 'grid', gap: '0.5rem' }}>
              <span style={{ color: '#374151', fontWeight: 600 }}>Agent Card URL</span>
              <input
                type="url"
                value={agentUrl}
                onChange={(event) => setAgentUrl(event.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.95rem',
                  color: '#111827',
                }}
              />
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.9rem 1.25rem',
              borderRadius: '0.75rem',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Registering…' : 'Register Agent'}
          </button>
        </form>

        {response && (
          <section style={{ borderRadius: '1rem', border: '1px solid #d1fae5', backgroundColor: '#ecfdf5', padding: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: '#166534' }}>Registration successful</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#115e59' }}>
              Agent registered with ID <strong>{response.id}</strong> and status <strong>{response.status}</strong>.
            </p>
          </section>
        )}

        {error && (
          <section style={{ borderRadius: '1rem', border: '1px solid #fecaca', backgroundColor: '#fef2f2', padding: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: '#991b1b' }}>Registration failed</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#7f1d1d' }}>{error}</p>
          </section>
        )}
      </section>
    </main>
  );
};

export default RegisterPage;
