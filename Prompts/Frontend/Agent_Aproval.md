Build Agent Approval + Rejection UI.

Requirements:
- show Approve + Reject actions in same component
- Approve action:
  - call POST /api/v1/agents/{agent_id}/approve
- Reject action:
  - call rejection action supported by backend
- show loading state
- show success/failure response
- refresh agent state after action

UI:
- use shadcn/ui buttons
- reject button must use destructive variant
- disable actions during request
- show current agent status

Constraints:
- no speculative moderation features
- no optimistic state mutation
- preserve backend response semantics