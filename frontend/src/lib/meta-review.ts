import { createServerClient } from "@/lib/supabase";

export const META_REVIEW_PERMISSIONS = [
  "instagram_basic",
  "pages_show_list",
  "pages_manage_metadata",
  "pages_messaging",
  "instagram_manage_messages",
  "whatsapp_business_messaging",
] as const;

export type ReviewChannel = "facebook" | "instagram";

export interface MetaReviewPage {
  id: string;
  name: string;
  category: string | null;
  instagram_business_account?: MetaInstagramAccount | null;
}

export interface MetaInstagramAccount {
  id: string;
  username: string | null;
  profile_picture_url?: string | null;
}

export interface MetaInstagramMediaItem {
  id: string;
  caption: string | null;
  media_type: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  timestamp: string | null;
  permalink: string | null;
}

export interface ReviewMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: string | null;
  direction: "incoming" | "outgoing";
}

export interface ReviewConversationThread {
  id: string;
  channel: ReviewChannel;
  senderId: string;
  senderName: string;
  updatedAt: string | null;
  messages: ReviewMessage[];
}

export interface MetaReviewOverview {
  connected: boolean;
  connectionSource: string | null;
  connectedAt: string | null;
  requestedPermissions: readonly string[];
  secureStorageLabel: string;
  pages: MetaReviewPage[];
  selectedPageId: string | null;
  selectedPage: MetaReviewPage | null;
  instagramAccount: MetaInstagramAccount | null;
  instagramMedia: MetaInstagramMediaItem[];
  whatsapp: {
    configured: boolean;
    phoneNumberId: string | null;
    displayPhoneNumber: string | null;
    configSource: string | null;
  };
  notes: string[];
}

interface PlatformConnectionRow {
  user_id: string;
  platform: string;
  account_name: string | null;
  page_id: string | null;
  access_token: string | null;
  is_active: boolean | null;
  metadata: unknown;
  updated_at: string | null;
}

interface MetaPageAccountResponse extends MetaReviewPage {
  access_token?: string | null;
}

interface GraphCollection<T> {
  data?: T[];
}

interface PageConversationResponse {
  data?: Array<{
    id?: string;
    updated_time?: string;
    participants?: GraphCollection<{ id?: string; name?: string; username?: string }>;
    senders?: GraphCollection<{ id?: string; name?: string; username?: string }>;
    messages?: GraphCollection<{
      id?: string;
      created_time?: string;
      message?: string;
      from?: { id?: string; name?: string; username?: string };
      to?: GraphCollection<{ id?: string; name?: string; username?: string }>;
    }>;
  }>;
}

interface InstagramConversationListResponse {
  data?: Array<{
    id?: string;
    updated_time?: string;
  }>;
}

interface InstagramConversationMessagesResponse {
  id?: string;
  messages?: GraphCollection<{
    id?: string;
    created_time?: string;
  }>;
}

interface InstagramConversationMessageDetail {
  id?: string;
  created_time?: string;
  message?: string;
  from?: { id?: string; username?: string; name?: string };
  to?: GraphCollection<{ id?: string; username?: string; name?: string }>;
}

const META_GRAPH_VERSION = process.env.META_API_VERSION || "v21.0";
const WHATSAPP_PHONE_NUMBER_ID =
  process.env.META_WHATSAPP_PHONE_NUMBER_ID ||
  process.env.WHATSAPP_PHONE_NUMBER_ID ||
  process.env.NEXT_PUBLIC_META_WHATSAPP_PHONE_NUMBER_ID ||
  null;
const WHATSAPP_ACCESS_TOKEN =
  process.env.META_WHATSAPP_ACCESS_TOKEN ||
  process.env.WHATSAPP_ACCESS_TOKEN ||
  null;
const WHATSAPP_DISPLAY_PHONE_NUMBER =
  process.env.META_WHATSAPP_DISPLAY_PHONE_NUMBER ||
  process.env.WHATSAPP_DISPLAY_PHONE_NUMBER ||
  null;

