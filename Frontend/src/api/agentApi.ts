import apiClient from './apiClient';
import type {
  AgentModel,
  ApprovalActionRequest,
  ApproveAgentResponse,
  DebugAgentResponse,
  DebugHealthResponse,
  DebugSearchResponse,
  DebugStateResponse,
  GetAgentResponse,
  ListAgentsResponse,
  RegisterAgentRequest,
  RegisterAgentResponse,
  RefreshAgentResponse,
  SearchAgentsQuery,
  SearchAgentsResponse,
  SystemHealthResponse,
  AgentHealthResponse,
  DeregisterAgentResponse,
} from './types';

const AGENTS_PATH = '/agents';
const SYSTEM_HEALTH_PATH = '/health';
const DEBUG_PATH = '/debug/';

const buildQueryString = (params: Record<string, string | undefined> = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const registerAgent = async (
  payload: RegisterAgentRequest
): Promise<RegisterAgentResponse> => {
  const response = await apiClient.post<RegisterAgentResponse>(AGENTS_PATH, payload);
  return response.data;
};

export const listAgents = async (
  params?: { status?: string; capability?: string }
): Promise<ListAgentsResponse> => {
  const query = buildQueryString({
    status: params?.status,
    capability: params?.capability,
  });

  const response = await apiClient.get<ListAgentsResponse>(`${AGENTS_PATH}${query}`);
  return response.data;
};

export const getAgent = async (agentId: string): Promise<GetAgentResponse> => {
  const response = await apiClient.get<GetAgentResponse>(`${AGENTS_PATH}/${encodeURIComponent(agentId)}`);
  return response.data;
};

export const approveAgent = async (
  agentId: string,
  payload: ApprovalActionRequest = { action: 'approve' }
): Promise<ApproveAgentResponse> => {
  const response = await apiClient.post<ApproveAgentResponse>(
    `${AGENTS_PATH}/${encodeURIComponent(agentId)}/approve`,
    payload
  );
  return response.data;
};

export const deregisterAgent = async (agentId: string): Promise<DeregisterAgentResponse> => {
  const response = await apiClient.delete<DeregisterAgentResponse>(
    `${AGENTS_PATH}/${encodeURIComponent(agentId)}`
  );
  return response.data;
};

export const refreshAgent = async (agentId: string): Promise<RefreshAgentResponse> => {
  const response = await apiClient.post<RefreshAgentResponse>(
    `${AGENTS_PATH}/${encodeURIComponent(agentId)}/refresh`
  );
  return response.data;
};

export const searchAgents = async (
  params?: SearchAgentsQuery
): Promise<SearchAgentsResponse> => {
  const queryString = buildQueryString({
    agent_id: params?.agent_id,
    name: params?.name,
    capability: params?.capability,
    match: params?.match,
  });

  const response = await apiClient.get<SearchAgentsResponse>(
    `${AGENTS_PATH}/search${queryString}`
  );
  return response.data;
};

export const getSystemHealth = async (): Promise<SystemHealthResponse> => {
  const response = await apiClient.get<SystemHealthResponse>(SYSTEM_HEALTH_PATH);
  return response.data;
};

export const getAgentHealth = async (agentId: string): Promise<AgentHealthResponse> => {
  const response = await apiClient.get<AgentHealthResponse>(
    `${AGENTS_PATH}/${encodeURIComponent(agentId)}/health`
  );
  return response.data;
};

export const getDebugAgent = async (agentId: string): Promise<DebugAgentResponse> => {
  const response = await apiClient.get<DebugAgentResponse>(
    `${DEBUG_PATH}agents/${encodeURIComponent(agentId)}`
  );
  return response.data;
};

export const searchDebug = async (
  params?: SearchAgentsQuery
): Promise<DebugSearchResponse> => {
  const queryString = buildQueryString({
    agent_id: params?.agent_id,
    name: params?.name,
    capability: params?.capability,
    match: params?.match,
  });

  const response = await apiClient.get<DebugSearchResponse>(
    `${DEBUG_PATH}search${queryString}`
  );
  return response.data;
};

export const getDebugState = async (): Promise<DebugStateResponse> => {
  const response = await apiClient.get<DebugStateResponse>(`${DEBUG_PATH}state`);
  return response.data;
};

export const getDebugAgentHealth = async (agentId: string): Promise<DebugHealthResponse> => {
  const response = await apiClient.get<DebugHealthResponse>(
    `${DEBUG_PATH}health/${encodeURIComponent(agentId)}`
  );
  return response.data;
};

export default {
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
};
