import { ChannelAdapter, NormalizedPayload } from "./index";

export const WhatsAppAdapter: ChannelAdapter = {
  name: "whatsapp",

  parsePayload(rawBody: any): NormalizedPayload[] {
    const payloads: NormalizedPayload[] = [];
    
    // WhatsApp Cloud API generic parsing structure
    const entries = rawBody.entry || [];
    for (const entry of entries) {
      for (const change of entry.changes || []) {
        if (change.value?.messages) {
          for (const message of change.value.messages) {
            payloads.push({
              message_id: message.id,
              lead_id: message.from,
              content: message.text?.body || "[Media/Interactive]",
              raw: message
            });
          }
        }
      }
    }
    return payloads;
  },

  async sendMessage(token: string, senderAccountId: string, recipientId: string, text: string) {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${senderAccountId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipientId,
          type: "text",
          text: { body: text },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`WhatsApp API Egress Error (${response.status}): ${errorBody}`);
    }
  }
};
