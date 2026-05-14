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

    const input = screen.getByPlaceholderText('Search by name...');
    const button = screen.getByText('Search');

    fireEvent.change(input, { target: { value: 'weather' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSearchAgents).toHaveBeenCalledWith({
        name: 'weather',
        only_approved: false,
        match: 'partial',
      });
    });
  });

  it('handles search type change', async () => {
    mockSearchAgents.mockResolvedValue({ query: {}, results: [] });

    render(<SearchPage />);

    const select = screen.getByRole('combobox');
    const input = screen.getByPlaceholderText('Search by name...');
    
    fireEvent.change(select, { target: { value: 'capability' } });
    
    // Placeholder should change
    expect(screen.getByPlaceholderText('Search by capability...')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'weather' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(mockSearchAgents).toHaveBeenCalledWith({
        capability: 'weather',
        only_approved: false,
        match: 'partial',
      });
    });
  });

  it('handles only approved toggle', async () => {
    mockSearchAgents.mockResolvedValue({ query: {}, results: [] });

    render(<SearchPage />);

    const checkbox = screen.getByLabelText('Only Approved');
    const input = screen.getByPlaceholderText('Search by name...');

    fireEvent.click(checkbox);
    fireEvent.change(input, { target: { value: 'weather' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(mockSearchAgents).toHaveBeenCalledWith({
        name: 'weather',
        only_approved: true,
        match: 'partial',
      });
    });
  });

  it('renders results using AgentCard', async () => {
    mockSearchAgents.mockResolvedValue({ query: {}, results: mockResults });

    render(<SearchPage />);

    const input = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(input, { target: { value: 'weather' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Weather Agent')).toBeInTheDocument();
      expect(screen.getByText('Weather Bot')).toBeInTheDocument();
    });
  });

  it('handles no results', async () => {
    mockSearchAgents.mockResolvedValue({ query: {}, results: [] });

    render(<SearchPage />);

    const input = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(input, { target: { value: 'nonexistent' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('No agents matched your criteria.')).toBeInTheDocument();
    });
  });

  it('handles loading state', async () => {
    mockSearchAgents.mockImplementation(() => new Promise<SearchAgentsResponse>(() => {})); 

    render(<SearchPage />);

    const input = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(input, { target: { value: 'weather' } });
    fireEvent.click(screen.getByText('Search'));

    expect(screen.getByText('Searching registry...')).toBeInTheDocument();
  });
});