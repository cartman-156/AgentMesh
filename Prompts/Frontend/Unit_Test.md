Generate a complete frontend test suite for the AgentMesh React + TypeScript application.

---

# PURPOSE

Validate frontend correctness against backend API contract.

Focus on:
- API client correctness
- UI rendering logic
- page-level behavior
- contract compliance (no schema drift)

---

# TEST FRAMEWORK

Use:
- Vitest OR Jest (based on project setup)
- React Testing Library

---

# TEST STRUCTURE

Create:

/src/tests
  api.client.test.ts
  agents.page.test.tsx
  search.page.test.tsx
  register.page.test.tsx
  health.page.test.tsx
  debug.page.test.tsx

---

# TEST COVERAGE

## 1. API Client Tests

- correct endpoint calls for all /api/v1 routes
- response typing correctness
- no transformation of backend data
- error handling for 4xx/5xx

---

## 2. Agent List Page

- renders agent list correctly
- displays status badges
- shows canonical capabilities
- handles empty state

---

## 3. Agent Detail Page

- renders full agent metadata
- displays health status
- displays capability breakdown
- renders debug data if available

---

## 4. Registration Page

- submits JSON agent card
- submits URL-based registration
- handles success/failure states
- validates UI response display

---

## 5. Search Page

- sends correct query to backend
- renders ranked results
- displays match reason if provided
- handles no results

---

## 6. Health Page

- renders system health metrics
- displays agent status table
- handles loading/error states

---

## 7. Debug Page

- fetches /api/v1/debug/* endpoints
- renders ingestion trace
- renders search trace
- renders system snapshot
- ensures read-only behavior

---

# CRITICAL RULES

- DO NOT mock backend logic (only API calls if needed)
- DO NOT duplicate capability logic in frontend
- DO NOT derive or compute backend fields
- UI must strictly reflect API responses

---

# CONTRACT RULE ENFORCEMENT

Frontend tests MUST validate:

- API response is used as-is
- no transformation of canonical_capabilities
- no local normalization logic exists

---

# OUTPUT REQUIREMENT

Generate:
- runnable test suite
- realistic test data
- isolated test files per page/module
- strict contract validation assertions