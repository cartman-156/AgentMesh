import { FormEvent, useState } from 'react';
import { searchAgents } from '../api/agentApi';
import type { SearchResult } from '../api/types';

const SearchPage = () => {
  const [capability, setCapability] = useState('');
  const [matchMode, setMatchMode] = useState<'partial' | 'exact'>('partial');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [queryInfo, setQueryInfo] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await searchAgents({
        capability: capability.trim() || undefined,
        match: matchMode,
      });

      setResults(response.results ?? []);
      setQueryInfo(response.query ?? {});
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to search agents.'
      );
      setResults([]);
      setQueryInfo({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '24px', maxWidth: '980px', margin: '0 auto' }}>
      <h1>Capability Search</h1>
      <p>Search registered agents by capability and review ranked match results.</p>

      <form onSubmit={handleSearch} style={{ display: 'grid', gap: '12px' }}>
        <label style={{ display: 'grid', gap: '6px' }}>
          Capability
          <input
            value={capability}
            onChange={(event) => setCapability(event.target.value)}
            placeholder="Enter a capability name or keyword"
            style={{ padding: '10px', fontSize: '1rem', width: '100%' }}
          />
        </label>

        <fieldset style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px' }}>
          <legend>Match mode</legend>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="radio"
              name="matchMode"
              value="partial"
              checked={matchMode === 'partial'}
              onChange={() => setMatchMode('partial')}
            />
            Partial
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
            <input
              type="radio"
              name="matchMode"
              value="exact"
              checked={matchMode === 'exact'}
              onChange={() => setMatchMode('exact')}
            />
            Exact
          </label>
        </fieldset>

        <button
          type="submit"
          disabled={loading || capability.trim() === ''}
          style={{ padding: '12px 18px', fontSize: '1rem', cursor: 'pointer' }}
        >
          {loading ? 'Searching…' : 'Search Capabilities'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: '18px', color: '#b00020' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {Object.keys(queryInfo).length > 0 && (
        <section style={{ marginTop: '24px' }}>
          <h2>Search query</h2>
          <pre style={{ background: '#f4f4f4', padding: '12px', borderRadius: '8px' }}>
            {JSON.stringify(queryInfo, null, 2)}
          </pre>
        </section>
      )}

      <section style={{ marginTop: '24px' }}>
        <h2>Results</h2>
        {loading ? (
          <p>Searching for matching agents…</p>
        ) : results.length === 0 ? (
          <p>No agent matches found yet. Enter a capability and submit the form.</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {results.map((result, index) => {
              const id = result.agent_id || result.id || 'unknown';
              const reasons = Array.isArray(result.match_reasons)
                ? result.match_reasons
                : [];

              return (
                <article
                  key={`${id}-${index}`}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '12px',
                    padding: '18px',
                    background: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0' }}>{result.name || 'Unnamed Agent'}</h3>
                      <p style={{ margin: 0, color: '#555' }}>
                        ID: <strong>{id}</strong>
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      {result.status && (
                        <span style={{ fontSize: '0.9rem', color: '#333' }}>
                          Status: {result.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {result.description && (
                    <p style={{ margin: '12px 0 0 0', color: '#444' }}>
                      {result.description}
                    </p>
                  )}

                  <dl style={{ display: 'grid', gap: '8px', marginTop: '14px' }}>
                    {result.capabilities && (
                      <div>
                        <dt style={{ fontWeight: 600 }}>Capabilities</dt>
                        <dd style={{ margin: '4px 0 0 0', color: '#333' }}>{result.capabilities}</dd>
                      </div>
                    )}
                    {result.url && (
                      <div>
                        <dt style={{ fontWeight: 600 }}>URL</dt>
                        <dd style={{ margin: '4px 0 0 0' }}>
                          <a href={String(result.url)} target="_blank" rel="noreferrer">
                            {result.url}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>

                  {reasons.length > 0 && (
                    <div style={{ marginTop: '14px', background: '#f7f7ff', padding: '12px', borderRadius: '10px' }}>
                      <strong>Match reason</strong>
                      <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                        {reasons.map((reason, reasonIndex) => (
                          <li key={`${id}-reason-${reasonIndex}`} style={{ marginBottom: '6px' }}>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default SearchPage;
