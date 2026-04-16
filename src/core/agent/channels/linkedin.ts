import { ChannelAdapter, NormalizedPayload } from "./index";

export const LinkedInAdapter: ChannelAdapter = {
  name: "linkedin",

  parsePayload(rawBody: any): NormalizedPayload[] {
    // LinkedIn Webhook parsing logic (Event Subscriptions for Organizations/Messaging)
    // Structure typically revolves around URNs: urn:li:member:1234
    const payloads: NormalizedPayload[] = [];
    
    if (rawBody.event && rawBody.event.message) {
        payloads.push({
            message_id: rawBody.event.message_id || `li-${Date.now()}`,
            lead_id: rawBody.event.sender_urn || "unknown",
            content: rawBody.event.message.text || "[Media]",
            raw: rawBody
        });
    }

    return payloads;
  },

  async sendMessage(token: string, senderAccountId: string, recipientId: string, text: string) {
    // LinkedIn API structure for sending messages via Organization URN
    const response = await fetch(
      `https://api.linkedin.com/rest/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "LinkedIn-Version": "2024-01"
        },
        body: JSON.stringify({
          sender: `urn:li:organization:${senderAccountId}`,
          recipients: [recipientId],
          message: { body: text },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`LinkedIn API Egress Error (${response.status}): ${errorBody}`);
    }
  }
};
