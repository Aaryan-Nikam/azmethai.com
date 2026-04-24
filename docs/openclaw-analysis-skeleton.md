# OpenClaw Analysis & Mantis Migration Skeleton

## 🧠 OpenClaw Architecture Analysis
OpenClaw uses a clean, modular architecture:
-   **Gateway**: Central hub (WebSocket/HTTP) handling connections, auth, and routing.
-   **Agent**: Uses Pi-agent framework for LLM interaction (streaming, tools).
-   **Channels**: Pluggable adapters for WhatsApp, Slack, Telegram, etc.
-   **Tools**: Registry of executable capabilities.

## 🔒 Security Gaps Identified
1.  **No Prompt Injection Protection**: Input is trusted by default.
2.  **Optional Sandboxing**: Can be disabled, risking host compromise.
3.  **Weak Secrets Management**: File-based storage.
4.  **Limited RBAC**: Binary allow/deny lists, no granular roles.

## 🦗 Mantis Architecture Redesign
Build **ON TOP** of OpenClaw, preserving the core but adding a "Business Layer":

```
┌─────────────────────────────────────┐
│       Mantis Security Layer         │  ← NEW
│  (Prompt Guard, RBAC, Audit)        │
├─────────────────────────────────────┤
│    Mantis Business Tools            │  ← NEW
│  (CRM, Finance, Documents)          │
├─────────────────────────────────────┤
│    OpenClaw Core (Unchanged)        │  ← KEEP
│  (Gateway, Pi Agent, Channels)      │
└─────────────────────────────────────┘
```

## 📋 Migration Strategy
We will not fork OpenClaw. We will create a `mantis` module that wraps/extends it.

1.  **Preserve**: Gateway architecture, Channel adapters, Session management.
2.  **Extend**: Add `MantisAgent` class that wraps the default agent loop with security checks.
3.  **Integrate**: Register new Business Tools via the standard Tool Registry.

## 📍 Integration Points
-   **Security**: Intercept messages at the Gateway level (`server.ts`) before they reach the Agent.
-   **Tools**: Add `src/business/tools/` and register them in `src/entry.ts`.
-   **Config**: Load `config.yaml` to override/extend default OpenClaw config.