function toRecord(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function safeTimestamp(value: unknown): string | null {
  const text = toStringOrNull(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString();
}

async function metaGet<T>(
  host: "facebook" | "instagram",
  path: string,
  accessToken: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const url = new URL(
    `https://${host === "instagram" ? "graph.instagram.com" : "graph.facebook.com"}/${META_GRAPH_VERSION}${path.startsWith("/") ? path : `/${path}`}`,
  );

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString(), { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || (payload && typeof payload === "object" && "error" in payload)) {
    const errorMessage =
      typeof payload === "object" && payload && "error" in payload
        ? toStringOrNull((payload as { error?: { message?: string } }).error?.message)
        : null;
    throw new Error(errorMessage || `Meta request failed (${response.status})`);
  }

  return payload as T;
}

async function metaPost<T>(
  host: "facebook" | "instagram",
  path: string,
  accessToken: string,
  body: Record<string, unknown>,
  options?: { bearer?: boolean },
): Promise<T> {
  const url = new URL(
    `https://${host === "instagram" ? "graph.instagram.com" : "graph.facebook.com"}/${META_GRAPH_VERSION}${path.startsWith("/") ? path : `/${path}`}`,
  );

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options?.bearer) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else {
    url.searchParams.set("access_token", accessToken);
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || (payload && typeof payload === "object" && "error" in payload)) {
    const errorMessage =
      typeof payload === "object" && payload && "error" in payload
        ? toStringOrNull((payload as { error?: { message?: string } }).error?.message)
        : null;
    throw new Error(errorMessage || `Meta request failed (${response.status})`);
  }

  return payload as T;
}

async function getPlatformConnections(userId: string): Promise<PlatformConnectionRow[]> {
  const db = createServerClient();
  const { data, error } = await db
    .from("platform_connections")
    .select("user_id, platform, account_name, page_id, access_token, is_active, metadata, updated_at")
    .eq("user_id", userId)
    .in("platform", ["meta", "facebook", "instagram", "whatsapp"]);

  if (error) throw new Error(error.message);
  return (data || []) as PlatformConnectionRow[];
}

function findPlatformConnection(rows: PlatformConnectionRow[], platform: string): PlatformConnectionRow | null {
  return rows.find((row) => row.platform === platform) || null;
}

function resolveMetaUserToken(rows: PlatformConnectionRow[]): string | null {
  const metaRow = findPlatformConnection(rows, "meta");
  if (metaRow?.access_token) return metaRow.access_token;

  const legacyRow = rows.find(
    (row) =>
      (row.platform === "facebook" || row.platform === "instagram") &&
      !row.page_id &&
      row.access_token,
  );
  return legacyRow?.access_token || null;
}

async function listManagedPages(accessToken: string): Promise<MetaPageAccountResponse[]> {
  const response = await metaGet<GraphCollection<MetaPageAccountResponse>>(
    "facebook",
    "/me/accounts",
    accessToken,
    {
      fields: "id,name,category,access_token,instagram_business_account{id,username,profile_picture_url}",
    },
  );

  return (response.data || []).map((page) => ({
    id: page.id,
    name: page.name,
    category: page.category || null,
    access_token: page.access_token || null,
    instagram_business_account: page.instagram_business_account
      ? {
          id: page.instagram_business_account.id,
          username: page.instagram_business_account.username || null,
          profile_picture_url: page.instagram_business_account.profile_picture_url || null,
        }
      : null,
  }));
}

async function fetchPageMetadata(pageId: string, accessToken: string): Promise<MetaReviewPage> {
  const page = await metaGet<MetaPageAccountResponse>("facebook", `/${pageId}`, accessToken, {
    fields: "id,name,category,instagram_business_account{id,username,profile_picture_url}",
  });

  return {
    id: page.id,
    name: page.name,
    category: page.category || null,
    instagram_business_account: page.instagram_business_account
      ? {
          id: page.instagram_business_account.id,
          username: page.instagram_business_account.username || null,
          profile_picture_url: page.instagram_business_account.profile_picture_url || null,
        }
      : null,
  };
}

async function fetchInstagramMedia(
  instagramAccountId: string,
  accessToken: string,
): Promise<MetaInstagramMediaItem[]> {
  const response = await metaGet<GraphCollection<MetaInstagramMediaItem>>(
    "facebook",
    `/${instagramAccountId}/media`,
    accessToken,
    {
      fields: "id,caption,media_type,media_url,thumbnail_url,timestamp,permalink",
      limit: 6,
    },
  );

  return (response.data || []).map((item) => ({
    id: item.id,
    caption: item.caption || null,
    media_type: item.media_type || null,
    media_url: item.media_url || null,
    thumbnail_url: item.thumbnail_url || null,
    timestamp: safeTimestamp(item.timestamp),
    permalink: item.permalink || null,
  }));
}

function normalizeConversationMessages(
  rawMessages: Array<{
    id?: string;
    created_time?: string;
    message?: string;
    from?: { id?: string; name?: string; username?: string };
  }>,
  ownerIds: string[],
): ReviewMessage[] {
  return rawMessages
    .filter((message) => toStringOrNull(message.message))
    .map((message) => {
      const senderId = message.from?.id || "unknown";
      const senderName = message.from?.name || message.from?.username || senderId;
      const direction: ReviewMessage["direction"] = ownerIds.includes(senderId) ? "outgoing" : "incoming";
      return {
        id: message.id || `${senderId}-${message.created_time || Date.now()}`,
        text: message.message || "",
        senderId,
        senderName,
        createdAt: safeTimestamp(message.created_time),
        direction,
      };
    })
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return leftTime - rightTime;
    });
}

