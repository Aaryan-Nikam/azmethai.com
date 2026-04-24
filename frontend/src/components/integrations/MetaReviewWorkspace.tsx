"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Inbox,
  Info,
  Link2,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ReviewChannel = "facebook" | "instagram";

type PageOption = {
  id: string;
  name: string;
  category: string | null;
};

type InstagramAccount = {
  id: string;
  username: string | null;
  profile_picture_url?: string | null;
};

type InstagramMedia = {
  id: string;
  caption: string | null;
  media_type: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  timestamp: string | null;
  permalink: string | null;
};

type OverviewResponse = {
  connected: boolean;
  connectionSource: string | null;
  connectedAt: string | null;
  requestedPermissions: readonly string[];
  secureStorageLabel: string;
  pages: PageOption[];
  selectedPageId: string | null;
  selectedPage: PageOption | null;
  instagramAccount: InstagramAccount | null;
  instagramMedia: InstagramMedia[];
  whatsapp: {
    configured: boolean;
    phoneNumberId: string | null;
    displayPhoneNumber: string | null;
    configSource: string | null;
  };
  notes: string[];
};

type ReviewMessage = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: string | null;
  direction: "incoming" | "outgoing";
};

type ConversationThread = {
  id: string;
  channel: ReviewChannel;
  senderId: string;
  senderName: string;
  updatedAt: string | null;
  messages: ReviewMessage[];
};

type InboxResponse = {
  threads: ConversationThread[];
  notes: string[];
};

type WhatsAppHistoryItem = {
  id: string;
  text: string;
  direction: "incoming" | "outgoing";
  createdAt: string | null;
};

type WhatsAppResponse = {
  configured: boolean;
  phoneNumberId: string | null;
  displayPhoneNumber: string | null;
  configSource: string | null;
  history: WhatsAppHistoryItem[];
};

type StepStatus = "complete" | "active" | "pending";

const SECTION_HELP: Record<string, string> = {
  pages_show_list: "This uses pages_show_list to show every Facebook Page the user can manage.",
  pages_manage_metadata: "This uses pages_manage_metadata to read Page details and connected Instagram assets.",
  instagram_basic: "This uses instagram_basic to show the linked Instagram Business profile and media.",
  instagram_manage_messages: "This uses instagram_manage_messages to show Instagram conversations and send replies.",
  pages_messaging: "This uses pages_messaging to show Facebook Page conversations and send replies.",
  whatsapp_business_messaging: "This uses whatsapp_business_messaging to send WhatsApp Business messages.",
};

