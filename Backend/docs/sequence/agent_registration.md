# Agent Registration Sequence

## Flow

```mermaid
sequenceDiagram
    actor Client
    participant API as agents.py<br/>POST /api/v1/agents
    participant Service as agent_service.py<br/>register_agent()
    participant Fetch as fetch_agent_card_from_url()
    participant Validate as validate_agent_card()
    participant Normalize as normalize_capabilities()
    participant CapMap as capabilities_map.py<br/>get_canonical()
    participant DB as database.py<br/>store_agent()
    participant SQLite as SQLite

    Client->>API: POST /api/v1/agents<br/>{agent_card | url}
    
    API->>Service: register_agent(agent_card, url)
    
    alt URL provided
        Service->>Fetch: fetch_agent_card_from_url(url)
        Fetch->>Fetch: GET {url}/.well-known/agent.json
        Fetch-->>Service: agent_card (JSON)
    else agent_card provided
        Note over Service: Use provided agent_card
    end
    
    Service->>Validate: validate_agent_card(agent_card)
    alt Invalid
        Validate-->>Service: ValueError
        Service-->>API: ValueError
        API-->>Client: 400 Bad Request
    else Valid
        Validate-->>Service: True
    end
    
    Service->>Service: generate_agent_id(agent_card)<br/>from name or hash
    Service->>Service: Extract capabilities array
    
    Service->>Normalize: normalize_capabilities(raw_capabilities)
    
    loop For each capability
        Normalize->>CapMap: get_canonical(normalized_term)
        CapMap-->>Normalize: canonical_category
    end
    
    Normalize-->>Service: {raw, normalized, canonical}
    
    Service->>Service: Prepare agent_data<br/>with JSON serialization
    
    Service->>DB: store_agent(agent_data)
    DB->>SQLite: INSERT/UPDATE agents
    SQLite-->>DB: OK
    
    Service-->>API: {id, status, normalized}
    API-->>Client: 200 OK