function normalizePageConversationThreads(
  data: PageConversationResponse["data"],
  channel: ReviewChannel,
  ownerIds: string[],
): ReviewConversationThread[] {
  return (data || [])
    .map((thread) => {
      const messages = normalizeConversationMessages(
        toArray(thread.messages?.data),
        ownerIds,
      );
      const otherParticipant =
        toArray<{ id?: string; name?: string; username?: string }>(thread.participants?.data).find(
          (participant) => participant.id && !ownerIds.includes(participant.id),
        ) ||
        toArray<{ id?: string; name?: string; username?: string }>(thread.senders?.data).find(
          (participant) => participant.id && !ownerIds.includes(participant.id),
        );
      const firstIncoming = messages.find((message) => message.direction === "incoming");

      const senderId = otherParticipant?.id || firstIncoming?.senderId || "unknown";
      const senderName =
        otherParticipant?.name ||
        otherParticipant?.username ||
        firstIncoming?.senderName ||
        senderId;

      return {
        id: thread.id || `${channel}-${senderId}`,
        channel,
        senderId,
        senderName,
        updatedAt: safeTimestamp(thread.updated_time) || messages[messages.length - 1]?.createdAt || null,
        messages,
      };
    })
    .filter((thread) => thread.messages.length > 0)
    .sort((left, right) => {
      const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
      const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
      return rightTime - leftTime;
    });
}

async function fetchFacebookInbox(pageId: string, accessToken: string): Promise<ReviewConversationThread[]> {
  const primaryQuery = async () =>
    metaGet<PageConversationResponse>("facebook", `/${pageId}/conversations`, accessToken, {
      fields: "id,updated_time,participants.limit(10){id,name},messages.limit(25){id,message,created_time,from,to}",
      limit: 10,
    });

  const fallbackQuery = async () =>
    metaGet<PageConversationResponse>("facebook", `/${pageId}/conversations`, accessToken, {
      fields: "id,updated_time,senders.limit(10){id,name},messages.limit(25){id,message,created_time,from,to}",
      limit: 10,
    });

  try {
    const response = await primaryQuery();
    return normalizePageConversationThreads(response.data, "facebook", [pageId]);
  } catch {
    const response = await fallbackQuery();
    return normalizePageConversationThreads(response.data, "facebook", [pageId]);
  }
}

