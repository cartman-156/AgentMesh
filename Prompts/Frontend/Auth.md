Prepare the frontend architecture for future authentication support WITHOUT implementing authentication.

---

# CRITICAL RULE

- Do NOT implement login, signup, or auth flows
- Do NOT call any auth APIs
- Do NOT restrict UI based on roles yet

---

# ARCHITECTURE GOAL

Prepare frontend so authentication can be added later with minimal refactoring.

---

# REQUIRED STRUCTURE ADDITIONS

Add the following abstractions:

## 1. API Layer Wrapper

All API calls must go through:

- apiClient.ts

This allows future injection of auth headers.

---

## 2. Request Interceptor Layer (placeholder only)

Create structure for:

- request interceptors
- response interceptors

BUT DO NOT implement auth logic yet.

---

## 3. Protected Route placeholders

Routes should be structured as:

- PublicRoute (currently all routes)
- ProtectedRoute (placeholder wrapper only)

DO NOT enforce restrictions yet.

---

## 4. Session context placeholder

Create a SessionContext with:

- user: null
- isAuthenticated: false

BUT DO NOT implement real auth logic.

---

## 5. API header readiness

Ensure API client can later support:

- Authorization headers
- API keys
- tokens

BUT DO NOT use them now.

---

# UI IMPACT RULE

- All pages remain publicly accessible
- No UI differences based on auth state
- No hidden components

---

# FUTURE EXTENSION GOAL

This structure must allow:

- authentication layer addition
- role-based access control
- multi-registry support

WITHOUT rewriting UI architecture.