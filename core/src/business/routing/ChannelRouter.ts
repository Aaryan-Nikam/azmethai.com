import { createClient } from '@supabase/supabase-js'
import type { TurnInput } from '../types.js'

export interface InboundMessage {
  channel: 'whatsapp' | 'telegram' | 'slack' | 'discord' | 'signal' | 'imessage'
  from: string        // phone number, username, user ID — channel-specific
  tenant_domain: string  // how we know which company this is
  text: string
  session_id?: string
  metadata?: Record<string, any>
}

export class ChannelRouter {
  private supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  async resolve(msg: InboundMessage): Promise<TurnInput> {
    // Look up tenant by domain
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('domain', msg.tenant_domain)
      .single()

    if (!tenant) throw new Error(`No tenant found for domain: ${msg.tenant_domain}`)

    // Look up the role for this tenant + channel
    // One tenant can have multiple roles — route by channel or sender
    const { data: role } = await this.supabase
      .from('role_identities')
      .select('id')
      .eq('tenant_id', tenant.id)
      .limit(1)
      .single()

    if (!role) throw new Error(`No role configured for tenant: ${msg.tenant_domain}`)

    return {
      roleId: role.id,
      tenantId: tenant.id,
      sessionId: msg.session_id ?? `${msg.channel}-${msg.from}-${Date.now()}`,
      message: msg.text,
      channelMeta: { channel: msg.channel, from: msg.from, ...msg.metadata },
    }
  }
}