async function fetchInstagramInboxFromFacebookGraph(
  pageId: string,
  instagramAccountId: string,
  accessToken: string,
): Promise<ReviewConversationThread[]> {
  const response = await metaGet<PageConversationResponse>(
    "facebook",
    `/${pageId}/conversations`,
    accessToken,
    {
      platform: "instagram",
      fields: "id,updated_time,participants.limit(10){id,name,username},messages.limit(25){id,message,created_time,from,to}",
      limit: 10,
    },
  );

  return normalizePageConversationThreads(response.data, "instagram", [pageId, instagramAccountId]);
}

async function fetchInstagramInboxFromInstagramGraph(
  accessToken: string,
  instagramAccountId: string,
): Promise<ReviewConversationThread[]> {
  const conversations = await metaGet<InstagramConversationListResponse>(
    "instagram",
    "/me/conversations",
    accessToken,
    {
      platform: "instagram",
    },
  );

  const threads = await Promise.all(
    (conversations.data || []).slice(0, 10).map(async (conversation) => {
      if (!conversation.id) return null;

      const details = await metaGet<InstagramConversationMessagesResponse>(
        "instagram",
        `/${conversation.id}`,
        accessToken,
        {
          fields: "messages",
        },
      );
      const messageIds = toArray<{ id?: string; created_time?: string }>(details.messages?.data)
        .map((message) => toStringOrNull(message.id))
        .filter((value): value is string => Boolean(value))
        .slice(-10);

      const messages = await Promise.all(
        messageIds.map(async (messageId) =>
          metaGet<InstagramConversationMessageDetail>("instagram", `/${messageId}`, accessToken, {
            fields: "id,created_time,from,to,message",
          }),
        ),
      );

      const normalizedMessages = normalizeConversationMessages(
        messages.map((message) => ({
          id: message.id,
          created_time: message.created_time,
          message: message.message,
          from: {
            id: message.from?.id,
            name: message.from?.name,
            username: message.from?.username,
          },
        })),
        [instagramAccountId],
      );

      if (normalizedMessages.length === 0) return null;

      const firstIncoming = normalizedMessages.find((message) => message.direction === "incoming");

      return {
        id: conversation.id,
        channel: "instagram" as const,
        senderId: firstIncoming?.senderId || "unknown",
        senderName: firstIncoming?.senderName || firstIncoming?.senderId || "Unknown Instagram User",
        updatedAt: safeTimestamp(conversation.updated_time) || normalizedMessages[normalizedMessages.length - 1]?.createdAt || null,
        messages: normalizedMessages,
      };
    }),
  );

  return threads.filter(Boolean) as ReviewConversationThread[];
}

async function recordManualMessage(
  channel: "facebook" | "instagram" | "whatsapp",
  recipientId: string,
  recipientName: string,
  message: string,
) {
  const db = createServerClient();
  const sessionId = `${channel}_${recipientId}`;
  const now = new Date().toISOString();

  await db.from("n8n_chat_histories").insert({
    session_id: sessionId,
    message: {
      type: "human",
      content: message,
      additional_kwargs: {
        manual: true,
        source: "meta_review",
        channel,
      },
      response_metadata: {},
    },
  });

  await db.from("chat_leads").upsert(
    {
      lead_id: sessionId,
      channel,
      sender_name: recipientName || recipientId,
      sender_contact: recipientId,
      latest_score: 0,
      last_intent: "manual_review_reply",
      paused: true,
      last_seen: now,
      status: "contacted",
      agent_name: "Meta Review Console",
      starred: false,
      company_name: null,
      role_title: null,
    },
    { onConflict: "lead_id" },
  );
}

