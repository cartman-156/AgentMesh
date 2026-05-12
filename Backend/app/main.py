from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI

from app.db.database import init_db
from app.api.routes import agents, agents_search, health
from app.debug import routes as debug_routes
from app.workers.health_check_worker import health_check_worker

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle hook for FastAPI application.
    Handles database initialization and worker bootstrap.
    """
    # Startup hooks
    init_db()
    
    # Start health check worker in background
    worker_task = asyncio.create_task(health_check_worker())
    
    yield
    
    # Shutdown hooks
    worker_task.cancel()

app = FastAPI(
    title="AgentMesh",
    description="AI Agent Registry (Google A2A compatible)",
    version="1.0.0",
    lifespan=lifespan,
)

# Register routers per API_Contract.md
app.include_router(agents_search.router, prefix="/api/v1/agents", tags=["search"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["agents"])
app.include_router(health.router, prefix="/api/v1", tags=["health"])

# Register debug routes (read-only observability layer)
app.include_router(debug_routes.router, prefix="/api/v1/debug", tags=["debug"])
