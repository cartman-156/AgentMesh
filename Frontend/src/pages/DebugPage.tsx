import { FormEvent, useState } from 'react';
import {
  getDebugAgent,
  searchDebug,
  getDebugState,
  getDebugAgentHealth,
} from '../api/agentApi';
import type {
  DebugAgentResponse,
  DebugSearchResponse,
  DebugStateResponse,
  DebugHealthResponse,
  SearchAgentsQuery,
} from '../api/types';

type DebugView = 'agent' | 'search' | 'health' | 'state';

const DebugPage = () => {
  const [currentView, setCurrentView] = useState<DebugView>('state');
  const [agentId, setAgentId] = useState('');
  const [searchParams, setSearchParams] = useState<SearchAgentsQuery>({});
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAgentInspection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await getDebugAgent(agentId.trim());
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent debug data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTrace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await searchDebug(searchParams);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch search debug data.');
    } finally {
      setLoading(false);
    }
  };

  const handleHealthHistory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await getDebugAgentHealth(agentId.trim());
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health debug data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemState = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await getDebugState();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system state.');
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'agent':
        return (
          <section>
            <h2>Agent Inspection</h2>
            <form onSubmit={handleAgentInspection} style={{ display: 'grid', gap: '12px', maxWidth: '400px' }}>
              <label>
                Agent ID
                <input
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Enter agent ID"
                  required
                  style={{ padding: '8px', width: '100%' }}
                />
              </label>
              <button type="submit" disabled={loading} style={{ padding: '10px' }}>
                {loading ? 'Loading...' : 'Inspect Agent'}
              </button>
            </form>
          </section>
        );
      case 'search':
        return (
          <section>
            <h2>Search Trace Visualization</h2>
            <form onSubmit={handleSearchTrace} style={{ display: 'grid', gap: '12px', maxWidth: '400px' }}>
              <label>
                Agent ID
                <input
                  value={searchParams.agent_id || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, agent_id: e.target.value || undefined })}
                  placeholder="Optional agent ID"
                  style={{ padding: '8px', width: '100%' }}
                />
              </label>
              <label>
                Name
                <input
                  value={searchParams.name || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value || undefined })}
                  placeholder="Optional name"
                  style={{ padding: '8px', width: '100%' }}
                />
              </label>
              <label>
                Capability
                <input
                  value={searchParams.capability || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, capability: e.target.value || undefined })}
                  placeholder="Optional capability"
                  style={{ padding: '8px', width: '100%' }}
                />
              </label>
              <label>
                Match
                <select
                  value={searchParams.match || 'partial'}
                  onChange={(e) => setSearchParams({ ...searchParams, match: e.target.value as 'exact' | 'partial' })}
                  style={{ padding: '8px', width: '100%' }}
                >
                  <option value="partial">Partial</option>
                  <option value="exact">Exact</option>
                </select>
              </label>
              <button type="submit" disabled={loading} style={{ padding: '10px' }}>
                {loading ? 'Loading...' : 'Run Search Trace'}
              </button>
            </form>
          </section>
        );
      case 'health':
        return (
          <section>
            <h2>Health Check History</h2>
            <form onSubmit={handleHealthHistory} style={{ display: 'grid', gap: '12px', maxWidth: '400px' }}>
              <label>
                Agent ID
                <input
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Enter agent ID"
                  required
                  style={{ padding: '8px', width: '100%' }}
                />
              </label>
              <button type="submit" disabled={loading} style={{ padding: '10px' }}>
                {loading ? 'Loading...' : 'View Health History'}
              </button>
            </form>
          </section>
        );
      case 'state':
        return (
          <section>
            <h2>System State Snapshot</h2>
            <button onClick={handleSystemState} disabled={loading} style={{ padding: '10px' }}>
              {loading ? 'Loading...' : 'Load System State'}
            </button>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Debug Viewer</h1>
      <p>Inspect agents, visualize search traces, review health history, and view system state.</p>

      <nav style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setCurrentView('agent')}
          style={{ marginRight: '12px', padding: '8px 16px', background: currentView === 'agent' ? '#ddd' : '#f0f0f0' }}
        >
          Agent Inspection
        </button>
        <button
          onClick={() => setCurrentView('search')}
          style={{ marginRight: '12px', padding: '8px 16px', background: currentView === 'search' ? '#ddd' : '#f0f0f0' }}
        >
          Search Trace
        </button>
        <button
          onClick={() => setCurrentView('health')}
          style={{ marginRight: '12px', padding: '8px 16px', background: currentView === 'health' ? '#ddd' : '#f0f0f0' }}
        >
          Health History
        </button>
        <button
          onClick={() => setCurrentView('state')}
          style={{ padding: '8px 16px', background: currentView === 'state' ? '#ddd' : '#f0f0f0' }}
        >
          System State
        </button>
      </nav>

      {renderView()}

      {error && (
        <div style={{ marginTop: '18px', color: '#b00020' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!!data && (
        <section style={{ marginTop: '24px' }}>
          <h2>Debug Data</h2>
          <pre style={{ background: '#f4f4f4', padding: '12px', borderRadius: '8px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
};

export default DebugPage;
