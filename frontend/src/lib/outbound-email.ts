import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { createOutboundClient } from '@/lib/outbound';

interface GmailAccount {
  email?: string;
  password?: string;
}

interface SmtpAccount {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  password?: string;
  from_name?: string;
  from_email?: string;
}

interface CampaignEmailConfig {
  gmail_accounts?: GmailAccount[];
  smtp_accounts?: SmtpAccount[];
  daily_limit?: number;
}

interface SendOptions {
  dryRun?: boolean;
}

interface SendResult {
  ok: boolean;
  skipped?: boolean;
  note?: string;
  message_id: string;
  lead_email: string;
  sender: string;
  provider: 'gmail' | 'smtp';
  sent_at: string;
}

function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
  return fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtmlBody(text: string): string {
  return `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; max-width: 600px;">
${text
  .split('\n')
  .map((line) => `<p style="margin: 0 0 12px 0;">${escapeHtml(line)}</p>`)
  .join('')}
</div>`;
}

function buildTransportFromConfig(config: CampaignEmailConfig) {
  const senderName = process.env.SMTP_SENDER_NAME || process.env.GMAIL_SENDER_NAME || 'Outbound Engine';

  const smtpAccount = pickRandom(config.smtp_accounts ?? []);
  if (smtpAccount?.host && smtpAccount?.user && smtpAccount?.password) {
    const port = asNumber(smtpAccount.port, 587);
    const secure = typeof smtpAccount.secure === 'boolean' ? smtpAccount.secure : port === 465;

    const transport = nodemailer.createTransport({
      host: smtpAccount.host,
      port,
      secure,
      auth: {
        user: smtpAccount.user,
        pass: smtpAccount.password,
      },
    } as SMTPTransport.Options);

    const fromEmail = smtpAccount.from_email || smtpAccount.user;
    const fromName = smtpAccount.from_name || senderName;

    return {
      provider: 'smtp' as const,
      transport,
      from: `"${fromName}" <${fromEmail}>`,
    };
  }

  const gmailAccount = pickRandom(config.gmail_accounts ?? []);
  if (gmailAccount?.email && gmailAccount?.password) {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailAccount.email,
        pass: gmailAccount.password,
      },
    });

    return {
      provider: 'gmail' as const,
      transport,
      from: `"${senderName}" <${gmailAccount.email}>`,
    };
  }

  const envSmtpHost = process.env.SMTP_HOST;
  const envSmtpUser = process.env.SMTP_USER;
  const envSmtpPass = process.env.SMTP_PASS;
  if (envSmtpHost && envSmtpUser && envSmtpPass) {
    const envSmtpPort = asNumber(process.env.SMTP_PORT, 587);
    const envSmtpSecure = asBool(process.env.SMTP_SECURE, envSmtpPort === 465);
    const fromEmail = process.env.SMTP_FROM_EMAIL || envSmtpUser;
    const fromName = process.env.SMTP_FROM_NAME || senderName;

    const transport = nodemailer.createTransport({
      host: envSmtpHost,
      port: envSmtpPort,
      secure: envSmtpSecure,
      auth: {
        user: envSmtpUser,
        pass: envSmtpPass,
      },
    } as SMTPTransport.Options);

    return {
      provider: 'smtp' as const,
      transport,
      from: `"${fromName}" <${fromEmail}>`,
    };
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    return {
      provider: 'gmail' as const,
      transport,
      from: `"${senderName}" <${gmailUser}>`,
    };
  }

  throw new Error(
    'Email sender is not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS (recommended free SMTP) or GMAIL_USER/GMAIL_APP_PASSWORD.',
  );
}

export async function sendOutboundMessageById(messageId: string, options: SendOptions = {}): Promise<SendResult> {
  const db = createOutboundClient();

  const { data: message, error: msgErr } = await db
    .from('outbound_messages')
    .select('*, outbound_leads!inner(first_name, last_name, email, company, stage), outbound_campaigns!inner(config)')
    .eq('id', messageId)
    .single();

  if (msgErr || !message) {
    throw new Error('Message not found');
  }

  if (message.status === 'sent') {
    const lead = message.outbound_leads as { email?: string | null };
    return {
      ok: true,
      skipped: true,
      note: 'Already sent',
      message_id: messageId,
      lead_email: lead?.email || '',
      sender: 'already_sent',
      provider: 'smtp',
      sent_at: message.sent_at || new Date().toISOString(),
    };
  }

  const lead = message.outbound_leads as {
    email: string | null;
    stage: string;
  };

  const campaign = message.outbound_campaigns as {
    config?: CampaignEmailConfig;
  };

  if (!lead?.email) {
    throw new Error('Lead has no email address — cannot send');
  }

  if (!message.subject || !message.body) {
    throw new Error('Message has no subject or body — run personalise first');
  }

  const config = campaign.config ?? {};
  const configuredDailyLimit = asNumber(config.daily_limit, NaN);
  const envDailyLimit = asNumber(process.env.OUTBOUND_DAILY_LIMIT, 50);
  const dailyLimit = Number.isFinite(configuredDailyLimit) ? configuredDailyLimit : envDailyLimit;

  const todayStr = new Date().toISOString().split('T')[0];
  const { count: sentToday, error: sentCountErr } = await db
    .from('outbound_messages')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', message.campaign_id)
    .not('sent_at', 'is', null)
    .gte('sent_at', `${todayStr}T00:00:00Z`);

  if (sentCountErr) throw sentCountErr;

  if ((sentToday || 0) >= dailyLimit) {
    throw new Error(`Daily limit of ${dailyLimit} sends reached. Delivery paused until tomorrow.`);
  }

  const transportConfig = buildTransportFromConfig(config);
  const sentAt = new Date().toISOString();

  if (!options.dryRun) {
    await transportConfig.transport.sendMail({
      from: transportConfig.from,
      to: lead.email,
      subject: message.subject,
      text: message.body,
      html: buildHtmlBody(message.body),
    });
  }

  await db
    .from('outbound_messages')
    .update({
      status: options.dryRun ? 'draft' : 'sent',
      sent_at: options.dryRun ? null : sentAt,
    })
    .eq('id', messageId);

  if (!options.dryRun) {
    await db
      .from('outbound_leads')
      .update({ stage: 'sent' })
      .eq('id', message.lead_id);
  }

  return {
    ok: true,
    message_id: messageId,
    lead_email: lead.email,
    sender: transportConfig.from,
    provider: transportConfig.provider,
    sent_at: options.dryRun ? 'dry_run' : sentAt,
  };
}

export async function resolveLatestDraftMessageIdForLead(leadId: string): Promise<string | null> {
  const db = createOutboundClient();

  const { data: row, error } = await db
    .from('outbound_messages')
    .select('id, status')
    .eq('lead_id', leadId)
    .eq('channel', 'email')
    .neq('status', 'sent')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return row?.id ?? null;
}