async function getWhatsAppHistoryByPhone(phone: string) {
  const db = createServerClient();
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return [];

  const { data, error } = await db
    .from("n8n_chat_histories")
    .select("id, session_id, message")
    .eq("session_id", `whatsapp_${normalizedPhone}`)
    .order("id", { ascending: true })
    .limit(50);

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => {
    const messagePayload = toRecord(row.message);
    const direction: "incoming" | "outgoing" = messagePayload.type === "ai" ? "incoming" : "outgoing";
    return {
      id: String(row.id),
      text: toStringOrNull(messagePayload.content) || "",
      direction,
      createdAt: nowFromId(row.id),
    };
  });
}

function nowFromId(value: unknown): string | null {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return new Date().toISOString();
}

function resolveWhatsAppConfig(rows: PlatformConnectionRow[]) {
  const whatsappRow = findPlatformConnection(rows, "whatsapp");
  const whatsappMeta = toRecord(whatsappRow?.metadata);

  const phoneNumberId =
    WHATSAPP_PHONE_NUMBER_ID ||
    toStringOrNull(whatsappMeta.phone_number_id) ||
    whatsappRow?.page_id ||
    null;
  const accessToken =
    WHATSAPP_ACCESS_TOKEN ||
    whatsappRow?.access_token ||
    resolveMetaUserToken(rows);
  const displayPhoneNumber =
    WHATSAPP_DISPLAY_PHONE_NUMBER ||
    toStringOrNull(whatsappMeta.display_phone_number) ||
    whatsappRow?.account_name ||
    null;
  const configSource = WHATSAPP_PHONE_NUMBER_ID
    ? "environment"
    : whatsappRow?.page_id
      ? "stored_connection"
      : null;

  return {
    configured: Boolean(phoneNumberId && accessToken),
    phoneNumberId,
    accessToken,
    displayPhoneNumber,
    configSource,
  };
}

async function resolveSelectedPageContext(userId: string) {
  const rows = await getPlatformConnections(userId);
  const metaRow = findPlatformConnection(rows, "meta");
  const facebookRow = findPlatformConnection(rows, "facebook");
  const instagramRow = findPlatformConnection(rows, "instagram");
  const metaMetadata = toRecord(metaRow?.metadata);
  const userToken = resolveMetaUserToken(rows);
  const selectedPageId =
    toStringOrNull(metaMetadata.selected_page_id) ||
    facebookRow?.page_id ||
    null;

  const pages = userToken ? await listManagedPages(userToken) : [];
  const selectedPageFromList = selectedPageId
    ? pages.find((page) => page.id === selectedPageId) || null
    : null;

  const pageToken = selectedPageFromList?.access_token || facebookRow?.access_token || null;
  const pageMetadata = selectedPageId && pageToken
    ? await fetchPageMetadata(selectedPageId, pageToken)
    : selectedPageFromList
      ? {
          id: selectedPageFromList.id,
          name: selectedPageFromList.name,
          category: selectedPageFromList.category || null,
          instagram_business_account: selectedPageFromList.instagram_business_account || null,
        }
      : null;
  const instagramAccount =
    pageMetadata?.instagram_business_account ||
    (instagramRow?.page_id
      ? {
          id: instagramRow.page_id,
          username: instagramRow.account_name,
          profile_picture_url: null,
        }
      : null);

  return {
    rows,
    metaRow,
    facebookRow,
    instagramRow,
    userToken,
    pages,
    selectedPageId,
    pageToken,
    pageMetadata,
    instagramAccount,
  };
}

