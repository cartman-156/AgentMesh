Allowed states:
- registered
- approved
- deregistered

Rules:
- registration creates registered state
- approval transitions registered -> approved
- deregistration transitions:
  - registered -> deregistered
  - approved -> deregistered
- deregistration is terminal
- all transitions must be deterministic
- all lifecycle operations must be idempotent