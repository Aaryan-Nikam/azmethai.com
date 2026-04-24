# Azmeth OS Production Runbook (Inbound + Outbound)

This is the “do this, then this” checklist to get **Inbound (Instagram/Facebook DMs)** and **Outbound (cold email)** running reliably for a client trial.

If you already have Supabase + Render deployed, you can skip straight to:
- **Demo Data Purge**
- **Meta (Inbound)**
- **Outbound Email**
- **Cron Worker**

---

## 0) Know Your Live URL

Decide what your production URL is, because Meta redirect + webhook URLs must match it exactly:

- `APP_URL` example: `https://azmethai.com`

In Render this corresponds to the service URL.

---

## 1) Demo Data Purge (Safe Reset)

Where: **Supabase Dashboard → SQL Editor**

Run the script in:
- [docs/sql/purge-demo-data.sql](sql/purge-demo-data.sql)

What it does:
- Deletes outbound campaign/leads/messages/queue + inbound leads/chat history + webhook queue.
- Does **not** delete auth users.

---

## 2) Supabase Setup (Database + Auth)

Where: **Supabase Dashboard**

### 2.1 Create / Verify Project Keys
Where: **Project Settings → API**

Copy these:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only, keep secret)

### 2.2 Google Login (if you use /login)
Where: **Authentication → Providers → Google**

1. Enable Google provider
2. Add your Google OAuth credentials
3. Add redirect URLs for your app:
   - `APP_URL/dashboard/command-center`
   - `APP_URL/dashboard/agent`

### 2.3 Storage Bucket (Attachments in Inbox)
Where: **Storage → Buckets**

Create bucket:
- `chat-attachments`

If you want “quick demo mode”, you can make it public.
For real production, lock it down with RLS.

---

## 3) Render / Production Env Vars

Where: **Render Dashboard → Service → Environment**

### 3.1 Required (App will break without these)
- `NEXT_PUBLIC_APP_URL` = `APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_KEY` legacy)
- `OPENAI_API_KEY`
- `CRON_SECRET` (any long random string)

### 3.2 Inbound (Meta)
- `NEXT_PUBLIC_META_APP_ID`
- `META_APP_SECRET`
- `NEXT_PUBLIC_META_REDIRECT_URI` = `APP_URL/api/auth/meta/callback`
- `META_WEBHOOK_VERIFY_TOKEN` (any long random string)

### 3.3 Outbound (Email)
Minimum (Gmail):
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `GMAIL_SENDER_NAME` (optional)

Optional (SMTP instead of Gmail):
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL` (optional)
- `SMTP_FROM_NAME` (optional)

Optional:
- `OUTBOUND_DAILY_LIMIT` (default is 50)
- `APIFY_API_KEY` (only needed for non-CSV lead sourcing)
- `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` (only needed for JS-heavy site scraping)

---

## 4) Cron Worker (Required for “it actually runs”)

The platform uses queue tables and a cron endpoint to process jobs:
- Inbound queue: `webhook_queue`
- Outbound queue: `outbound_queue`

Cron endpoint:
- `GET APP_URL/api/cron/process-queue`
- Header required:
  - `Authorization: Bearer CRON_SECRET`

Where to set it up:

### Option A (Recommended): Render Cron Job
Where: **Render Dashboard → New → Cron Job**

Command example (runs every minute):
```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/process-queue"
```

### Option B: Any external cron (cron-job.org, GitHub Actions, etc.)
Same curl call, once per minute.

---

## 5) Inbound System (Meta: Instagram + Facebook DMs)

This is the end-to-end path:
1. User connects Instagram/Facebook in the app (OAuth)
2. Meta sends webhooks → `APP_URL/api/webhooks/meta`
3. Jobs land in `webhook_queue`
4. Cron picks them up → AI reply → sends reply back via Graph API
5. Conversation appears in **Live Inbox**

### 5.1 Meta Developer App
Where: **Meta for Developers**

1. Create an App (Business type is fine)
2. Note:
   - App ID → set `NEXT_PUBLIC_META_APP_ID`
   - App Secret → set `META_APP_SECRET`
3. Add **Facebook Login** product
4. Add **Webhooks** product

### 5.2 Configure OAuth Redirect
Where: **Facebook Login → Settings**

Add Valid OAuth Redirect URI:
- `APP_URL/api/auth/meta/callback`

Also set:
- App Domains: your domain (no protocol)
- Privacy Policy URL (Meta often requires this later)

### 5.3 Connect Instagram / Facebook Page inside Azmeth
Where: **Azmeth UI → Dashboard → Integrations**

Click:
- “Connect Instagram”
- “Connect Facebook Page”

This will write/refresh a row in Supabase:
- `platform_connections`

### 5.4 Configure Webhook Subscription
Where: **Webhooks product → Subscriptions**

Callback URL:
- `APP_URL/api/webhooks/meta`

Verify token:
- set it to the exact value of `META_WEBHOOK_VERIFY_TOKEN`

Subscribe to these objects (minimum):
- `page` (for Messenger)
- `instagram` (for IG DMs)

Enable message-related fields (names can vary based on Meta UI):
- Messages / Messaging events

### 5.5 Smoke Test (Inbound)
1. DM your Instagram business account from another account
2. Check:
   - Supabase → Table Editor → `webhook_queue` has new rows
   - Cron is running (rows should move to `done`)
   - The DM should receive an AI reply
   - Live Inbox should show the thread

If nothing arrives, the usual causes are:
- Wrong webhook URL
- Verify token mismatch
- App not subscribed to the Page / IG account
- Permissions not granted (or app is still in “dev mode” without testers)

---

## 6) Outbound System (Cold Email)

End-to-end path:
1. Create campaign → leads imported/scraped → `outbound_leads`
2. Stages enqueue in `outbound_queue`
3. Cron processes: research → qualify → personalise → send
4. Sent email rows in `outbound_messages`

### 6.1 Configure Email Sending
Where: **Render env vars** (recommended) OR campaign config (less secure)

Fastest free path:
1. Use a Gmail account dedicated to outreach
2. Enable 2FA
3. Create an App Password
4. Set:
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`

### 6.2 Deliverability Minimums (Strongly Recommended)
Where: your DNS provider (GoDaddy/Cloudflare/etc.)

Set up:
- SPF
- DKIM
- DMARC

### 6.3 Lead Source
Where: **Azmeth UI → Systems → Outbound Engine**

For a reliable Monday trial, use **CSV Upload** (no external dependencies).

If you want scraping:
- Set `APIFY_API_KEY`
- Use Crunchbase mode or custom actor URL

### 6.4 Smoke Test (Outbound)
1. Create a campaign with 5 leads via CSV
2. Confirm `outbound_queue` starts filling
3. Confirm cron drains the queue
4. Confirm `outbound_messages` become `sent`

---

## 7) Health Checks

Where: your browser (production URL)

Open:
- `APP_URL/api/health`

You should see:
- Supabase connected
- Required tables reachable
- OpenAI key present

---

## 8) “Production Ready” Follow-ups (After Monday)

These are important but bigger:
- Don’t store Gmail app passwords inside `outbound_campaigns.config` (move to secrets storage)
- Add strict RLS by user/tenant on all tables
- Add unsubscribe + suppression list
- Add reply capture for outbound email (inbound parsing or provider webhook)
- Add rate limiting + backpressure for webhooks (Meta can spike)
