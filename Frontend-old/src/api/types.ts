export type AgentLifecycleStatus =
  | 'registered'
  | 'approved'
  | 'deregistered'
  | 'healthy'
  | 'unhealthy'
  | string;

export interface AgentModel {
  id: string;
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: string;
  raw_agent_card: string;
  status: string;
  latency_ms: number | null;
  last_seen: string | null;
  approved: number;
  deregistered: number;
  domain?: string;
  company?: string;
}

export interface RegisterAgentRequest {
  agent_card?: Record<string, unknown>;
  url?: string;
}

export interface RegisterAgentResponse {
  id: string;
  status: 'registered';
  normalized: true;
}

export interface ListAgentsResponse {
  agents: AgentModel[];
  total: number;
}

export interface GetAgentResponse {
  agent: AgentModel;
}

export interface ApprovalActionRequest {
  action?: 'approve' | 'reject';
}

export interface ApproveAgentResponse {
  id: string;
  status: 'approved' | 'rejected';
}

export interface DeregisterAgentResponse {
  id: string;
  status: 'deregistered';
}

export interface RefreshAgentResponse {
  status: string;
  source_refetched: boolean;
}

export interface SearchAgentsQuery {
  agent_id?: string;
  name?: string;
  capability?: string;
  match?: 'exact' | 'partial';
}

export interface SearchResult {
  agent_id?: string;
  id?: string;
  name?: string;
  description?: string;
  url?: string;
  version?: string;
  capabilities?: string;
  status?: string;
  match_reasons?: string[];
  [key: string]: unknown;
}

export interface SearchAgentsResponse {
  query: Record<string, unknown>;
  results: SearchResult[];
}

export interface SystemHealthResponse {
  agents_total: number;
  healthy: number;
  unhealthy: number;
  avg_latency_ms: number | null;
}

export interface AgentHealthResponse {
  status: string;
  latency_ms: number | null;
  last_checked: string | null;
}

export interface DebugAgentResponse {
  [key: string]: unknown;
}

export interface DebugSearchResponse {
  [key: string]: unknown;
}

export interface DebugStateResponse {
  [key: string]: unknown;
}

export interface DebugHealthResponse {
  [key: string]: unknown;
}