function PermissionChip({ permission }: { permission: string }) {
  return (
    <span
      title={SECTION_HELP[permission] || `This UI demonstrates the ${permission} permission.`}
      className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"
    >
      {permission}
    </span>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function truncate(text: string | null | undefined, maxLength = 120) {
  if (!text) return "No caption";
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function StepPill({ status, label }: { status: StepStatus; label: string }) {
  const classes =
    status === "complete"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "active"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-slate-200 bg-white text-slate-500";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${classes}`}>
      <div className="flex items-center gap-2">
        <CheckCircle2 size={15} className={status === "complete" ? "opacity-100" : "opacity-40"} />
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  permissions,
  reviewMode,
  children,
}: {
  title: string;
  description: string;
  permissions: string[];
  reviewMode: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-3xl border bg-white p-6 shadow-sm ${
        reviewMode ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200"
      }`}
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="max-w-3xl text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.map((permission) => (
            <PermissionChip key={permission} permission={permission} />
          ))}
        </div>
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

function ConversationPanel({
  title,
  subtitle,
  permission,
  threads,
  notes,
  activeThreadId,
  onSelectThread,
  draft,
  onDraftChange,
  onSend,
  sending,
}: {
  title: string;
  subtitle: string;
  permission: string;
  threads: ConversationThread[];
  notes: string[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (thread: ConversationThread) => void;
  sending: boolean;
}) {
  const activeThread = threads.find((thread) => thread.id === activeThreadId) || null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <PermissionChip permission={permission} />
      </div>

      {notes.length > 0 && (
        <div className="space-y-2 border-b border-slate-200 bg-amber-50 px-4 py-3">
          {notes.map((note) => (
            <div key={note} className="flex items-start gap-2 text-xs text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-0 md:grid-cols-[260px_minmax(0,1fr)]">
        <div className="border-b border-slate-200 md:border-b-0 md:border-r">
          {threads.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No conversations available yet.</div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectThread(thread.id)}
                className={`w-full border-b border-slate-200 px-4 py-3 text-left transition hover:bg-white ${
                  activeThread?.id === thread.id ? "bg-white" : "bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{thread.senderName}</div>
                    <div className="text-xs text-slate-500">{thread.senderId}</div>
                  </div>
                  <div className="text-[11px] text-slate-400">{formatDateTime(thread.updatedAt)}</div>
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  {truncate(thread.messages[thread.messages.length - 1]?.text, 80)}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex min-h-[420px] flex-col">
          {activeThread ? (
            <>
              <div className="border-b border-slate-200 bg-white px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">{activeThread.senderName}</div>
                <div className="text-xs text-slate-500">
                  Reviewer can see incoming messages and send a reply from this panel.
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {activeThread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === "incoming" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        message.direction === "incoming"
                          ? "border border-slate-200 bg-white text-slate-800"
                          : "bg-slate-900 text-white"
                      }`}
                    >
                      <div className="mb-1 text-[11px] font-semibold opacity-70">
                        {message.direction === "incoming" ? `Incoming • ${message.senderName}` : "Outgoing • Business Reply"}
                      </div>
                      <div>{message.text}</div>
                      <div className="mt-2 text-[11px] opacity-60">{formatDateTime(message.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 bg-white p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reply Input
                </div>
                <textarea
                  value={draft}
                  onChange={(event) => onDraftChange(event.target.value)}
                  placeholder="Type a reply the reviewer can send during app review…"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Sender visible: <span className="font-semibold text-slate-700">{activeThread.senderName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSend(activeThread)}
                    disabled={sending || !draft.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Send Message
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-500">
              Select a conversation so the reviewer can see the incoming message and the reply composer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MetaReviewWorkspace() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [selectingPage, setSelectingPage] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState("");

  const [instagramInbox, setInstagramInbox] = useState<InboxResponse>({ threads: [], notes: [] });
  const [facebookInbox, setFacebookInbox] = useState<InboxResponse>({ threads: [], notes: [] });
  const [loadingInstagramInbox, setLoadingInstagramInbox] = useState(false);
  const [loadingFacebookInbox, setLoadingFacebookInbox] = useState(false);
  const [activeInstagramThreadId, setActiveInstagramThreadId] = useState<string | null>(null);
  const [activeFacebookThreadId, setActiveFacebookThreadId] = useState<string | null>(null);
  const [instagramDraft, setInstagramDraft] = useState("");
  const [facebookDraft, setFacebookDraft] = useState("");
  const [sendingChannel, setSendingChannel] = useState<ReviewChannel | null>(null);

  const [whatsAppPhone, setWhatsAppPhone] = useState("");
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [whatsAppHistory, setWhatsAppHistory] = useState<WhatsAppHistoryItem[]>([]);
  const [loadingWhatsAppHistory, setLoadingWhatsAppHistory] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsAppConfirmation, setWhatsAppConfirmation] = useState<string | null>(null);

  const [lastInboxSendAt, setLastInboxSendAt] = useState<string | null>(null);
  const [lastWhatsAppSendAt, setLastWhatsAppSendAt] = useState<string | null>(null);

  const requestedPermissions = overview?.requestedPermissions || [];

  const selectedInstagramThread =
    instagramInbox.threads.find((thread) => thread.id === activeInstagramThreadId) || null;
  const selectedFacebookThread =
    facebookInbox.threads.find((thread) => thread.id === activeFacebookThreadId) || null;

  async function loadOverview(currentUserId: string) {
    setLoadingOverview(true);
    try {
      const response = await fetch("/api/meta/review/overview", {
        headers: { "x-user-id": currentUserId },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to load Meta review overview.");
      setOverview(payload as OverviewResponse);
      setSelectedPageId(payload.selectedPageId || "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load Meta review overview.");
    } finally {
      setLoadingOverview(false);
    }
  }

  async function loadInbox(currentUserId: string, channel: ReviewChannel) {
    const setter = channel === "instagram" ? setInstagramInbox : setFacebookInbox;
    const setLoading = channel === "instagram" ? setLoadingInstagramInbox : setLoadingFacebookInbox;
    const setActiveThreadId = channel === "instagram" ? setActiveInstagramThreadId : setActiveFacebookThreadId;

    setLoading(true);
    try {
      const response = await fetch(`/api/meta/review/inbox?channel=${channel}`, {
        headers: { "x-user-id": currentUserId },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Failed to load ${channel} inbox.`);
      setter(payload as InboxResponse);
      setActiveThreadId((existing) => {
        const threads = (payload as InboxResponse).threads;
        if (threads.some((thread) => thread.id === existing)) return existing;
        return threads[0]?.id || null;
      });
    } catch (error) {
      setter({
        threads: [],
        notes: [error instanceof Error ? error.message : `Failed to load ${channel} inbox.`],
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadWhatsAppHistory(currentUserId: string, phone: string) {
    setLoadingWhatsAppHistory(true);
    try {
      const query = phone ? `?phone=${encodeURIComponent(phone)}` : "";
      const response = await fetch(`/api/meta/review/whatsapp${query}`, {
        headers: { "x-user-id": currentUserId },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to load WhatsApp history.");
      const historyPayload = payload as WhatsAppResponse;
      setWhatsAppHistory(historyPayload.history || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load WhatsApp history.");
    } finally {
      setLoadingWhatsAppHistory(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;
      if (error) {
        toast.error(error.message || "Please sign in first.");
        setLoadingOverview(false);
        return;
      }

      const currentUserId = data.user?.id || null;
      setUserId(currentUserId);
      if (!currentUserId) {
        setLoadingOverview(false);
        return;
      }

      await loadOverview(currentUserId);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setReviewMode(params.get("review") === "1");
  }, []);

  useEffect(() => {
    if (!userId || !overview?.selectedPageId) return;
    void Promise.all([loadInbox(userId, "instagram"), loadInbox(userId, "facebook")]);
  }, [userId, overview?.selectedPageId]);

  const steps = useMemo(() => {
    const instagramReady = Boolean(overview?.instagramAccount && overview.instagramMedia.length > 0);
    const inboxReady = instagramInbox.threads.length > 0 || facebookInbox.threads.length > 0;

    return [
      {
        label: "Step 1: Facebook Login",
        status: overview?.connected ? "complete" : "active",
      },
      {
        label: "Step 2: Select Page (pages_show_list)",
        status: overview?.selectedPageId ? "complete" : overview?.connected ? "active" : "pending",
      },
      {
        label: "Step 3: View Instagram Data",
        status: instagramReady ? "complete" : overview?.selectedPageId ? "active" : "pending",
      },
      {
        label: "Step 4: View Inbox",
        status: inboxReady ? "complete" : overview?.selectedPageId ? "active" : "pending",
      },
      {
        label: "Step 5: Send Message",
        status: lastInboxSendAt ? "complete" : (selectedInstagramThread || selectedFacebookThread) ? "active" : "pending",
      },
      {
        label: "Step 6: Send WhatsApp Message",
        status: lastWhatsAppSendAt ? "complete" : overview?.whatsapp.configured ? "active" : "pending",
      },
    ] as Array<{ label: string; status: StepStatus }>;
  }, [
    facebookInbox.threads.length,
    instagramInbox.threads.length,
    lastInboxSendAt,
    lastWhatsAppSendAt,
    overview?.connected,
    overview?.instagramAccount,
    overview?.instagramMedia.length,
    overview?.selectedPageId,
    overview?.whatsapp.configured,
    selectedFacebookThread,
    selectedInstagramThread,
  ]);

  async function handleConnect() {
    if (!userId) {
      toast.error("Please sign in before connecting Meta.");
      router.push("/login");
      return;
    }

    window.location.assign(`/api/auth/meta/connect?platform=meta&source=review&userId=${encodeURIComponent(userId)}`);
  }

  async function handleRefresh() {
    if (!userId) return;
    await loadOverview(userId);
    if (overview?.selectedPageId) {
      await Promise.all([loadInbox(userId, "instagram"), loadInbox(userId, "facebook")]);
    }
  }

  async function handlePageSelection() {
    if (!userId) {
      toast.error("Please sign in before selecting a Page.");
      return;
    }
    if (!selectedPageId) {
      toast.error("Choose a Facebook Page from the visible list first.");
      return;
    }

    setSelectingPage(true);
    try {
      const response = await fetch("/api/meta/review/select-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ pageId: selectedPageId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to save selected Page.");
      setOverview(payload as OverviewResponse);
      toast.success("Facebook Page selected. Connected assets loaded for review.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save selected Page.");
    } finally {
      setSelectingPage(false);
    }
  }

  async function handleSendInboxReply(channel: ReviewChannel, thread: ConversationThread) {
    if (!userId) {
      toast.error("Please sign in before sending messages.");
      return;
    }

    const draft = channel === "instagram" ? instagramDraft : facebookDraft;
    if (!draft.trim()) {
      toast.error("Type a reply first.");
      return;
    }

    setSendingChannel(channel);
    try {
      const response = await fetch("/api/meta/review/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          channel,
          recipientId: thread.senderId,
          recipientName: thread.senderName,
          message: draft.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Failed to send ${channel} message.`);

      const sentMessage: ReviewMessage = {
        id: `sent-${Date.now()}`,
        text: draft.trim(),
        senderId: channel === "instagram" ? overview?.instagramAccount?.id || "business" : overview?.selectedPageId || "business",
        senderName: "Business Reply",
        createdAt: payload.sentAt || new Date().toISOString(),
        direction: "outgoing",
      };

      if (channel === "instagram") {
        setInstagramInbox((current) => ({
          ...current,
          threads: current.threads.map((item) =>
            item.id === thread.id
              ? {
                  ...item,
                  updatedAt: sentMessage.createdAt,
                  messages: [...item.messages, sentMessage],
                }
              : item,
          ),
        }));
        setInstagramDraft("");
      } else {
        setFacebookInbox((current) => ({
          ...current,
          threads: current.threads.map((item) =>
            item.id === thread.id
              ? {
                  ...item,
                  updatedAt: sentMessage.createdAt,
                  messages: [...item.messages, sentMessage],
                }
              : item,
          ),
        }));
        setFacebookDraft("");
      }

      setLastInboxSendAt(payload.sentAt || new Date().toISOString());
      toast.success(payload.confirmation || "Message sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message send failed.");
    } finally {
      setSendingChannel(null);
    }
  }

  async function handleSendWhatsApp() {
    if (!userId) {
      toast.error("Please sign in before sending WhatsApp messages.");
      return;
    }
    if (!whatsAppPhone.trim() || !whatsAppMessage.trim()) {
      toast.error("Enter both a phone number and a message.");
      return;
    }

    setSendingWhatsApp(true);
    try {
      const response = await fetch("/api/meta/review/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          phone: whatsAppPhone,
          message: whatsAppMessage,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "WhatsApp send failed.");

      setWhatsAppConfirmation(payload.confirmation || "WhatsApp message sent successfully.");
      setWhatsAppHistory(payload.history || []);
      setLastWhatsAppSendAt(payload.sentAt || new Date().toISOString());
      setWhatsAppMessage("");
      toast.success(payload.confirmation || "WhatsApp message sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "WhatsApp send failed.");
    } finally {
      setSendingWhatsApp(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={14} />
              Meta App Review Workspace
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Existing integrations flow, optimized for human reviewers
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                This screen keeps every requested permission visible, interactive, and easy to record:
                Facebook Login, Page selection, Page metadata, Instagram media, messaging inboxes, and WhatsApp sending.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {requestedPermissions.map((permission) => (
                <PermissionChip key={permission} permission={permission} />
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck size={16} />
                  Secure token storage
                </div>
                <p className="text-sm text-slate-600">{overview?.secureStorageLabel || "Access tokens stay on the server."}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <BookOpen size={16} />
                  Reviewer instructions
                </div>
                <p className="text-sm text-slate-600">
                  Use the dedicated reviewer route for a step-by-step walkthrough that matches this UI exactly.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Review Mode</div>
                <div className="text-xs text-slate-500">Shows the approval path step-by-step.</div>
              </div>
              <button
                type="button"
                onClick={() => setReviewMode((value) => !value)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
              >
                {reviewMode ? <ToggleRight className="text-blue-600" /> : <ToggleLeft className="text-slate-400" />}
                {reviewMode ? "On" : "Off"}
              </button>
            </div>

            <div className="grid gap-2">
              {steps.map((step) => (
                <StepPill key={step.label} status={step.status} label={step.label} />
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={handleConnect}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Connect Facebook & Instagram
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCw size={16} className={loadingOverview ? "animate-spin" : ""} />
                Refresh
              </button>
              <Link
                href="/review"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <ExternalLink size={16} />
                Open /review
              </Link>
            </div>

            {overview?.connected ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Connected via Facebook Login{overview.connectedAt ? ` • ${formatDateTime(overview.connectedAt)}` : ""}.
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Start with the <span className="font-semibold">Connect Facebook & Instagram</span> button so the reviewer sees the login step first.
              </div>
            )}
          </div>
        </div>
      </section>

      <SectionCard
        title="Step 1: Facebook Login"
        description="Login begins with a single Connect button that requests every permission needed for App Review. The resulting access token stays server-side."
        permissions={[
          "instagram_basic",
          "pages_show_list",
          "pages_manage_metadata",
          "pages_messaging",
          "instagram_manage_messages",
          "whatsapp_business_messaging",
        ]}
        reviewMode={reviewMode}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-2 text-sm font-semibold text-slate-900">Reviewer action</div>
            <p className="text-sm text-slate-600">
              Click <span className="font-semibold">Connect Facebook & Instagram</span>, accept the Facebook OAuth permission screen, and return here to continue.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-2 text-sm font-semibold text-slate-900">Expected result</div>
            <p className="text-sm text-slate-600">
              The Page list below becomes visible so the reviewer can pick the exact Facebook Page used during the demo.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Step 2: Select Page (pages_show_list)"
        description="The visible Page list comes directly from `/me/accounts`. The reviewer can see the Page name and Page ID before choosing one."
        permissions={["pages_show_list"]}
        reviewMode={reviewMode}
      >
        {loadingOverview ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            <Loader2 size={18} className="animate-spin" />
            Loading visible Facebook Pages…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3">
              {overview?.pages.length ? (
                overview.pages.map((page) => (
                  <label
                    key={page.id}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-4 transition ${
                      selectedPageId === page.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="selected-page"
                        checked={selectedPageId === page.id}
                        onChange={() => setSelectedPageId(page.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{page.name}</div>
                        <div className="text-xs text-slate-500">Page ID: {page.id}</div>
                        {page.category && <div className="mt-1 text-xs text-slate-500">Category: {page.category}</div>}
                      </div>
                    </div>
                    <PermissionChip permission="pages_show_list" />
                  </label>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No Pages are visible yet. Connect Meta first, then refresh this screen.
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePageSelection}
                disabled={selectingPage || !selectedPageId}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {selectingPage ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Use Selected Page
              </button>
              <div className="text-sm text-slate-500">
                Current selection:{" "}
                <span className="font-semibold text-slate-700">
                  {overview?.selectedPage?.name || "No Page selected yet"}
                </span>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Step 3: Connected Assets"
        description="After a Page is selected, this section reads Page metadata and the linked Instagram Business Account so the reviewer can verify the connected assets."
        permissions={["pages_manage_metadata", "instagram_basic"]}
        reviewMode={reviewMode}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Link2 size={16} />
              Connected Assets
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Facebook Page</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{overview?.selectedPage?.name || "Not selected yet"}</div>
                <div className="mt-1 text-xs text-slate-500">Page ID: {overview?.selectedPage?.id || "—"}</div>
                <div className="mt-1 text-xs text-slate-500">Category: {overview?.selectedPage?.category || "—"}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Linked Instagram Business Account</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{overview?.instagramAccount?.username || "Not linked yet"}</div>
                <div className="mt-1 text-xs text-slate-500">Instagram User ID: {overview?.instagramAccount?.id || "—"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ImageIcon size={16} />
              Instagram Profile + Media Grid
            </div>

            {overview?.instagramAccount ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">@{overview.instagramAccount.username || "instagram"}</div>
                  <div className="mt-1 text-xs text-slate-500">Instagram User ID: {overview.instagramAccount.id}</div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {overview.instagramMedia.map((item) => (
                    <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="aspect-square bg-slate-100">
                        {item.media_type === "VIDEO" ? (
                          <video
                            src={item.media_url || undefined}
                            poster={item.thumbnail_url || undefined}
                            controls
                            muted
                            className="h-full w-full object-cover"
                          />
                        ) : item.media_url || item.thumbnail_url ? (
                          <img
                            src={item.media_url || item.thumbnail_url || ""}
                            alt={item.caption || "Instagram media"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-slate-400">No media preview</div>
                        )}
                      </div>
                      <div className="space-y-2 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Caption</div>
                        <p className="text-sm text-slate-700">{truncate(item.caption, 120)}</p>
                        <div className="text-xs text-slate-500">Timestamp: {formatDateTime(item.timestamp)}</div>
                        {item.permalink && (
                          <a
                            href={item.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                          >
                            Open post
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                {overview.instagramMedia.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                    Instagram media will appear here once the selected Page has a linked Instagram Business Account with recent posts.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                Select a Page with a linked Instagram Business Account to load the Instagram username, user ID, and media grid.
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Step 4: Inbox"
        description="Both inbox panels are kept visible for review. The reviewer can inspect incoming messages, see sender names, type a reply, and send it from the same screen."
        permissions={["instagram_manage_messages", "pages_messaging"]}
        reviewMode={reviewMode}
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Inbox size={16} />
              Instagram Inbox
            </div>
            {loadingInstagramInbox ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                <Loader2 size={18} className="animate-spin" />
                Loading Instagram conversations…
              </div>
            ) : (
              <ConversationPanel
                title="Instagram Messages"
                subtitle="Shows incoming Instagram DMs and allows a visible reply."
                permission="instagram_manage_messages"
                threads={instagramInbox.threads}
                notes={instagramInbox.notes}
                activeThreadId={activeInstagramThreadId}
                onSelectThread={setActiveInstagramThreadId}
                draft={instagramDraft}
                onDraftChange={setInstagramDraft}
                onSend={(thread) => handleSendInboxReply("instagram", thread)}
                sending={sendingChannel === "instagram"}
              />
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MessageSquare size={16} />
              Facebook Page Inbox
            </div>
            {loadingFacebookInbox ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                <Loader2 size={18} className="animate-spin" />
                Loading Facebook Page conversations…
              </div>
            ) : (
              <ConversationPanel
                title="Facebook Page Messages"
                subtitle="Shows Page conversations and the reply box required for app review."
                permission="pages_messaging"
                threads={facebookInbox.threads}
                notes={facebookInbox.notes}
                activeThreadId={activeFacebookThreadId}
                onSelectThread={setActiveFacebookThreadId}
                draft={facebookDraft}
                onDraftChange={setFacebookDraft}
                onSend={(thread) => handleSendInboxReply("facebook", thread)}
                sending={sendingChannel === "facebook"}
              />
            )}
          </div>
        </div>

        {lastInboxSendAt && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Message send confirmed at {formatDateTime(lastInboxSendAt)}.
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Step 5: WhatsApp Business Messaging"
        description="This section provides the exact review action: enter a phone number, type a message, send it, and show the send confirmation plus recent history."
        permissions={["whatsapp_business_messaging"]}
        reviewMode={reviewMode}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">WhatsApp send form</div>
                <div className="text-xs text-slate-500">
                  Configured sender: {overview?.whatsapp.displayPhoneNumber || overview?.whatsapp.phoneNumberId || "Not configured"}
                </div>
              </div>
              <PermissionChip permission="whatsapp_business_messaging" />
            </div>

            {!overview?.whatsapp.configured && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Configure <code className="font-mono">META_WHATSAPP_PHONE_NUMBER_ID</code> and <code className="font-mono">META_WHATSAPP_ACCESS_TOKEN</code> to enable reviewer sends.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Destination phone number
                </label>
                <input
                  value={whatsAppPhone}
                  onChange={(event) => setWhatsAppPhone(event.target.value)}
                  placeholder="+15555550123"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  WhatsApp message
                </label>
                <textarea
                  value={whatsAppMessage}
                  onChange={(event) => setWhatsAppMessage(event.target.value)}
                  rows={4}
                  placeholder="Type the WhatsApp Business message the reviewer should send…"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={sendingWhatsApp || !overview?.whatsapp.configured}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingWhatsApp ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
                Send WhatsApp Message
              </button>

              <button
                type="button"
                onClick={() => userId && loadWhatsAppHistory(userId, whatsAppPhone)}
                disabled={loadingWhatsAppHistory || !whatsAppPhone.trim()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingWhatsAppHistory ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Load History
              </button>
            </div>

            {whatsAppConfirmation && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {whatsAppConfirmation}
                {lastWhatsAppSendAt ? ` • ${formatDateTime(lastWhatsAppSendAt)}` : ""}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">WhatsApp history</div>
              <div className="text-xs text-slate-500">Shows recent messages for the phone number entered above.</div>
            </div>
            <div className="space-y-3 p-4">
              {whatsAppHistory.length > 0 ? (
                whatsAppHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      item.direction === "incoming"
                        ? "border border-slate-200 bg-slate-50 text-slate-800"
                        : "bg-slate-900 text-white"
                    }`}
                  >
                    <div className="mb-1 text-[11px] font-semibold opacity-70">
                      {item.direction === "incoming" ? "Incoming" : "Outgoing"}
                    </div>
                    <div>{item.text}</div>
                    <div className="mt-2 text-[11px] opacity-60">{formatDateTime(item.createdAt)}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Load history or send a message to show reviewer-visible WhatsApp activity here.
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {(overview?.notes.length || instagramInbox.notes.length || facebookInbox.notes.length) ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Info size={18} />
            Review Notes
          </div>
          <div className="space-y-3">
            {overview?.notes.map((note) => (
              <div key={`overview-${note}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {note}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <BookOpen size={18} />
          Screen Recording Flow
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            "1. Click Connect",
            "2. Accept Facebook permissions",
            "3. Show the visible Page list",
            "4. Select the Page",
            "5. Show Instagram profile + media",
            "6. Open Instagram and Facebook inbox panels",
            "7. Send an inbox reply",
            "8. Send a WhatsApp message",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              {item}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/review"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Open reviewer checklist
            <ExternalLink size={16} />
          </Link>
          <a
            href="/dashboard/inbox"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Open existing inbox route
            <ArrowRight size={16} />
          </a>
        </div>
      </section>
    </div>
  );
}
