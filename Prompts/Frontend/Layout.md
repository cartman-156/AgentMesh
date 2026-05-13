Design the UI layout for AgentMesh frontend using React + TypeScript + shadcn/ui.

CRITICAL RULE:
- Do NOT implement authentication
- Do NOT add backend logic
- Focus ONLY on layout structure and component composition
- UI must map directly to existing API endpoints
- UI must reflect agent lifecycle state (registered / approved / deregistered)

---

# GLOBAL LAYOUT STRUCTURE

The application must use a consistent layout:

- Left sidebar navigation
- Main content area
- Top header (system status + optional global health snapshot)

Header (optional):
- system health indicator (/api/v1/health)
- total agents summary (/api/v1/agents)

---

# SIDEBAR NAVIGATION ITEMS

- Dashboard (/)
- Agents (/agents)
- Register Agent (/register)
- Search (/search)
- Health (/health)
- Debug (/debug)

Lifecycle actions are NOT separate routes:
- Approve / Reject / Deregister are contextual actions inside Agent Detail + Agent List

---

# 1. DASHBOARD PAGE LAYOUT (/)

Purpose: system + lifecycle overview

Layout:

Top summary cards:
- Total agents
- Registered agents
- Approved agents
- Deregistered agents
- Healthy agents
- Unhealthy agents

Below:

- Capability distribution chart (canonical only)
- Recent agent activity list
- Lifecycle activity feed:
  - approvals
  - rejections
  - deregistrations

---

# 2. AGENTS LIST PAGE (/agents)

Layout:

Top bar:
- search/filter input (capability + status)
- status filter:
  - registered
  - approved
  - deregistered

Main section:
- table/grid of agents

Each agent card shows:
- name
- id
- lifecycle status badge
- canonical capabilities (tags)
- latency indicator (if available)

Actions per agent:
- View (/agents/:id)
- Approve
- Reject
- Deregister

Rules:
- Reject and Deregister are destructive actions
- Approve is primary action when status = registered

Click → agent detail page

---

# 3. AGENT DETAIL PAGE (/agents/:id)

Layout:

Header:
- agent name
- lifecycle status badge
- quick action buttons:
  - Approve
  - Reject
  - Deregister
  - Refresh

Sections:

## 1. Metadata panel
- id
- url
- version
- provider
- lifecycle status (must be visible)

## 2. Capability panel
- raw capabilities
- normalized capabilities
- canonical capabilities

## 3. Health panel
- status
- latency
- last seen
- health endpoint result (/api/v1/agents/:id/health)

## 4. Debug panel (if available from /api/v1/debug/*)
- ingestion trace
- capability normalization trace
- health failures

---

# 4. REGISTER AGENT PAGE (/register)

Layout:

Two-tab input system:

Tab 1:
- JSON editor input (agent card)

Tab 2:
- URL input field (.well-known/agent.json)

Submit button:
- "Register Agent"

Result panel:
- agent_id
- lifecycle status (expected: registered)
- normalization summary

---

# 5. SEARCH PAGE (/search)

Layout:

Search bar:
- capability input
- name input (optional)

Filters:
- match type:
  - exact
  - partial
- lifecycle filter:
  - registered
  - approved
  - deregistered

Results:
- ranked agent list
- lifecycle status badge
- match reason (if available)
- canonical mapping hint (optional display)

---

# 6. HEALTH PAGE (/health)

Layout:

System overview:
- total agents
- healthy / unhealthy ratio

Table:
- agent name
- lifecycle status
- health status
- latency
- last seen

Optional drilldown:
- click agent → /agents/:id

---

# 7. DEBUG PAGE (/debug)

Layout:

Two sections:

Left panel:
- agent selector OR search input

Right panel (dynamic):

A. Agent debug view
- raw → normalized → canonical capabilities
- ingestion trace
- health history
- lifecycle transitions history (if available)

B. System state view
- capability distribution
- unclassified capabilities
- lifecycle distribution
- global stats

---

# COMPONENT DESIGN RULES

- Use shadcn/ui components only
- Keep components reusable:
  - AgentCard
  - CapabilityBadge
  - StatusBadge (must support lifecycle states)
  - LifecycleBadge
  - MetricCard
  - DebugPanel
  - ActionButtonGroup (approve/reject/deregister)
- Avoid page-specific hardcoding
- Keep layout consistent across pages

---

# DATA RULE

- UI must strictly reflect backend API data
- No mock transformations beyond formatting
- No frontend capability normalization logic
- No inference of lifecycle state beyond API response

---

# STATE RULE

- UI state must be derived from backend responses
- After any lifecycle action:
  - refetch agent list/detail from API
  - do not locally mutate lifecycle state without confirmation

---

# RESPONSIVENESS RULE

- Sidebar collapses on mobile
- Tables become stacked cards on mobile
- Debug panels become accordion sections
- Action buttons become grouped dropdown on small screens