# Agent Search Sequence

## Flow

```mermaid
sequenceDiagram
    actor Client
    participant API as agents_search.py<br/>GET /api/v1/agents/search
    participant Service as agents_search_service.py<br/>search_agents()
    participant DB as database.py<br/>get_db_connection()
    participant SQLite as SQLite
    participant CapMap as capabilities_map.py<br/>get_canonical()

    Client->>API: GET /api/v1/agents/search<br/>?agent_id=X&name=Y<br/>&capability=Z&match=M
    
    API->>Service: search_agents(agent_id,<br/>name, capability, match)
    
    Service->>DB: SELECT * FROM agents
    DB->>SQLite: Query
    SQLite-->>DB: All agents
    
    Service->>Service: agents = [...]<br/>(full list)
    
    alt agent_id filter
        Service->>Service: Filter: id == agent_id<br/>(exact match only)
    end
    
    alt name filter
        alt match = "exact"
            Service->>Service: Filter: name.lower()<br/>== name.lower()
        else match = "partial" or null
            Service->>Service: Filter: name.lower()<br/>in agent.name.lower()
        end
    end
    
    alt capability filter
        Service->>Service: Parse JSON capabilities<br/>for each agent
        Service->>CapMap: get_canonical(capability)
        CapMap-->>Service: canonical_category
        
        alt match = "exact"
            Service->>Service: Filter: canonical<br/>in canonical_capabilities
        else match = "partial" or null
            Service->>Service: Filter: canonical<br/>substring match
        end
    end
    
    Service-->>API: {query, results: [...]}
    API-->>Client: 200 OK