export async function getMetaReviewOverview(userId: string): Promise<MetaReviewOverview> {
  const baseOverview: MetaReviewOverview = {
    connected: false,
    connectionSource: null,
    connectedAt: null,
    requestedPermissions: META_REVIEW_PERMISSIONS,
    secureStorageLabel: "Access tokens are stored server-side only and never exposed in the browser UI.",
    pages: [],
    selectedPageId: null,
    selectedPage: null,
    instagramAccount: null,
    instagramMedia: [],
    whatsapp: {
      configured: false,
      phoneNumberId: null,
      displayPhoneNumber: null,
      configSource: null,
    },
    notes: [],
  };

  const rows = await getPlatformConnections(userId);
  const metaRow = findPlatformConnection(rows, "meta");
  const userToken = resolveMetaUserToken(rows);
  const whatsappConfig = resolveWhatsAppConfig(rows);

  baseOverview.connected = Boolean(userToken);
  baseOverview.connectionSource = metaRow?.platform || (userToken ? "legacy_connection" : null);
  baseOverview.connectedAt = metaRow?.updated_at || null;
  baseOverview.whatsapp = {
    configured: whatsappConfig.configured,
    phoneNumberId: whatsappConfig.phoneNumberId,
    displayPhoneNumber: whatsappConfig.displayPhoneNumber,
    configSource: whatsappConfig.configSource,
  };

  if (!userToken) {
    baseOverview.notes.push("Connect Facebook & Instagram to start the Meta App Review flow.");
    if (!whatsappConfig.configured) {
      baseOverview.notes.push("Set `META_WHATSAPP_PHONE_NUMBER_ID` and `META_WHATSAPP_ACCESS_TOKEN` to demo WhatsApp sends.");
    }
    return baseOverview;
  }

  try {
    const context = await resolveSelectedPageContext(userId);

    baseOverview.pages = context.pages.map((page) => ({
      id: page.id,
      name: page.name,
      category: page.category || null,
      instagram_business_account: page.instagram_business_account
        ? {
            id: page.instagram_business_account.id,
            username: page.instagram_business_account.username || null,
            profile_picture_url: page.instagram_business_account.profile_picture_url || null,
          }
        : null,
    }));
    baseOverview.selectedPageId = context.selectedPageId;
    baseOverview.selectedPage = context.pageMetadata;
    baseOverview.instagramAccount = context.instagramAccount;

    if (context.instagramAccount?.id && context.pageToken) {
      try {
        baseOverview.instagramMedia = await fetchInstagramMedia(
          context.instagramAccount.id,
          context.pageToken,
        );
        if (baseOverview.instagramMedia.length < 3) {
          baseOverview.notes.push(
            "The selected Instagram account currently returns fewer than 3 media items. Use a test account with 3+ posts for review recording.",
          );
        }
      } catch (error) {
        baseOverview.notes.push(
          error instanceof Error
            ? `Instagram media could not be loaded: ${error.message}`
            : "Instagram media could not be loaded.",
        );
      }
    } else if (context.selectedPageId) {
      baseOverview.notes.push("The selected Facebook Page does not currently expose a linked Instagram Business Account.");
    }
  } catch (error) {
    baseOverview.notes.push(
      error instanceof Error ? error.message : "Meta review data could not be loaded.",
    );
  }

  if (!whatsappConfig.configured) {
    baseOverview.notes.push("WhatsApp sending is disabled until a phone number ID and access token are configured.");
  }

  return baseOverview;
}

