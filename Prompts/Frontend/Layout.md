Design the UI layout for AgentMesh frontend using React + TypeScript + shadcn/ui.

CRITICAL RULE:
- Do NOT implement authentication
- Do NOT add backend logic
- Focus ONLY on layout structure and component composition
- UI must map directly to existing API endpoints

---

# GLOBAL LAYOUT STRUCTURE

The application must use a consistent layout:

- Left sidebar navigation
- Main content area
- Top header (optional system status)

---

# SIDEBAR NAVIGATION ITEMS

- Dashboard (/)
- Agents (/agents)
- Register Agent (/register)
- Search (/search)
- Health (/health)
- Debug (/debug)

---

# 1. DASHBOARD PAGE LAYOUT (/)

Purpose: system overview

Layout:

Top summary cards:
- Total agents
- Healthy agents
- Unhealthy agents
- Unclassified capabilities count

Below:
- Capability distribution chart (canonical only)
- Recent agent activity list

---

# 2. AGENTS LIST PAGE (/agents)

Layout:

Top bar:
- search/filter input (capability + status)

Main section:
- table/grid of agents

Each agent card shows:
- name
- id
- status badge
- canonical capabilities (tags)
- latency indicator (if available)

Click → agent detail page

---

# 3. AGENT DETAIL PAGE (/agents/:id)

Layout:

Header:
- agent name
- status badge

Sections:

1. Metadata panel
   - id
   - url
   - version
   - provider

2. Capability panel
   - raw capabilities
   - normalized capabilities
   - canonical capabilities

3. Health panel
   - status
   - latency
   - last seen

4. Debug panel (if data available from /debug)
   - ingestion trace
   - last health failures

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
- status
- normalization summary

---

# 5. SEARCH PAGE (/search)

Layout:

Search bar:
- capability input

Filters:
- exact / partial match toggle

Results:
- ranked agent list
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
- status
- latency
- last seen

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

B. System state view
- capability distribution
- unclassified capabilities
- global stats

---

# COMPONENT DESIGN RULES

- Use shadcn/ui components only
- Keep components reusable:
  - AgentCard
  - CapabilityBadge
  - StatusBadge
  - MetricCard
  - DebugPanel
- Avoid page-specific hardcoding
- Keep layout consistent across pages

---

# DATA RULE

- UI must strictly reflect backend API data
- No mock transformations beyond formatting
- No frontend capability normalization logic

---

# RESPONSIVENESS RULE

- Sidebar collapses on mobile
- Tables become stacked cards on mobile
- Debug panels become accordion sections