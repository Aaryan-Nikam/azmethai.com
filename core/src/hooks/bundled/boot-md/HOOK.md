---
name: boot-md
description: "Run BOOT.md on gateway startup"
homepage: https://docs.azmeth.ai/hooks#boot-md
metadata:
  {
    "azmeth":
      {
        "emoji": "🚀",
        "events": ["gateway:startup"],
        "requires": { "config": ["workspace.dir"] },
        "install": [{ "id": "bundled", "kind": "bundled", "label": "Bundled with Azmeth" }],
      },
  }
---

# Boot Checklist Hook

Runs `BOOT.md` every time the gateway starts, if the file exists in the workspace.
