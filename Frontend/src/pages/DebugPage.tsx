import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
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
import '../styles/DebugPage.css';

type DebugView = 'agent' | 'search' | 'health' | 'state';

const DebugPage = () => {
  const [currentView, setCurrentView] = useState<DebugView>('state');
  const [agentId, setAgentId] = useState('');
  const [searchParams, setSearchParams] = useState<SearchAgentsQuery>({});
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const handleAgentInspection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await getDebugAgent(agentId.trim());
      setData(response);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch agent debug data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTrace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await searchDebug(searchParams);
      setData(response);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch search debug data.');
    } finally {
      setLoading(false);
    }
  };

  const handleHealthHistory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await getDebugAgentHealth(agentId.trim());
      setData(response);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch health debug data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemState = async () => {
    setLoading(true);
    try {
      const response = await getDebugState();
      setData(response);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch system state.');
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'agent':
        return (
          <section className="debug-page__section">
            <h2 className="debug-page__section-title">Agent Inspection</h2>
            <form onSubmit={handleAgentInspection} className="debug-page__form">
              <label className="debug-page__field">
                <span className="debug-page__label">Agent ID</span>
                <input
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Enter agent ID"
                  required
                  className="debug-page__input"
                />
              </label>
              <button type="submit" disabled={loading} className="debug-page__button">
                {loading ? 'Loading...' : 'Inspect Agent'}
              </button>
            </form>
          </section>
        );
      case 'search':
        return (
          <section className="debug-page__section">
            <h2 className="debug-page__section-title">Search Trace Visualization</h2>
            <form onSubmit={handleSearchTrace} className="debug-page__form">
              <label className="debug-page__field">
                <span className="debug-page__label">Agent ID</span>
                <input
                  value={searchParams.agent_id || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, agent_id: e.target.value || undefined })}
                  placeholder="Optional agent ID"
                  className="debug-page__input"
                />
              </label>
              <label className="debug-page__field">
                <span className="debug-page__label">Name</span>
                <input
                  value={searchParams.name || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value || undefined })}
                  placeholder="Optional name"
                  className="debug-page__input"
                />
              </label>
              <label className="debug-page__field">
                <span className="debug-page__label">Capability</span>
                <input
                  value={searchParams.capability || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, capability: e.target.value || undefined })}
                  placeholder="Optional capability"
                  className="debug-page__input"
                />
              </label>
              <label className="debug-page__field">
                <span className="debug-page__label">Match</span>
                <select
                  value={searchParams.match || 'partial'}
                  onChange={(e) => setSearchParams({ ...searchParams, match: e.target.value as 'exact' | 'partial' })}
                  className="debug-page__select"
                >
                  <option value="partial">Partial</option>
                  <option value="exact">Exact</option>
                </select>
              </label>
              <button type="submit" disabled={loading} className="debug-page__button">
                {loading ? 'Loading...' : 'Run Search Trace'}
              </button>
            </form>
          </section>
        );
      case 'health':
        return (
          <section className="debug-page__section">
            <h2 className="debug-page__section-title">Health Check History</h2>
            <form onSubmit={handleHealthHistory} className="debug-page__form">
              <label className="debug-page__field">
                <span className="debug-page__label">Agent ID</span>
                <input
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Enter agent ID"
                  required
                  className="debug-page__input"
                />
              </label>
              <button type="submit" disabled={loading} className="debug-page__button">
                {loading ? 'Loading...' : 'View Health History'}
              </button>
            </form>
          </section>
        );
      case 'state':
        return (
          <section className="debug-page__section">
            <h2 className="debug-page__section-title">System State Snapshot</h2>
            <button onClick={handleSystemState} disabled={loading} className="debug-page__button">
              {loading ? 'Loading...' : 'Load System State'}
            </button>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <main className="page-shell">
      <header className="debug-page__header">
        <h1 className="debug-page__title">Debug Viewer</h1>
        <p className="debug-page__copy">Inspect agents, visualize search traces, review health history, and view system state.</p>
      </header>

      <nav className="debug-page__nav">
        <button
          onClick={() => setCurrentView('agent')}
          className={`debug-page__nav-button ${currentView === 'agent' ? 'debug-page__nav-button--active' : ''}`}
        >
          Agent Inspection
        </button>
        <button
          onClick={() => setCurrentView('search')}
          className={`debug-page__nav-button ${currentView === 'search' ? 'debug-page__nav-button--active' : ''}`}
        >
          Search Trace
        </button>
        <button
          onClick={() => setCurrentView('health')}
          className={`debug-page__nav-button ${currentView === 'health' ? 'debug-page__nav-button--active' : ''}`}
        >
          Health History
        </button>
        <button
          onClick={() => setCurrentView('state')}
          className={`debug-page__nav-button ${currentView === 'state' ? 'debug-page__nav-button--active' : ''}`}
        >
          System State
        </button>
      </nav>

      {renderView()}

      {!!data && (
        <section className="debug-page__data">
          <h2 className="debug-page__data-title">Debug Data</h2>
          <pre className="debug-page__data-pre">
            {JSON.stringify(data, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
};

export default DebugPage;
