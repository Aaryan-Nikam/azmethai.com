// packages/extractor/src/tests/rls-isolation.test.ts
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll } from 'vitest';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const HAS_SUPABASE_TEST_CREDENTIALS = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY
);

// If a test CI provides dummy uuids:
const TENANT_A_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const KNOWN_DOC_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

if (!HAS_SUPABASE_TEST_CREDENTIALS) {
  console.warn('Skipping RLS tests due to missing Supabase credentials in env.');

  describe.skip('RLS tenant isolation', () => {
    it('requires Supabase credentials', () => {
      expect(true).toBe(true);
    });
  });
} else {
  describe('RLS tenant isolation', () => {
    // Set up mock auth clients bypassing traditional auth sign-in
    // By sending X-Tenant-ID header that matches the logic used if custom claims are set.
    const tenantAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { 'X-Tenant-ID': TENANT_A_ID } }
    });
    const tenantBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { 'X-Tenant-ID': TENANT_B_ID } }
    });

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    beforeAll(async () => {
      // Seed: Ensure tenants exist
      await serviceClient.from('ae_organisations').upsert({ id: TENANT_A_ID, name: 'Tenant A' });
      await serviceClient.from('ae_organisations').upsert({ id: TENANT_B_ID, name: 'Tenant B' });

      // Seed: insert a document for tenant A using service role
      await serviceClient.from('ae_documents').upsert({
        id: KNOWN_DOC_ID,
        tenant_id: TENANT_A_ID,
        storage_path: 'test.pdf',
        original_filename: 'test.pdf',
        doc_type: 'vendor_contract'
      });
    });

    it('tenant B cannot read tenant A documents', async () => {
      const { data } = await tenantBClient
        .from('ae_documents')
        .select('*')
        .eq('id', KNOWN_DOC_ID);

      expect(data).toHaveLength(0);
    });

    const tables = [
      'ae_extraction_jobs', 'ae_extracted_fields', 'ae_obligations',
      'ae_invoices', 'ae_invoice_disputes', 'ae_audit_log',
      'ae_vendors', 'ae_vendor_security_status', 'ae_compliance_breaches'
    ];

    tables.forEach(table => {
      it(`tenant B cannot read tenant A ${table}`, async () => {
        const { data } = await tenantBClient.from(table).select('*');
        expect(data).toHaveLength(0);
      });
    });

    it('audit_log rejects direct writes from application users', async () => {
      const { error } = await tenantAClient.from('ae_audit_log').insert({
        tenant_id: TENANT_A_ID,
        action: 'test',
        entity_type: 'ae_documents',
        entity_id: KNOWN_DOC_ID,
        actor_type: 'user'
      });

      // Write-blocked since no INSERT policy operates for authenticated users
      expect(error).not.toBeNull();
    });
  });
}
