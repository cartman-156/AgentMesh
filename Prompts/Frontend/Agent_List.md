Update Agent List UI.

Requirements:
- display agent lifecycle status
- support:
  - registered
  - approved
  - deregistered
- show status badge on each agent
- expose:
  - View
  - Approve/Reject
  - Deregister actions

UI:
- use shadcn/ui badges + buttons
- approved:
  - green badge
- registered:
  - yellow badge
- deregistered:
  - gray/red badge

Constraints:
- preserve existing list structure
- no speculative lifecycle states
- no client-side lifecycle inference