import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchPage from '../pages/SearchPage';
import { searchAgents } from '../api/agentApi';
import type { SearchResult, SearchAgentsResponse } from '../api/types';

// Mock the API
vi.mock('../api/agentApi', () => ({
  searchAgents: vi.fn(),
}));

const mockSearchAgents = vi.mocked(searchAgents);

const mockResults: SearchResult[] = [
  {
    id: '1',
    name: 'Weather Agent',
    description: 'Provides weather data',
    url: 'http://weather.com',
    capabilities: '{"canonical_capabilities": ["weather"]}',
    match_reasons: ['capability partial match weather'],
  },
  {
    id: '2',
    name: 'Weather Bot',
    description: 'Another weather agent',
    url: 'http://weatherbot.com',
    capabilities: '{"canonical_capabilities": ["weather"]}',
    match_reasons: ['name partial match weather'],
  },
];

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends correct query to backend', async () => {
    mockSearchAgents.mockResolvedValue({ query: { name: 'weather', match: 'partial' }, results: [] });

    render(<SearchPage />);

    const input = screen.getByPlaceholderText(/search agents/i);
    fireEvent.change(input, { target: { value: 'weather' } });

    await waitFor(() => {
      expect(mockSearchAgents).toHaveBeenCalledWith({
        name: 'weather',
        only_approved: false,
        match: 'partial',
      });
    }, { timeout: 1000 }); // Wait for debounce
  });

  it('handles search type change', async () => {
    mockSearchAgents.mockResolvedValue({ query: {}, results: [] });

    render(<SearchPage />);

    const select = screen.getByRole('combobox');
    const input = screen.getByPlaceholderText(/search agents/i);
    
    fireEvent.change(select, { target: { value: 'capability' } });
    fireEvent.change(input, { target: { value: 'weather' } });

    await waitFor(() => {
      expect(mockSearchAgents).toHaveBeenCalledWith({
        capability: 'weather',
        only_approved: false,
        match: 'partial',
      });
    }, { timeout: 1000 });
  });

  it('handles only approved toggle', async () => {
    mockSearchAgents.mockResolvedValue({ query: {}, results: [] });

    render(<SearchPage />);

    const checkbox = screen.getByLabelText(/only approved/i);
    const input = screen.getByPlaceholderText(/search agents/i);

    fireEvent.click(checkbox);
    fireEvent.change(input, { target: { value: 'weather' } });

    await waitFor(() => {
      expect(mockSearchAgents).toHaveBeenCalledWith({
        name: 'weather',
        only_approved: true,
        match: 'partial',
      });
    }, { timeout: 1000 });
  });

  it('renders results using AgentCard', async () => {
    mockSearchAgents.mockResolvedValue({ query: {}, results: mockResults as any });

    render(<SearchPage />);

    const input = screen.getByPlaceholderText(/search agents/i);
    fireEvent.change(input, { target: { value: 'weather' } });

    await waitFor(() => {
      expect(screen.getByText('Weather Agent')).toBeInTheDocument();
      expect(screen.getByText('Weather Bot')).toBeInTheDocument();
    });
  });

  it('handles no results', async () => {
    mockSearchAgents.mockResolvedValue({ query: {}, results: [] });

    render(<SearchPage />);

    const input = screen.getByPlaceholderText(/search agents/i);
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/no agents matched/i)).toBeInTheDocument();
    });
  });

  it('handles loading state', async () => {
    mockSearchAgents.mockImplementation(() => new Promise<SearchAgentsResponse>(() => {})); 

    render(<SearchPage />);

    const input = screen.getByPlaceholderText(/search agents/i);
    fireEvent.change(input, { target: { value: 'weather' } });

    await waitFor(() => {
      expect(screen.getByText(/searching registry/i)).toBeInTheDocument();
    });
  });
});