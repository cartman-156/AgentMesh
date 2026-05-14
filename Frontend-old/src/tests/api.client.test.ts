import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../api/apiClient';
import {
  registerAgent,
  listAgents,
  getAgent,
  approveAgent,
  deregisterAgent,
  refreshAgent,
  searchAgents,
  getSystemHealth,
  getAgentHealth,
  getDebugAgent,
  searchDebug,
  getDebugState,
  getDebugAgentHealth,
} from '../api/agentApi';
import type {
  RegisterAgentRequest,
  RegisterAgentResponse,
  ListAgentsResponse,
  GetAgentResponse,
  ApproveAgentResponse,
  DeregisterAgentResponse,
  RefreshAgentResponse,
  SearchAgentsResponse,
  SystemHealthResponse,
  AgentHealthResponse,
  DebugAgentResponse,
  DebugSearchResponse,
  DebugStateResponse,
  DebugHealthResponse,
} from '../api/types';

// Mock the apiClient
vi.mock('../api/apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

describe('API Client Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerAgent', () => {
    it('calls POST /agents with correct payload', async () => {
      const payload: RegisterAgentRequest = { agent_card: { name: 'test' } };
      const response: RegisterAgentResponse = { id: '123', status: 'registered', normalized: true };
      mockApiClient.post.mockResolvedValue({ data: response, status: 200 });

      const result = await registerAgent(payload);

      expect(mockApiClient.post).toHaveBeenCalledWith('/agents', payload);
      expect(result).toEqual(response);
    });
  });

  describe('listAgents', () => {
    it('calls GET /agents with query params', async () => {
      const params = { status: 'approved', capability: 'weather' };
      const response: ListAgentsResponse = { agents: [], total: 0 };
      mockApiClient.get.mockResolvedValue({ data: response, status: 200 });

      const result = await listAgents(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/agents?status=approved&capability=weather');
      expect(result).toEqual(response);
    });
  });

  describe('getAgent', () => {
    it('calls GET /agents/{id}', async () => {
      const agentId = '123';
      const response: GetAgentResponse = { agent: { id: '123', name: 'test', description: '', url: '', version: '', capabilities: '{}', raw_agent_card: '{}', status: 'healthy', latency_ms: null, last_seen: null, approved: 1, deregistered: 0 } };
      mockApiClient.get.mockResolvedValue({ data: response, status: 200 });

      const result = await getAgent(agentId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/agents/123');
      expect(result).toEqual(response);
    });
  });

  describe('approveAgent', () => {
    it('calls POST /agents/{id}/approve', async () => {
      const agentId = '123';
      const payload = { action: 'approve' as const };
      const response: ApproveAgentResponse = { id: '123', status: 'approved' };
      mockApiClient.post.mockResolvedValue({ data: response, status: 200 });

      const result = await approveAgent(agentId, payload);

      expect(mockApiClient.post).toHaveBeenCalledWith('/agents/123/approve', payload);
      expect(result).toEqual(response);
    });
  });

  describe('deregisterAgent', () => {
    it('calls DELETE /agents/{id}', async () => {
      const agentId = '123';
      const response: DeregisterAgentResponse = { id: '123', status: 'deregistered' };
      mockApiClient.delete.mockResolvedValue({ data: response, status: 200 });

      const result = await deregisterAgent(agentId);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/agents/123');
      expect(result).toEqual(response);
    });
  });

  describe('refreshAgent', () => {
    it('calls POST /agents/{id}/refresh', async () => {
      const agentId = '123';
      const response: RefreshAgentResponse = { status: 'refreshed', source_refetched: true };
      mockApiClient.post.mockResolvedValue({ data: response, status: 200 });

      const result = await refreshAgent(agentId);

      expect(mockApiClient.post).toHaveBeenCalledWith('/agents/123/refresh');
      expect(result).toEqual(response);
    });
  });

  describe('searchAgents', () => {
    it('calls GET /agents/search with query', async () => {
      const params = { capability: 'weather', match: 'partial' as const };
      const response: SearchAgentsResponse = { query: {}, results: [] };
      mockApiClient.get.mockResolvedValue({ data: response, status: 200 });

      const result = await searchAgents(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/agents/search?capability=weather&match=partial');
      expect(result).toEqual(response);
    });
  });

  describe('getSystemHealth', () => {
    it('calls GET /health', async () => {
      const response: SystemHealthResponse = { agents_total: 10, healthy: 8, unhealthy: 2, avg_latency_ms: 100 };
      mockApiClient.get.mockResolvedValue({ data: response, status: 200 });

      const result = await getSystemHealth();

      expect(mockApiClient.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(response);
    });
  });

  describe('getAgentHealth', () => {
    it('calls GET /agents/{id}/health', async () => {
      const agentId = '123';
      const response: AgentHealthResponse = { status: 'healthy', latency_ms: 50, last_checked: '2023-01-01' };
      mockApiClient.get.mockResolvedValue({ data: response, status: 200 });

      const result = await getAgentHealth(agentId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/agents/123/health');
      expect(result).toEqual(response);
    });
  });

  describe('getDebugAgent', () => {
    it('calls GET /debug/agents/{id}', async () => {
      const agentId = '123';
      const response: DebugAgentResponse = {};
      mockApiClient.get.mockResolvedValue({ data: response, status: 200 });

      const result = await getDebugAgent(agentId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/debug/agents/123');
      expect(result).toEqual(response);
    });
  });

  describe('searchDebug', () => {
    it('calls GET /debug/search with query', async () => {
      const params = { name: 'test' };
      const response: DebugSearchResponse = {};
      mockApiClient.get.mockResolvedValue({ data: response, status: 200 });

      const result = await searchDebug(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/debug/search?name=test');
      expect(result).toEqual(response);
    });
  });

  describe('getDebugState', () => {
    it('calls GET /debug/state', async () => {
      const response: DebugStateResponse = {};
      mockApiClient.get.mockResolvedValue({ data: response, status: 200 });

      const result = await getDebugState();

      expect(mockApiClient.get).toHaveBeenCalledWith('/debug/state');
      expect(result).toEqual(response);
    });
  });

  describe('getDebugAgentHealth', () => {
    it('calls GET /debug/health/{id}', async () => {
      const agentId = '123';
      const response: DebugHealthResponse = {};
      mockApiClient.get.mockResolvedValue({ data: response, status: 200 });

      const result = await getDebugAgentHealth(agentId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/debug/health/123');
      expect(result).toEqual(response);
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    it('handles 4xx errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('404 Not Found'));

      await expect(getSystemHealth()).rejects.toThrow('404 Not Found');
    });

    it('handles 5xx errors', async () => {
      mockApiClient.post.mockRejectedValue(new Error('500 Internal Server Error'));

      const payload: RegisterAgentRequest = { url: 'http://example.com' };
      await expect(registerAgent(payload)).rejects.toThrow('500 Internal Server Error');
    });
  });
});