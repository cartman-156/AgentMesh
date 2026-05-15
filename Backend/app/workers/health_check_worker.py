import asyncio
import json
import time
from app.db import database
from app.services.health_service import check_agent_health, update_agent_health_status


async def health_check_worker():
    """
    Background worker that runs health checks on all agents every 60 seconds.
    Executes inside the FastAPI process using asyncio.
    """
    while True:
        try:
            # Get all agents from database
            rows = database.get_all_agents_raw()
            
            # Check health for each agent
            for row in rows:
                agent_id = row.get("id")
                json_data_str = row.get("json_data")
                
                # Extract URL from json_data in application layer
                agent_url = None
                if json_data_str:
                    try:
                        agent_data = json.loads(json_data_str)
                        agent_url = agent_data.get("url")
                    except json.JSONDecodeError:
                        pass
                
                if not agent_url:
                    continue
                
                try:
                    # Check agent health
                    health_result = check_agent_health(agent_id, agent_url)
                    
                    # Update database
                    update_agent_health_status(
                        agent_id=agent_id,
                        status=health_result["status"],
                        latency_ms=health_result["latency_ms"],
                        last_checked=health_result["last_checked"]
                    )
                except Exception:
                    # Log and continue with next agent
                    pass
            
            # Wait 60 seconds before next check
            await asyncio.sleep(60)
        except Exception:
            # Catch any unexpected errors and continue
            await asyncio.sleep(60)