export async function selectMetaReviewPage(userId: string, pageId: string) {
  const db = createServerClient();
  const rows = await getPlatformConnections(userId);
  const metaRow = findPlatformConnection(rows, "meta");
  const metaMetadata = toRecord(metaRow?.metadata);
  const userToken = resolveMetaUserToken(rows);

  if (!userToken) {
    throw new Error("Meta account is not connected yet.");
  }

  const pages = await listManagedPages(userToken);
  const selectedPage = pages.find((page) => page.id === pageId);

  if (!selectedPage) {
    throw new Error("The selected Facebook Page was not returned by `/me/accounts`.");
  }

  const pageToken = selectedPage.access_token || findPlatformConnection(rows, "facebook")?.access_token;
  if (!pageToken) {
    throw new Error("A Page access token could not be resolved for the selected Page.");
  }

  const pageMetadata = await fetchPageMetadata(pageId, pageToken);
  const instagramAccount = pageMetadata.instagram_business_account || null;
  const now = new Date().toISOString();

  await db.from("platform_connections").upsert(
    [
      {
        user_id: userId,
        platform: "meta",
        account_name: metaRow?.account_name || "Meta Business Login",
        page_id: null,
        access_token: metaRow?.access_token || userToken,
        is_active: true,
        metadata: {
          ...metaMetadata,
          selected_page_id: pageMetadata.id,
          selected_page_name: pageMetadata.name,
          selected_page_category: pageMetadata.category,
          selected_instagram_account_id: instagramAccount?.id || null,
          selected_instagram_username: instagramAccount?.username || null,
          review_mode_enabled: true,
          requested_permissions: [...META_REVIEW_PERMISSIONS],
          page_selection_updated_at: now,
        },
        updated_at: now,
      },
      {
        user_id: userId,
        platform: "facebook",
        account_name: pageMetadata.name,
        page_id: pageMetadata.id,
        access_token: pageToken,
        is_active: true,
        metadata: {
          selected_via: "meta_review",
          page_category: pageMetadata.category,
          instagram_business_account_id: instagramAccount?.id || null,
          instagram_username: instagramAccount?.username || null,
          updated_at: now,
        },
        updated_at: now,
      },
      {
        user_id: userId,
        platform: "instagram",
        account_name: instagramAccount?.username || pageMetadata.name,
        page_id: instagramAccount?.id || null,
        access_token: instagramAccount?.id ? pageToken : null,
        is_active: Boolean(instagramAccount?.id),
        metadata: {
          selected_via: "meta_review",
          facebook_page_id: pageMetadata.id,
          facebook_page_name: pageMetadata.name,
          instagram_business_account_id: instagramAccount?.id || null,
          instagram_username: instagramAccount?.username || null,
          updated_at: now,
        },
        updated_at: now,
      },
    ],
    { onConflict: "user_id,platform" },
  );

  return getMetaReviewOverview(userId);
}

export async function getMetaReviewInbox(userId: string, channel: ReviewChannel) {
  const context = await resolveSelectedPageContext(userId);

  if (!context.selectedPageId || !context.pageToken) {
    return {
      threads: [] as ReviewConversationThread[],
      notes: ["Select a Facebook Page before opening the reviewer inbox."],
    };
  }

  try {
    if (channel === "facebook") {
      const threads = await fetchFacebookInbox(context.selectedPageId, context.pageToken);
      return {
        threads,
        notes:
          threads.length > 0
            ? []
            : ["No Facebook Page conversations were returned. Ask the reviewer to send a fresh message to the connected Page."],
      };
    }

    if (!context.instagramAccount?.id) {
      return {
        threads: [] as ReviewConversationThread[],
        notes: ["The selected Page does not have a linked Instagram Business Account."],
      };
    }

    try {
      const facebookGraphThreads = await fetchInstagramInboxFromFacebookGraph(
        context.selectedPageId,
        context.instagramAccount.id,
        context.pageToken,
      );
      if (facebookGraphThreads.length > 0) {
        return { threads: facebookGraphThreads, notes: [] };
      }
    } catch {
      // Fallback to Instagram Graph if Page conversations returns nothing.
    }

    try {
      const instagramGraphThreads = await fetchInstagramInboxFromInstagramGraph(
        context.pageToken,
        context.instagramAccount.id,
      );
      return {
        threads: instagramGraphThreads,
        notes:
          instagramGraphThreads.length > 0
            ? []
            : ["No Instagram conversations were returned. Ask the reviewer to send a fresh Instagram DM inside the 24-hour window."],
      };
    } catch (error) {
      return {
        threads: [] as ReviewConversationThread[],
        notes: [
          error instanceof Error
            ? error.message
            : "Instagram inbox data could not be loaded.",
        ],
      };
    }
  } catch (error) {
    return {
      threads: [] as ReviewConversationThread[],
      notes: [error instanceof Error ? error.message : "Inbox data could not be loaded."],
    };
  }
}

