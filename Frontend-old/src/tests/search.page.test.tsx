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
    mockSearchAgents.mockResolvedValue({ query: { capability: 'weather', match: 'partial' }, results: [] });

    render(<SearchPage />);

    const input = screen.getByPlaceholderText('Enter a capability name or keyword');
    const button = screen.getByText('Search Capabilities');

    fireEvent.change(input, { target: { value: 'weather' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSearchAgents).toHaveBeenCalledWith({
        capability: 'weather',
        match: 'partial',
      });
    });
  });

  it('renders ranked results', async () => {
    mockSearchAgents.mockResolvedValue({ query: {}, results: mockResults });

    render(<SearchPage />);

    const input = screen.getByPlaceholderText('Enter a capability name or keyword');
    const button = screen.getByText('Search Capabilities');

    fireEvent.change(input, { target: { value: 'weather' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Weather Agent')).toBeInTheDocument();
      expect(screen.getByText('Weather Bot')).toBeInTheDocument();
    });
  });

  it('displays match reason if provided', async () => {
    mockSearchAgents.mockResolvedValue({ query: {}, results: mockResults });

    render(<SearchPage />);

    const input = screen.getByPlaceholderText('Enter a capability name or keyword');
    const button = screen.getByText('Search Capabilities');

    fireEvent.change(input, { target: { value: 'weather' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('capability partial match weather')).toBeInTheDocument();
      expect(screen.getByText('name partial match weather')).toBeInTheDocument();
    });
  });

  it('handles no results', async () => {
    mockSearchAgents.mockResolvedValue({ query: {}, results: [] });

    render(<SearchPage />);

    const input = screen.getByPlaceholderText('Enter a capability name or keyword');
    const button = screen.getByText('Search Capabilities');

    fireEvent.change(input, { target: { value: 'nonexistent' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('No agent matches found yet. Enter a capability and submit the form.')).toBeInTheDocument();
    });
  });

  it('handles loading state', async () => {
    mockSearchAgents.mockImplementation(() => new Promise<SearchAgentsResponse>(() => {})); // Never resolves

    render(<SearchPage />);

    const input = screen.getByPlaceholderText('Enter a capability name or keyword');
    const button = screen.getByText('Search Capabilities');

    fireEvent.change(input, { target: { value: 'weather' } });
    fireEvent.click(button);

    expect(screen.getByText('Searching…')).toBeInTheDocument();
  });

  // Contract compliance
  it('uses API response as-is without transformation', async () => {
    const rawResult = { ...mockResults[0] };
    mockSearchAgents.mockResolvedValue({ query: {}, results: [rawResult] });

    render(<SearchPage />);

    const input = screen.getByPlaceholderText('Enter a capability name or keyword');
    const button = screen.getByText('Search Capabilities');

    fireEvent.change(input, { target: { value: 'weather' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(rawResult.name!)).toBeInTheDocument();
      expect(screen.getByText(rawResult.match_reasons![0])).toBeInTheDocument();
    });
  });
});