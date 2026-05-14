import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { searchAgents } from '../api/agentApi';
import type { SearchResult } from '../api/types';
import '../styles/SearchPage.css';

const SearchPage = () => {
  const [capability, setCapability] = useState('');
  const [matchMode, setMatchMode] = useState<'partial' | 'exact'>('partial');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [queryInfo, setQueryInfo] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await searchAgents({
        capability: capability.trim() || undefined,
        match: matchMode,
      });

      setResults(response.results ?? []);
      setQueryInfo(response.query ?? {});
    } catch (fetchError) {
      toast.error(
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
    <main className="page-shell">
      <header className="search-page__header">
        <h1 className="search-page__title">Capability Search</h1>
        <p className="search-page__copy">Search registered agents by capability and review ranked match results.</p>
      </header>

      <form onSubmit={handleSearch} className="search-page__form">
        <label className="search-page__field">
          <span className="search-page__label">Capability</span>
          <input
            value={capability}
            onChange={(event) => setCapability(event.target.value)}
            placeholder="Enter a capability name or keyword"
            className="search-page__input"
          />
        </label>

        <fieldset className="search-page__fieldset">
          <legend className="search-page__legend">Match mode</legend>
          <div className="search-page__radio-group">
            <label className="search-page__radio-label">
              <input
                type="radio"
                name="matchMode"
                value="partial"
                checked={matchMode === 'partial'}
                onChange={() => setMatchMode('partial')}
              />
              Partial
            </label>
            <label className="search-page__radio-label">
              <input
                type="radio"
                name="matchMode"
                value="exact"
                checked={matchMode === 'exact'}
                onChange={() => setMatchMode('exact')}
              />
              Exact
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading || capability.trim() === ''}
          className="search-page__button"
        >
          {loading ? 'Searching…' : 'Search Capabilities'}
        </button>
      </form>

      {Object.keys(queryInfo).length > 0 && (
        <section className="search-page__section">
          <h2 className="search-page__section-title">Search query</h2>
          <pre className="search-page__query-pre">
            {JSON.stringify(queryInfo, null, 2)}
          </pre>
        </section>
      )}

      <section className="search-page__section">
        <h2 className="search-page__section-title">Results</h2>
        {loading ? (
          <p>Searching for matching agents…</p>
        ) : results.length === 0 ? (
          <p>No agent matches found yet. Enter a capability and submit the form.</p>
        ) : (
          <div className="search-page__results">
            {results.map((result, index) => {
              const id = result.agent_id || result.id || 'unknown';
              const reasons = Array.isArray(result.match_reasons)
                ? result.match_reasons
                : [];

              return (
                <article
                  key={`${id}-${index}`}
                  className="search-page__result-card"
                >
                  <div className="search-page__result-header">
                    <div>
                      <h3 className="search-page__result-title">{result.name || 'Unnamed Agent'}</h3>
                      <p className="search-page__result-id">
                        ID: <strong>{id}</strong>
                      </p>
                    </div>
                    {result.status && (
                      <div className="search-page__result-status">
                        Status: {result.status}
                      </div>
                    )}
                  </div>

                  {result.description && (
                    <p className="search-page__result-description">
                      {result.description}
                    </p>
                  )}

                  <dl className="search-page__result-meta">
                    {result.capabilities && (
                      <div className="search-page__result-meta-item">
                        <dt>Capabilities</dt>
                        <dd>{result.capabilities}</dd>
                      </div>
                    )}
                    {result.url && (
                      <div className="search-page__result-meta-item">
                        <dt>URL</dt>
                        <dd>
                          <a href={String(result.url)} target="_blank" rel="noreferrer">
                            {result.url}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>

                  {reasons.length > 0 && (
                    <div className="search-page__match-reason">
                      <p className="search-page__match-reason-title">Match reason</p>
                      <ul className="search-page__match-reason-list">
                        {reasons.map((reason, reasonIndex) => (
                          <li key={`${id}-reason-${reasonIndex}`}>
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
