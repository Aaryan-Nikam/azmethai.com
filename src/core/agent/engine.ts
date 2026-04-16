import { createClient, SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { getMemoryWithinBudget, storeMessages } from "./memory";
import { MetaAdapter } from "./channels/meta";
import { WhatsAppAdapter } from "./channels/whatsapp";
import { LinkedInAdapter } from "./channels/linkedin";
import { WebsiteAdapter } from "./channels/website";

function getAdapter(platform: string) {
  switch (platform) {
    case "facebook":
    case "instagram": return MetaAdapter;
    case "whatsapp": return WhatsAppAdapter;
    case "linkedin": return LinkedInAdapter;
    case "website": return WebsiteAdapter;
    default: return null;
  }
}

export interface WebhookQueueRow {
  id: string;
  message_id: string;
  platform: 'facebook' | 'instagram' | 'whatsapp';
  page_id: string;
  lead_id: string;
  raw_payload: any;
}

/**
 * Core processor for an individual webhook job pulled from the queue.
 */
export async function processWebhookJob(
  supabase: SupabaseClient, 
  job: WebhookQueueRow
): Promise<void> {
  try {
    // Wait to initialize OpenAI after we fetch agent tenant data

    // 1. Tenant Lookup — try page_id directly first, then fallback search
    // Meta sends different IDs depending on format:
    // - Facebook Page ID (1036420716222686) for Messenger/Page webhooks
    // - Instagram Business Account ID (17841476008226882) for Instagram webhooks
    let connection: { user_id: string; access_token: string } | null = null;

    const { data: directMatch } = await supabase
      .from("platform_connections")
      .select("user_id, access_token, page_id")
      .eq("page_id", job.page_id)
      .maybeSingle();

    if (directMatch) {
      connection = directMatch;
    } else {
      // Fallback: find any active instagram connection for this tenant
      const { data: fallback } = await supabase
        .from("platform_connections")
        .select("user_id, access_token, page_id")
        .eq("platform", job.platform)
        .maybeSingle();
      connection = fallback;
    }

    if (!connection) {
      throw new Error(`No active tenant connection found for page_id: ${job.page_id} and platform: ${job.platform}`);
    }

    const { user_id, access_token, page_id: senderAccountId } = connection;

    // 2. Agent Config Lookup (Context)
    const { data: agentData } = await supabase
      .from("sales_agents")
      .select("business_name, business_description, brand_voice, knowledge_base, provider_api_key, llm_billing_mode")
      .eq("user_id", user_id)
      .single();

    const apiKey = agentData?.llm_billing_mode === 'custom' && agentData?.provider_api_key 
      ? agentData.provider_api_key 
      : process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error("No LLM API key available for this tenant.");

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are a helpful AI assistant for ${agentData?.business_name || "a business"}.
Brand Voice: ${agentData?.brand_voice || "friendly"}
Business Context: ${agentData?.business_description || "Help users with their inquiries."}
Knowledge Base: ${agentData?.knowledge_base || "N/A"}`;

    // 3. Memory Setup
    const history = await getMemoryWithinBudget(supabase, job.lead_id, 2000);
    const userMessageContent = job.raw_payload.message?.text || "[Media/Attachment]";
    
    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessageContent }
    ];

    // 4. LLM Race Condition (prevent stalling on Edge)
    const aiReply = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 300
      }).then(res => res.choices[0].message.content || "I'm sorry, I couldn't process that."),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("LLM timeout")), 25000)
      )
    ]);

    // 5. Store + Send Atomically
    // In Edge we await Promise.all
    await Promise.all([
      storeMessages(supabase, user_id, job.platform, job.lead_id, userMessageContent, aiReply),
      getAdapter(job.platform)?.sendMessage(access_token, senderAccountId, job.lead_id, aiReply)
    ]);

    // Mark successful
    await supabase.from("webhook_queue").update({ 
      status: "done", 
      processed_at: new Date().toISOString() 
    }).eq("id", job.id);

  } catch (err: any) {
    console.error(`Failed to process job ${job.id}:`, err);
    // Mark failed and log error
    await supabase.from("webhook_queue").update({ 
      status: "failed", 
      error_log: err.message,
      processed_at: new Date().toISOString() 
    }).eq("id", job.id);
  }
}
