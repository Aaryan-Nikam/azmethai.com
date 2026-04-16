import { ChannelAdapter, NormalizedPayload } from "./index";

// For Website Chat, we typically use WebSockets (Pusher/Supabase Realtime) rather than Webhooks
// But for REST-based push architecture:
export const WebsiteAdapter: ChannelAdapter = {
  name: "website",

  parsePayload(rawBody: any): NormalizedPayload[] {
    const payloads: NormalizedPayload[] = [];
    
    if (rawBody.message && rawBody.session_id) {
        payloads.push({
            message_id: rawBody.message_id || `web-${Date.now()}`,
            lead_id: rawBody.session_id,
            content: rawBody.message,
            raw: rawBody
        });
    }

    return payloads;
  },

  async sendMessage(token: string, senderAccountId: string, recipientId: string, text: string) {
    // Directly push into a Supabase table that the website widget listens to via Realtime
    // OR trigger a Pusher event
    // For this boilerplate, we'll assume we hit an internal websocket or database insertion:
    
    // We expect the 'token' to be a supabase JWT or similar, but typically the backend
    // just writes to the database natively when the engine runs.
    console.log(`[Website Widget] Pushing message to session ${recipientId}: ${text}`);
    
    // Stub definition (Normally you do `supabase.from('chat_messages').insert(...)`)
  }
};
