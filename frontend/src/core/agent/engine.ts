import { createClient, SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { getMemoryWithinBudget, storeMessages } from "./memory";
import { MetaAdapter } from "./channels/meta";
import { WhatsAppAdapter } from "./channels/whatsapp";
import { LinkedInAdapter } from "./channels/linkedin";
import { WebsiteAdapter } from "./channels/website";
import { classifyIntent } from "@/lib/intent-classifier";
import { routeToAgent } from "@/lib/agent-router";

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
    let connection: { user_id: string; access_token: string; page_id: string } | null = null;

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
    // Use maybeSingle() so missing rows return null instead of throwing PGRST116
    const { data: agentData } = await supabase
      .from("sales_agents")
      .select("business_name, business_description, brand_voice, knowledge_base, system_prompt, provider_api_key, llm_billing_mode")
      .eq("user_id", user_id)
      .maybeSingle();

    const apiKey = agentData?.llm_billing_mode === 'custom' && agentData?.provider_api_key 
      ? agentData.provider_api_key 
      : process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error("No LLM API key available for this tenant.");

    const openai = new OpenAI({ apiKey });

    // 3. Routing & Intent Classification
    // Instagram Graph API wraps text differently than Messenger (entry.messaging format)
    // Support both: raw_payload.message.text (Messenger) and raw_payload.text (IG Graph API changes format)
    const userMessageContent: string =
      job.raw_payload?.message?.text ||
      job.raw_payload?.text ||
      job.raw_payload?.messages?.[0]?.text ||
      "[Media/Attachment]";
    const history = await getMemoryWithinBudget(supabase, job.lead_id, 2000);
    const contextWindow = history.map(m => String(m.content)).slice(-3); // Get last 3 for classification
    
    const { intent, confidence } = await classifyIntent(userMessageContent, contextWindow);
    const agent = await routeToAgent(intent, user_id, supabase);

    let model = "gpt-4o-mini";
    let temperature = 0.3;

    // Use the custom system_prompt from the setup wizard if configured,
    // otherwise fall back to a generated prompt from the individual config fields
    let systemPrompt = agentData?.system_prompt ||
      `You are a helpful AI assistant for ${agentData?.business_name || "a business"}.
Brand Voice: ${agentData?.brand_voice || "consultative"}
Business Context: ${agentData?.business_description || "Help users with their inquiries and qualify them as leads."}
Knowledge Base: ${agentData?.knowledge_base || "N/A"}`;

    if (agent && agent.system_prompt) {
      systemPrompt += `\n\n=== Agent Role (${agent.name} - Intent: ${intent}) ===\n${agent.system_prompt}`;
      model = agent.model || model;
      temperature = agent.temperature ?? temperature;
    }

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessageContent }
    ];

    // 4. LLM Race Condition (prevent stalling on Edge)
    const aiReply = await Promise.race([
      openai.chat.completions.create({
        model,
        messages,
        max_tokens: 300,
        temperature

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