export async function sendMetaReviewReply(input: {
  userId: string;
  channel: ReviewChannel;
  recipientId: string;
  recipientName: string;
  message: string;
}) {
  const context = await resolveSelectedPageContext(input.userId);
  const text = input.message.trim();

  if (!text) throw new Error("A message body is required.");
  if (!input.recipientId) throw new Error("A recipient is required.");

  if (input.channel === "facebook") {
    if (!context.selectedPageId || !context.pageToken) {
      throw new Error("Select a Facebook Page before sending Page messages.");
    }

    await metaPost(
      "facebook",
      `/${context.selectedPageId}/messages`,
      context.pageToken,
      {
        messaging_type: "RESPONSE",
        recipient: { id: input.recipientId },
        message: { text },
      },
    );

    await recordManualMessage("facebook", input.recipientId, input.recipientName, text);
    return {
      ok: true,
      confirmation: "Facebook Page reply sent successfully.",
      sentAt: new Date().toISOString(),
    };
  }

  if (!context.instagramAccount?.id || !context.pageToken) {
    throw new Error("Select a Page with a linked Instagram Business Account before replying.");
  }

  const attempts: Array<() => Promise<unknown>> = [
    () =>
      metaPost(
        "facebook",
        `/${context.instagramAccount!.id}/messages`,
        context.pageToken!,
        {
          recipient: { id: input.recipientId },
          message: { text },
        },
      ),
    () =>
      metaPost(
        "instagram",
        `/${context.instagramAccount!.id}/messages`,
        context.pageToken!,
        {
          recipient: { id: input.recipientId },
          message: { text },
        },
      ),
  ];

  let lastError: Error | null = null;
  for (const attempt of attempts) {
    try {
      await attempt();
      lastError = null;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Instagram reply failed.");
    }
  }

  if (lastError) throw lastError;

  await recordManualMessage("instagram", input.recipientId, input.recipientName, text);
  return {
    ok: true,
    confirmation: "Instagram reply sent successfully.",
    sentAt: new Date().toISOString(),
  };
}

export async function getMetaReviewWhatsAppHistory(userId: string, phone: string) {
  const rows = await getPlatformConnections(userId);
  const config = resolveWhatsAppConfig(rows);

  return {
    configured: config.configured,
    phoneNumberId: config.phoneNumberId,
    displayPhoneNumber: config.displayPhoneNumber,
    configSource: config.configSource,
    history: await getWhatsAppHistoryByPhone(phone),
  };
}

export async function sendMetaReviewWhatsAppMessage(input: {
  userId: string;
  phone: string;
  message: string;
}) {
  const rows = await getPlatformConnections(input.userId);
  const config = resolveWhatsAppConfig(rows);
  const phone = normalizePhone(input.phone);
  const message = input.message.trim();

  if (!phone) throw new Error("A destination phone number is required.");
  if (!message) throw new Error("A WhatsApp message body is required.");
  if (!config.phoneNumberId || !config.accessToken) {
    throw new Error("WhatsApp is not configured. Set `META_WHATSAPP_PHONE_NUMBER_ID` and `META_WHATSAPP_ACCESS_TOKEN` first.");
  }

  await metaPost(
    "facebook",
    `/${config.phoneNumberId}/messages`,
    config.accessToken,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: {
        body: message,
      },
    },
    { bearer: true },
  );

  await recordManualMessage("whatsapp", phone, phone, message);

  return {
    ok: true,
    confirmation: "WhatsApp message sent successfully.",
    sentAt: new Date().toISOString(),
    history: await getWhatsAppHistoryByPhone(phone),
  };
}
