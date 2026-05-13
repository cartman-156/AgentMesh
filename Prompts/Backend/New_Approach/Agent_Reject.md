# APPROVAL API: ADD REJECT SUPPORT

Follow:
- System_Role.md
- Execution_Mode.md
- A2A_Protocol_Rules.md
- API_Contract.md
- Architecture_Rules.md
- Capability_Rule.md
- Database_Rules.md
- Response_Rules.md

Task:
Extend existing approval functionality to support rejection.

Requirements:
- reuse:
  - POST /api/v1/agents/{agent_id}/approve
- support approval actions:
  - approve
  - reject
- reject must permanently remove the agent from the registry
- rejected agents must not remain queryable
- rejected agents must not remain discoverable
- rejected agents must not remain persisted

Behavior:
- approve:
  - existing behavior unchanged
- reject:
  - validate agent existence
  - perform deterministic hard delete
  - remove raw + normalized records
  - remove related indexed capability data if present
  - operation must be idempotent

Request:
- extend existing request handling minimally
- do not change existing approval response shape

Reject Response:
- { id, status: "rejected" }

Must:
- preserve existing approval behavior
- preserve API compatibility where possible
- update tests incrementally
- update validation deterministically
- maintain strict layer separation

Constraints:
- no new endpoints
- no speculative moderation system
- no soft-delete for rejected agents
- no response wrapping
- no field renaming

Do NOT modify:
- unrelated APIs
- capability normalization semantics
- Agent Card semantics

Execution:
- modify files directly
- no chat output