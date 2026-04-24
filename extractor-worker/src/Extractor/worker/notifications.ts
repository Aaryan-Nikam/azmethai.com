// packages/extractor/src/worker/notifications.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock');

export async function sendObligationAlert(payload: {
  vendorName: string;
  obligationType: string;
  daysRemaining: number;
  amountAtRisk: string;
  recipient: string;
  traceId: string;
}) {
  await resend.emails.send({
    from: 'Azmeth Alerts <alerts@azmeth.ai>',
    to: payload.recipient,
    subject: `Action required: ${payload.obligationType} — ${payload.daysRemaining} days remaining (${payload.amountAtRisk})`,
    html: `
      <p>Please review your upcoming obligations with <strong>${payload.vendorName}</strong>.</p>
      <p>Amount at risk: ${payload.amountAtRisk}</p>
      <hr/>
      <small>Trace ID: ${payload.traceId}</small>
    `
  });
}

export async function sendSlaBreachAlert(payload: {
  vendorName: string;
  recipient: string;
  traceId: string;
}) {
  await resend.emails.send({
    from: 'Azmeth Alerts <alerts@azmeth.ai>',
    to: payload.recipient,
    subject: `SLA breach alert: ${payload.vendorName} — verify credit on next invoice`,
    html: `
      <p>A mathematically confirmed SLA breach has triggered a credit obligation with <strong>${payload.vendorName}</strong>.</p>
      <p>Ensure that the ensuing invoice applies this successfully during Reconciler processing.</p>
      <hr/>
      <small>Trace ID: ${payload.traceId}</small>
    `
  });
}

export async function sendDisputeLetterReady(payload: {
  vendorName: string;
  invoiceNumber: string;
  recipient: string;
  traceId: string;
}) {
  await resend.emails.send({
    from: 'Azmeth Alerts <alerts@azmeth.ai>',
    to: payload.recipient,
    subject: `Dispute letter ready: ${payload.vendorName} — invoice ${payload.invoiceNumber}`,
    html: `
      <p>A dispute letter has passed Gate 1 and is ready for your Gate 2 review regarding <strong>${payload.vendorName}</strong>.</p>
      <hr/>
      <small>Trace ID: ${payload.traceId}</small>
    `
  });
}

export async function sendExtractionFailedAlert(payload: {
  filename: string;
  recipient: string;
  attempted: string;
  failureReason: string;
  traceId: string;
}) {
  await resend.emails.send({
    from: 'Azmeth Alerts <alerts@azmeth.ai>',
    to: payload.recipient,
    subject: `Document requires attention: ${payload.filename} could not be automatically processed`,
    html: `
      <p>We attempted to ${payload.attempted} but the system failed.</p>
      <p><strong>Reason:</strong> ${payload.failureReason}</p>
      <p>Please re-upload the file or contact support with the trace ID.</p>
      <hr/>
      <small>Trace ID: ${payload.traceId}</small>
    `
  });
}

// ==========================================
// VENDOR COMPLIANCE ALERTS V2
// ==========================================

export async function sendCriticalBreachAlert(payload: {
  vendorName: string;
  breachType: string;
  dueDate: string;
  recipient: string;
  evidence: string;
  traceId: string;
}) {
  await resend.emails.send({
    from: 'Azmeth Alerts <alerts@azmeth.ai>',
    to: payload.recipient,
    subject: `[URGENT] Vendor compliance breach: ${payload.vendorName} — ${payload.breachType} (action required by ${payload.dueDate})`,
    html: `
      <p>A deterministic security breach has been identified regarding your compliance boundaries with <strong>${payload.vendorName}</strong>.</p>
      <p>Breach Class: ${payload.breachType}</p>
      <p>Evidence: ${payload.evidence}</p>
      <p>Please review immediately to execute Gate 1 human authorization.</p>
      <hr/>
      <small>Trace ID: ${payload.traceId}</small>
    `
  });
}

export async function sendHighSeverityAlert(payload: {
  vendorName: string;
  breachType: string;
  daysUntilDue: number;
  recipient: string;
  traceId: string;
}) {
  await resend.emails.send({
    from: 'Azmeth Alerts <alerts@azmeth.ai>',
    to: payload.recipient,
    subject: `Vendor compliance alert: ${payload.vendorName} — ${payload.breachType} (${payload.daysUntilDue} days)`,
    html: `
      <p>A high severity security deficit requires scheduled review.</p>
      <p>Breach Class: ${payload.breachType}</p>
      <hr/>
      <small>Trace ID: ${payload.traceId}</small>
    `
  });
}

export async function sendExpiryDigest(payload: {
  tenantId: string;
  count: number;
  recipient: string;
  htmlTable: string;
  traceId: string;
}) {
  await resend.emails.send({
    from: 'Azmeth Alerts <alerts@azmeth.ai>',
    to: payload.recipient,
    subject: `Compliance expiry digest — ${payload.count} certifications expiring within 60 days`,
    html: `
      <p>The following vendor accreditations require renewal soon:</p>
      ${payload.htmlTable}
      <hr/>
      <small>Trace ID: ${payload.traceId}</small>
    `
  });
}

export async function sendNoticeQueuedAlert(payload: {
  vendorName: string;
  breachCount: number;
  recipient: string;
  traceId: string;
}) {
  await resend.emails.send({
    from: 'Azmeth Alerts <alerts@azmeth.ai>',
    to: payload.recipient,
    subject: `Compliance notice ready to send: ${payload.vendorName} — ${payload.breachCount} breach(es)`,
    html: `
      <p>A bundled compliance notice has been approved at Gate 2 and holds in the dispatch queue.</p>
      <hr/>
      <small>Trace ID: ${payload.traceId}</small>
    `
  });
}

export async function sendBreachRemediatedAlert(payload: {
  vendorName: string;
  breachTypeHuman: string;
  recipient: string;
  traceId: string;
}) {
  await resend.emails.send({
    from: 'Azmeth Alerts <alerts@azmeth.ai>',
    to: payload.recipient,
    subject: `Compliance resolved: ${payload.vendorName} — ${payload.breachTypeHuman}`,
    html: `
      <p>The compliance block for <strong>${payload.vendorName}</strong> has been successfully verified as Remediated.</p>
      <p>All internal processing limits lifted.</p>
      <hr/>
      <small>Trace ID: ${payload.traceId}</small>
    `
  });
}
