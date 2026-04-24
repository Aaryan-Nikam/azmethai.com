# Mantis Implementation Guide

## 🚀 Quick Start
1.  **Prerequisites**: Node.js 22+, PostgreSQL, Redis, Docker
2.  **Install**: `pnpm install`
3.  **Config**: Copy `src/config/config.yaml` to `~/.openclaw/mantis.yaml`
4.  **Run**: `pnpm start`

## 📅 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Create directory structure `src/business/{security,tools,workflows,types}`
- [x] Implement `PromptGuard` (Injection detection)
- [x] Implement `RBACManager` (Permission system)
- [x] Implement `AuditLogger` (Compliance logging)
- [ ] Write comprehensive tests
- [ ] Verify OpenClaw core compatibility

### Phase 2: Business Tools (Weeks 3-4)
- [ ] Implement CRM Integration (Salesforce/HubSpot)
- [ ] Implement Finance Tool (Stripe/QuickBooks)
- [ ] Create Document Processing Tool (OCR/PDF)
- [ ] Test tools independently

### Phase 3: Integration (Weeks 5-6)
- [ ] Hook Mantis security layer into OpenClaw Gateway
- [ ] Register Business Tools with Tool Registry
- [ ] End-to-End Testing

### Phase 4: Polish (Weeks 7-8)
- [ ] Implement Workflow Engine
- [ ] Finalize Documentation
- [ ] Production Deployment (Kubernetes/Docker)

## 🛠️ Troubleshooting
- **Gateway Connection Refused**: Check if port 18789 is free.
- **Docker Sandbox Error**: Ensure Docker daemon is running and user has permissions.
- **LLM API Error**: Verify `ANTHROPIC_API_KEY` is set in environment.

## ✅ Success Criteria
- [ ] Mantis Agent rejects prompt injection attacks
- [ ] Users can only access tools permitted by their role
- [ ] All sensitive actions are logged to audit file
- [ ] CRM and Finance tools successfully perform actions
