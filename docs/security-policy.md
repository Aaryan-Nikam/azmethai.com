# Enterprise Security Policy for Mantis

## 1. Core Security Policies

### 1.1 Least Privilege (RBAC)
-   Users are assigned the minimum permissions necessary for their role.
-   Default role is `viewer` (read-only).
-   Just-in-Time (JIT) access for sensitive operations.

### 1.2 Input Validation
-   All external input (user prompts, API data) MUST be sanitized.
-   PROMPT GUARD must be enabled in production.
-   Injections patterns (`[INST]`, `system:`) are blocked.

### 1.3 Audit Logging
-   All security-critical actions (auth, tool execution, injections) MUST be logged.
-   Logs must be immutable and retained for 90 days.
-   PII in logs must be masked.

### 1.4 Sandboxing
-   All executable code (LLM generated code) MUST run in an isolated Docker sandbox.
-   No direct host network access from sandbox.

### 1.5 Secrets Management
-   API keys and credentials MUST NOT be stored in plain text.
-   Use environment variables or a secrets manager (Vault/AWS Secrets).

## 2. Pre-Deployment Checklist
-   [ ] Prompt Guard active and tested with 50+ attack vectors.
-   [ ] RBAC roles defined and verified.
-   [ ] Audit logging verified (logs appearing in secure location).
-   [ ] SSL/TLS enabled for Gateway.
-   [ ] API keys rotated and secured.
-   [ ] Database backups configured.

## 3. Compliance
-   **GDPR**: User data deletion workflows implemented.
-   **SOC 2**: Audit trails and access controls in place.
-   **HIPAA**: If handling health data, ensure encryption at rest and in transit.

## 4. Incident Response
1.  **Detect**: Monitor Audit Logs for `severity: critical`.
2.  **Contain**: Revoke access of suspicious user/API key.
3.  **Eradicate**: Patch vulnerability (e.g., update Prompt Guard patterns).
4.  **Recover**: Restore from backup if data corrupted.
5.  **Review**: Post-mortem analysis.
