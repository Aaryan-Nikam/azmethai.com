import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Film,
  Inbox,
  Link2,
  MessageSquare,
  Phone,
  ShieldCheck,
} from "lucide-react";

const REVIEW_STEPS = [
  {
    title: "Step 1: Click Connect",
    detail: "Open `/dashboard/integrations?review=1` and click `Connect Facebook & Instagram`.",
  },
  {
    title: "Step 2: Complete Facebook Login",
    detail: "Approve the requested permissions in Facebook OAuth, then return to the integrations screen.",
  },
  {
    title: "Step 3: Select the Facebook Page",
    detail: "Use the visible Page list populated from `/me/accounts` and choose the Page to review.",
  },
  {
    title: "Step 4: Verify Connected Assets",
    detail: "Show the Page name, Page category, linked Instagram account ID, username, and the Instagram media grid.",
  },
  {
    title: "Step 5: Open the Inbox",
    detail: "Open the Instagram and Facebook inbox panels so incoming messages and sender names are visible.",
  },
  {
    title: "Step 6: Send an Inbox Reply",
    detail: "Type a reply in either inbox panel and click `Send Message` so the reviewer sees the response action.",
  },
  {
    title: "Step 7: Send a WhatsApp Message",
    detail: "Enter a phone number, type a message, click `Send WhatsApp Message`, and show the success confirmation plus history.",
  },
];

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck size={14} />
                Reviewer Instructions
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Meta App Review walkthrough</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  This route mirrors the exact UI on the existing integrations screen so a reviewer can quickly confirm why each Meta permission is needed.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/integrations?review=1"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open integrations review flow
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard/inbox"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Open existing inbox route
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Film size={18} />
              Recording order
            </div>
            <div className="space-y-3">
              {REVIEW_STEPS.map((step) => (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 text-emerald-600" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{step.title}</div>
                      <div className="mt-1 text-sm text-slate-600">{step.detail}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-lg font-semibold text-slate-900">Permission map</div>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="font-semibold">`pages_show_list`</div>
                  <div className="mt-1">Visible Page list with Page name + Page ID.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="font-semibold">`pages_manage_metadata`</div>
                  <div className="mt-1">Connected Assets card with Page category and linked Instagram account ID.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="font-semibold">`instagram_basic`</div>
                  <div className="mt-1">Instagram username, user ID, and visible media grid with captions and timestamps.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="font-semibold">`instagram_manage_messages`</div>
                  <div className="mt-1">Instagram inbox panel with incoming messages and reply box.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="font-semibold">`pages_messaging`</div>
                  <div className="mt-1">Facebook Page inbox panel with sender names and reply action.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="font-semibold">`whatsapp_business_messaging`</div>
                  <div className="mt-1">WhatsApp send form, confirmation message, and history panel.</div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-lg font-semibold text-slate-900">Reviewer tips</div>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Link2 size={16} className="mt-0.5 text-slate-500" />
                  <span>Use a Facebook Page that is linked to an Instagram Business account.</span>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Phone size={16} className="mt-0.5 text-slate-500" />
                  <span>Have a WhatsApp Cloud API phone number configured before recording.</span>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Inbox size={16} className="mt-0.5 text-slate-500" />
                  <span>Send at least one fresh Instagram DM and one fresh Page message so the inbox panels are populated.</span>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <MessageSquare size={16} className="mt-0.5 text-slate-500" />
                  <span>Use an Instagram account with 3+ posts to satisfy the visible media requirement during review.</span>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
