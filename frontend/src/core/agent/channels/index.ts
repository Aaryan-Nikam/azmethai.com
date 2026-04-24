export interface NormalizedPayload {
  message_id: string;
  lead_id: string;
  content: string;
  timestamp?: number;
  raw?: any;
}

export interface ChannelAdapter {
  name: "instagram" | "facebook" | "whatsapp" | "linkedin" | "website" | "unknown";
  
  /** Extracts standardized message data from the platform's raw webhook body. */
  parsePayload(rawBody: any): NormalizedPayload[];
  
  /** Sends a message back to the user via the platform's API */
  sendMessage(
    accessToken: string,
    senderAccountId: string,
    recipientId: string,
    content: string
  ): Promise<void>;
}
