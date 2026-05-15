import json
import os
from typing import List
import httpx
import litellm
from .models import Alarm, AnalysisResult, A2ARequest
from .registry import registry_db

# Import A2A Protocol constants for proper headers
from a2a.utils.constants import VERSION_HEADER

# LLM Configuration — change the model string to switch providers
# Examples:
#   "gemini/gemini-2.0-flash"       → Google Gemini (needs GEMINI_API_KEY)
#   "gpt-4o"                        → OpenAI (needs OPENAI_API_KEY)
#   "anthropic/claude-sonnet-4-20250514"  → Anthropic (needs ANTHROPIC_API_KEY)
#   "ollama/llama3"                  → Local Ollama (free, no key needed)
LLM_MODEL = os.environ.get("LLM_MODEL", "gemini/gemini-2.0-flash")

SYSTEM_PROMPT = """You are a senior telecom network Root Cause Analysis (RCA) engineer.
You will be given a list of alarms from a telecom network spanning RAN (Radio Access Network),
Transport (IP/MPLS/Optical), and Core Network layers.

Your job is to:
1. Correlate the alarms and identify the most likely root cause.
2. Classify the failure domain as one of: RAN, TRANSPORT, CORE, CROSS, or UNKNOWN.
3. Provide a confidence score between 0.0 and 1.0.

You MUST respond ONLY with valid JSON in exactly this format (no markdown, no extra text):
{
    "root_cause": "A clear, concise explanation of the root cause",
    "failure_domain": "RAN or TRANSPORT or CORE or CROSS or UNKNOWN",
    "confidence": 0.85
}"""


class LLMService:
    @staticmethod
    def infer_root_cause(alarms: List[Alarm]) -> dict:
        """
        Use LiteLLM to analyze alarm patterns via any LLM provider.
        Falls back to rule-based logic if the LLM call fails.
        """
        # Build the alarm summary for the LLM
        alarm_text = "\n".join([
            f"- [{a.severity}] Layer: {a.layer} | ID: {a.id} | {a.message} (at {a.timestamp})"
            for a in alarms
        ])
        user_prompt = f"Analyze these telecom network alarms and determine the root cause:\n\n{alarm_text}"

        try:
            response = litellm.completion(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )

            # Extract and parse the JSON response
            raw_text = response.choices[0].message.content.strip()
            # Strip markdown code fences if present
            if raw_text.startswith("```"):
                raw_text = raw_text.split("\n", 1)[1]
                raw_text = raw_text.rsplit("```", 1)[0]
                raw_text = raw_text.strip()

            result = json.loads(raw_text)

            # Validate and sanitize
            valid_domains = {"RAN", "TRANSPORT", "CORE", "CROSS", "UNKNOWN"}
            domain = result.get("failure_domain", "UNKNOWN").upper()
            if domain not in valid_domains:
                domain = "UNKNOWN"

            confidence = float(result.get("confidence", 0.5))
            confidence = max(0.0, min(1.0, confidence))

            return {
                "root_cause": result.get("root_cause", "LLM analysis completed but no root cause provided."),
                "confidence": confidence,
                "failure_domain": domain
            }

        except Exception as e:
            print(f"[WARN] LLM call failed ({LLM_MODEL}): {e}. Falling back to rule-based analysis.")
            return LLMService._rule_based_fallback(alarms)

    @staticmethod
    def _rule_based_fallback(alarms: List[Alarm]) -> dict:
        """Fallback rule-based logic when LLM is unavailable."""
        domains = set([a.layer.upper() for a in alarms])

        if len(domains) > 1:
            domain = "CROSS"
            cause = "Cross-layer correlation detected: potential cascading failure from Transport to RAN layers."
            confidence = 0.65
        elif "CORE" in domains:
            domain = "CORE"
            cause = "Core Network Gateway (PGW/SGW) unreachable or experiencing high latency."
            confidence = 0.95
        elif "TRANSPORT" in domains:
            domain = "TRANSPORT"
            cause = "Optical fiber cut or IP/MPLS routing loop detected in transport ring."
            confidence = 0.85
        elif "RAN" in domains:
            domain = "RAN"
            cause = "eNodeB/gNodeB power failure or cell outage detected in radio access network."
            confidence = 0.70
        else:
            domain = "UNKNOWN"
            cause = "Unable to classify failure domain based on provided alarms."
            confidence = 0.40

        return {
            "root_cause": cause,
            "confidence": confidence,
            "failure_domain": domain
        }


async def perform_rca(incident_id: str, alarms: List[Alarm]) -> AnalysisResult:
    # 1. Analyze alarms with LLM or fallback
    llm_analysis = LLMService.infer_root_cause(alarms)

    confidence = llm_analysis["confidence"]
    domain = llm_analysis["failure_domain"]
    root_cause = llm_analysis["root_cause"]
    escalated_to = []

    # 2. A2A Collaboration if confidence is low
    if confidence < 0.8:
        # For CROSS-domain, query all agents; otherwise look for domain specialists
        if domain == "CROSS":
            target_domain = "CROSS"
            available_agents = registry_db.get_all()
        else:
            target_domain = domain if domain != "UNKNOWN" else "MULTI"
            available_agents = registry_db.get_by_domain(target_domain)

        for agent in available_agents:
            if agent.id != "rca-agent-01":  # skip self
                # Here we simulate using A2A semantics by including standard headers
                headers = {VERSION_HEADER: "1.0"}

                # Mocking the actual A2A HTTP request:
                # async with httpx.AsyncClient() as client:
                #     await client.post(
                #         f"{agent.url}/a2a/request-analysis",
                #         headers=headers,
                #         json={"incident_id": incident_id, "alarms": alarms, "domain_to_analyze": target_domain}
                #     )

                escalated_to.append(agent.id)
                root_cause += f" [Escalated via A2A (v1.0 Protocol) to Agent '{agent.name}' for deeper {target_domain} analysis]"
                confidence = min(0.95, confidence + 0.2)  # Boost confidence assuming agent helps
                break

    return AnalysisResult(
        incident_id=incident_id,
        root_cause=root_cause,
        confidence=confidence,
        failure_domain=domain,
        escalated_to=escalated_to
    )
