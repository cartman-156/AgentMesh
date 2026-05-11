# Health Check Sequence

## Background Worker (Every 60 seconds)

```mermaid
sequenceDiagram
    participant Worker as health_check_worker.py<br/>Async Loop
    participant DB as database.py<br/>get_db_connection()
    participant SQLite as SQLite
    participant Service as health_service.py<br/>check_agent_health()
    participant Network as HTTP GET
    participant AgentEndpoint as Agent<br/>/.well-known/health

    Worker->>Worker: await asyncio.sleep(60)
    
    Worker->>DB: SELECT id, url FROM agents
    DB->>SQLite: Query
    SQLite-->>DB: All agents
    
    loop For each agent
        Worker->>Service: check_agent_health(agent_id,<br/>agent_url)
        
        Service->>Service: start_time = time.time()
        
        Service->>Network: GET {url}/.well-known/health<br/>timeout=5s
        
        alt Request successful
            Network->>AgentEndpoint: HTTP GET
            AgentEndpoint-->>Network: 200 OK
            Network-->>Service: response
            Service->>Service: latency_ms = elapsed
            Service->>Service: status = "healthy"
        else Request timeout
            Network-->>Service: Timeout
            Service->>Service: latency_ms = elapsed
            Service->>Service: status = "unhealthy"
        else Request error
            Network-->>Service: Exception
            Service->>Service: latency_ms = elapsed
            Service->>Service: status = "unhealthy"
        end
        
        Service->>Service: last_checked = now()
        Service-->>Worker: {status, latency_ms,<br/>last_checked}
        
        Worker->>DB: UPDATE agents<br/>SET status, latency_ms,<br/>last_seen WHERE id
        DB->>SQLite: Update
        SQLite-->>DB: OK
    end
    
    Worker->>Worker: Repeat in 60 seconds
```

## On-Demand Health Check (Client Request)

```mermaid
sequenceDiagram
    actor Client
    participant API as health.py<br/>GET /api/v1/agents/{id}/health
    participant Service as health_service.py<br/>get_agent_health()
    participant DB as database.py<br/>get_db_connection()
    participant SQLite as SQLite

    Client->>API: GET /api/v1/agents/{agent_id}/health
    
    API->>Service: get_agent_health(agent_id)
    
    Service->>DB: SELECT status, latency_ms,<br/>last_seen FROM agents<br/>WHERE id = ?
    DB->>SQLite: Query
    
    alt Agent found
        SQLite-->>DB: Row
        DB-->>Service: {status, latency_ms, last_seen}
        Service-->>API: {status, latency_ms,<br/>last_checked}
    else Agent not found
        SQLite-->>DB: NULL
        DB-->>Service: None
        Service-->>API: None
        API-->>Client: 404 Not Found
    end
    
    alt Agent found
        API-->>Client: 200 OK<br/>{status, latency_ms,<br/>last_checked}
    end
```

## System Health (Aggregated)

```mermaid
sequenceDiagram
    actor Client
    participant API as health.py<br/>GET /api/v1/health
    participant Service as health_service.py<br/>get_system_health()
    participant DB as database.py<br/>get_db_connection()
    participant SQLite as SQLite

    Client->>API: GET /api/v1/health
    
    API->>Service: get_system_health()
    
    Service->>DB: SELECT status, latency_ms<br/>FROM agents
    DB->>SQLite: Query
    SQLite-->>DB: All agents
    
    Service->>Service: Count by status
    Service->>Service: Calculate average latency
    
    Service-->>API: {agents_total,<br/>healthy, unhealthy,<br/>avg_latency_ms}
    API-->>Client: 200 OK
