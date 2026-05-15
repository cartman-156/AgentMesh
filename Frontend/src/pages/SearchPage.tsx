import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { searchAgents, approveAgent, deregisterAgent } from '../api/agentApi';
import type { AgentModel } from '../api/types';
import AgentCard from '../components/AgentCard';
import AgentDetailModal from '../components/AgentDetailModal';
import '../styles/SearchPage.css';

type SearchType = 'name' | 'description' | 'capability' | 'skills';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('name');
  const [onlyApproved, setOnlyApproved] = useState(false);
  const [results, setResults] = useState<AgentModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Dynamic search with debouncing
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const params: any = {
          only_approved: onlyApproved,
          match: 'partial',
        };
        
        if (query.trim()) {
          params[searchType] = query.trim();
        }

        const response = await searchAgents(params);
        setResults(response.results as unknown as AgentModel[] ?? []);
      } catch (fetchError) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, searchType, onlyApproved]);

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      await approveAgent(id);
      toast.success('Agent approved successfully');
      setResults(prev => prev.map(a => a.id === id ? { ...a, approved: 1 } : a));
    } catch {
      toast.error('Failed to approve agent');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    // In search, reject might just mean delete or skip
    // For now, let's treat it as a placeholder or implement delete if appropriate
    toast.error('Reject action not implemented for search results');
  };

  const handleDeregister = async (id: string) => {
    setActionLoadingId(id);
    try {
      await deregisterAgent(id);
      toast.success('Agent deregistered successfully');
      setResults(prev => prev.map(a => a.id === id ? { ...a, deregistered: 1 } : a));
    } catch {
      toast.error('Failed to deregister agent');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <main className="page-shell">
      <header className="search-page__header">
        <h1 className="search-page__title">Agent Discovery</h1>
        <p className="search-page__copy">Search across the registry. Results update as you type.</p>
      </header>

      <div className="search-page__bar-container">
        <div className="search-page__bar">
          <div className="search-page__input-group">
            <svg className="search-page__search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents..."
              className="search-page__input"
            />
          </div>
          
          <div className="search-page__filters">
            <select 
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as SearchType)}
              className="search-page__select"
            >
              <option value="name">Name</option>
              <option value="description">Description</option>
              <option value="capability">Capability</option>
              <option value="skills">Skills</option>
            </select>

            <div className="search-page__divider" />

            <label className="search-page__checkbox-label">
              <input
                type="checkbox"
                checked={onlyApproved}
                onChange={(e) => setOnlyApproved(e.target.checked)}
              />
              <span>Only Approved</span>
            </label>
          </div>
        </div>
      </div>

      <section className="search-page__results-section">
        {loading ? (
          <div className="search-page__status">Searching registry...</div>
        ) : results.length === 0 ? (
          <div className="search-page__status">
            {query.trim() ? (
              'No agents matched your current search filters.'
            ) : onlyApproved ? (
              'No approved agents were found in the registry.'
            ) : (
              'The AgentMesh registry is currently empty. No agents have been registered yet.'
            )}
          </div>
        ) : (
          <div className="search-page__grid">
            {results.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isActionLoading={actionLoadingId === agent.id}
                onView={setSelectedAgentId}
                onApprove={handleApprove}
                onReject={handleReject}
                onDeregister={handleDeregister}
                showActions={false}
              />
            ))}
          </div>
        )}
      </section>

      {selectedAgentId && (
        <AgentDetailModal
          agentId={selectedAgentId}
          isOpen={!!selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
        />
      )}
    </main>
  );
};

export default SearchPage;
