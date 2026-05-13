Build Agent Deregistration action.

Requirements:
- add Deregister button to agent list items
- call DELETE /api/v1/agents/{agent_id}
- show confirmation dialog before request
- show loading state
- show success/failure response
- refresh list after deregistration

UI:
- use shadcn/ui
- destructive button variant
- disabled while request in progress

Constraints:
- no hardcoded mock data
- no optimistic deletion
- preserve backend response semantics