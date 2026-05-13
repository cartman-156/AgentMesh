# Agent Refresh Sequence

## Refresh Agent Flow

```mermaid
sequenceDiagram
    actor Client
    participant API as agents.py<br/>POST /api/v1/agents/{id}/refresh
    participant Service as agent_service.py<br/>refresh_agent()
    participant Fetch as fetch_agent_card_from_url()
    participant Validate as validate_agent_card()
    participant Normalize as normalize_capabilities()
    participant CapMap as capabilities_map.py<br/>get_canonical()
    participant DB as database.py<br/>store_agent()
    participant SQLite as SQLite

    Client->>API: POST /api/v1/agents/{agent_id}/refresh
    
    API->>Service: refresh_agent(agent_id)
    
    Service->>DB: SELECT * FROM agents<br/>WHERE id = ?
    DB->>SQLite: Query
    SQLite-->>DB: Agent row
    
    alt Agent not found
        DB-->>Service: NULL
        Service-->>API: ValueError
        API-->>Client: 400 Bad Request<br/>"Agent not found"
    else Agent found
        DB-->>Service: Agent data
    end
    
    Service->>Service: url = agent.url
    
    alt No URL stored
        Service-->>API: ValueError
        API-->>Client: 400 Bad Request<br/>"No URL for refresh"
    else URL exists
        Note over Service: Proceed with refresh
    end
    
    Service->>Fetch: fetch_agent_card_from_url(url)
    Fetch->>Fetch: GET {url}/.well-known/agent.json
    Fetch-->>Service: updated_agent_card
    
    Service->>Validate: validate_agent_card(updated_agent_card)
    
    alt Validation fails
        Validate-->>Service: ValueError
        Service-->>API: ValueError
        API-->>Client: 400 Bad Request
    else Validation passes
        Validate-->>Service: True
    end
    
    Service->>Service: Extract capabilities from<br/>updated card
    Service->>Normalize: normalize_capabilities(raw_caps)
    
    loop For each capability
        Normalize->>CapMap: get_canonical(normalized_term)
        CapMap-->>Normalize: canonical_category
    end
    
    Normalize-->>Service: {raw, normalized, canonical}
    
    Service->>Service: Prepare update data<br/>- preserve agent_id<br/>- preserve current status<br/>- preserve latency/last_seen<br/>- update name, description,<br/>version, capabilities,<br/>raw_agent_card
    
    Service->>DB: store_agent(agent_data)<br/>(UPDATE existing)
    DB->>SQLite: UPDATE agents
    SQLite-->>DB: OK
    
    Service-->>API: {status: "refreshed",<br/>source_refetched: true}
    API-->>Client: 200 OK
```

## Key Preservation Rules

- **agent_id**: Preserved (deterministic, immutable)
- **status**: Preserved (current health status)
- **latency_ms**: Preserved (from last health check)
- **last_seen**: Preserved (timestamp of last health check)
- **url**: Preserved (original registration URL)
- **updated fields**:
  - name
  - description
  - version
  - capabilities (re-normalized)
  - raw_agent_card (latest version)
