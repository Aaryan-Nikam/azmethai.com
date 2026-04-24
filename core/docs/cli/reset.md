---
summary: "CLI reference for `azmeth reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `azmeth reset`

Reset local config/state (keeps the CLI installed).

```bash
azmeth reset
azmeth reset --dry-run
azmeth reset --scope config+creds+sessions --yes --non-interactive
```
