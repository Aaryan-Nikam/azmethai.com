import { ChannelAdapter, NormalizedPayload } from "./index";

export const MetaAdapter: ChannelAdapter = {
  name: "instagram", // We override this dynamically if FB, but default to IG

  parsePayload(rawBody: any): NormalizedPayload[] {
    const payloads: NormalizedPayload[] = [];
    
    if (rawBody.object === "page" || rawBody.object === "instagram") {
      for (const entry of rawBody.entry ?? []) {
        
        // Format A — Messenger Platform (Facebook Messenger + Instagram via Messenger API)
        for (const event of entry.messaging ?? []) {
          if (event.message?.is_echo) continue;
          
          const leadId = String(event.sender?.id ?? "");
          const messageId = String(event.message?.mid ?? "");
          const text = String(event.message?.text || "[Media]");
          
          if (!leadId || !messageId) continue;
          
          payloads.push({
            message_id: messageId,
            lead_id: leadId,
            content: text,
            raw: event
          });
        }

        // Format B — Instagram Graph API webhook (Newer IG DMs)
        for (const change of entry.changes ?? []) {
          if (change.field !== "messages") continue;
          const val = change.value ?? {};
          const leadId = String(val.from?.id || val.sender?.id || "");
          const messageId = String(val.id || val.mid || "");
          const text = String(val.text || val.message?.text || "[Media]");
          
          if (!leadId || !messageId) continue;
          
          payloads.push({
            message_id: messageId,
            lead_id: leadId,
            content: text,
            raw: val
          });
        }
      }
    }
    
    return payloads;
  },

  async sendMessage(token: string, senderAccountId: string, recipientId: string, text: string) {
    // Determine the base URL based on token vs Meta setup
    const isIGToken = token.startsWith("IG");
    const baseUrl = isIGToken
      ? `https://graph.instagram.com/v21.0/${senderAccountId}/messages`
      : `https://graph.facebook.com/v21.0/${senderAccountId}/messages`;

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Meta API Egress Error (${response.status}): ${errorBody}`);
    }
  }
};
