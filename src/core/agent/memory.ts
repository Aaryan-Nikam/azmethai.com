import { SupabaseClient } from "@supabase/supabase-js";

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

/**
 * Retrieves past messages from Supabase up to a given token budget constraint.
 * Avoids the "token bloat" problem on long conversations.
 */
export async function getMemoryWithinBudget(
  supabase: SupabaseClient,
  leadId: string,
  maxTokens: number = 2000
): Promise<ChatMessage[]> {
  // Pull last 50, then trim to token budget from most recent
  const { data, error } = await supabase
    .from("inbox_messages")
    .select("direction, content, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    console.error("Error fetching memory:", error);
    return [];
  }

  let tokenCount = 0;
  const result: ChatMessage[] = [];
  
  for (const msg of data) {
    const tokens = Math.ceil(msg.content.length / 4); // rough estimate
    if (tokenCount + tokens > maxTokens) break;
    tokenCount += tokens;
    
    result.unshift({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.content,
      created_at: msg.created_at
    });
  }
  
  return result;
}

/**
 * Persists the incoming message and outgoing AI reply into memory atomically
 */
export async function storeMessages(
  supabase: SupabaseClient,
  userId: string,
  platform: 'facebook' | 'instagram' | 'whatsapp',
  leadId: string,
  userMessage: string,
  aiReply: string
) {
  const insertPromises = [
    supabase.from("inbox_messages").insert({
      user_id: userId,
      platform,
      lead_id: leadId,
      direction: 'inbound',
      content: userMessage,
      ai_handled: true
    }),
    supabase.from("inbox_messages").insert({
      user_id: userId,
      platform,
      lead_id: leadId,
      direction: 'outbound',
      content: aiReply,
      ai_handled: true
    })
  ];

  await Promise.all(insertPromises);
}
