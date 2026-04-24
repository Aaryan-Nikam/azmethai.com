/**
 * Sample Contract Generator for Testing
 * 
 * Creates realistic-looking vendor contract text files for testing the extractor.
 * These are synthetic contracts designed to test specific extraction scenarios.
 * 
 * Scenarios:
 * 1. Dangerous auto-renewal trap (60-day notice, 12-month renewal)
 * 2. SaaS contract with SLA credits
 * 3. Annual price escalation clause
 * 
 * Usage: node src/test-harness/generate-samples.mjs
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACTS_DIR = join(__dirname, '../../test-contracts');

await mkdir(CONTRACTS_DIR, { recursive: true });

// ─── Sample 1: Cloud Storage SaaS — Auto-renewal trap ─────────────────────
const sample1 = `MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is entered into as of 15 January 2024 ("Effective Date") 
between DataVault Limited, a company incorporated in England and Wales with company number 12345678, 
whose registered office is at 1 Tech Street, London, EC2A 1AB ("Vendor") and Acme Corp Limited, 
company number 87654321 ("Customer").

1. SERVICES AND TERM

1.1 Vendor shall provide cloud data storage and backup services as described in Schedule 1 ("Services").

1.2 This Agreement shall commence on the Effective Date and continue for an initial term of 36 months 
("Initial Term"), expiring on 14 January 2027.

1.3 AUTOMATIC RENEWAL. Upon expiration of the Initial Term and at the end of each Renewal Term, 
this Agreement shall automatically renew for successive terms of 12 months each ("Renewal Term") 
UNLESS either party provides written notice of non-renewal to the other party's legal department 
by recorded delivery mail OR email to contracts@datavault.co.uk no less than 60 days prior to 
the end of the then-current term. Time is of the essence with respect to this notice requirement.

2. FEES AND PAYMENT

2.1 The annual service fee for the Initial Term is £84,000 per annum, payable quarterly in advance.

2.2 PRICE ESCALATION. At the commencement of each Renewal Term, the annual fee shall increase by 
the lesser of (a) the percentage increase in the Consumer Price Index (CPI) for the 12-month period 
ending on 31 October of the preceding calendar year, as published by the Office for National 
Statistics, or (b) 8%. Customer shall be notified in writing of the revised fee no later than 
90 days before the commencement of the Renewal Term.

2.3 Payment is due within 30 days of invoice date. Late payment shall accrue interest at 4% per 
annum above the Bank of England base rate from time to time.

3. SERVICE LEVELS

3.1 Vendor shall use commercially reasonable efforts to ensure the Services are available 99.9% 
of the time in any given calendar month, calculated as follows: (Total minutes in month - Downtime minutes) 
/ Total minutes in month × 100.

3.2 SERVICE CREDIT REMEDIES. In the event that Service Availability falls below the committed 
level in any calendar month, Customer shall be entitled to the following service credits:

(a) Availability 99.0% - 99.89%: Credit equal to 10% of the monthly fee for that month.
(b) Availability 95.0% - 98.99%: Credit equal to 25% of the monthly fee for that month.  
(c) Availability below 95.0%: Credit equal to 50% of the monthly fee for that month.

3.3 Service credits must be claimed within 30 days of the end of the relevant month. Credits 
shall be applied to the following invoice. Credits are the Customer's sole and exclusive remedy 
for service availability failures.

4. DATA PROCESSING

4.1 The parties acknowledge that Vendor will process personal data on behalf of Customer in the 
provision of the Services. The parties have entered into a separate Data Processing Agreement 
("DPA") dated 15 January 2024, which is incorporated into this Agreement by reference.

5. TERM AND TERMINATION

5.1 Either party may terminate this Agreement for convenience upon 90 days prior written notice.

5.2 Either party may terminate this Agreement immediately upon written notice if the other party 
commits a material breach and fails to remedy such breach within 30 days of receiving written 
notice of the breach.

5.3 Either party may terminate immediately if the other party enters into administration, 
receivership, liquidation, or voluntary arrangement with creditors.

5.4 TERMINATION FEES. Termination for convenience by the Customer during the Initial Term 
shall require payment of 50% of the remaining fees for the unexpired Initial Term.

6. LIABILITY

6.1 Each party's total aggregate liability to the other under or in connection with this Agreement 
shall not exceed an amount equal to the fees paid by Customer in the 12 months preceding the 
event giving rise to liability (£84,000).

7. GOVERNING LAW

7.1 This Agreement is governed by and construed in accordance with the laws of England and Wales. 
The parties submit to the exclusive jurisdiction of the courts of England and Wales.

SIGNED by the parties on the Effective Date.

For DataVault Limited:              For Acme Corp Limited:
________________________           ________________________
Director                            Director
`;

// ─── Sample 2: Professional Services — No auto-renewal, good for comparison ─
const sample2 = `PROFESSIONAL SERVICES AGREEMENT

THIS AGREEMENT is made on 1 March 2024

BETWEEN:
TechConsult Partners LLP ("Service Provider"), a limited liability partnership registered in 
Scotland under number SO300123, and Vertex Manufacturing plc ("Client"), company number 
09876543, registered in England and Wales.

1. ENGAGEMENT AND SCOPE

1.1 Service Provider is engaged to provide software implementation and consulting services 
as detailed in Statement of Work 001 attached hereto ("SOW").

1.2 This Agreement commences on 1 March 2024.

1.3 TERM. Unless earlier terminated in accordance with this Agreement, the engagement shall 
continue until completion of the Services as described in the SOW, estimated to conclude by 
30 September 2024. This Agreement shall NOT automatically renew. Any extension requires 
a new Statement of Work signed by both parties.

2. FEES

2.1 Service Provider's fees are £350 per day per consultant (£450 per day for Principal Consultants), 
as specified in the SOW. Total estimated project value: £245,000 excluding expenses and VAT.

2.2 Fees are invoiced monthly in arrears for work completed. Payment terms: Net 14 days.

3. INTELLECTUAL PROPERTY

3.1 All work product created specifically for Client under this Agreement shall vest in Client 
upon receipt of full payment. Pre-existing intellectual property of Service Provider remains 
the property of Service Provider.

4. CONFIDENTIALITY

4.1 Each party shall keep confidential all Confidential Information of the other party. This 
obligation survives termination of the Agreement for a period of 3 years.

5. TERMINATION

5.1 Either party may terminate this Agreement on 30 days written notice.

5.2 Client may terminate immediately for Service Provider's material breach.

5.3 No early termination fee applies to termination for convenience.

6. DATA PROTECTION

6.1 To the extent Service Provider processes personal data on behalf of Client, Service Provider 
agrees to act only on Client's written instructions and comply with all applicable data protection 
legislation including the UK GDPR. A Data Processing Agreement is not separately required as 
the processing activities are minimal; however, both parties agree to comply with their respective 
obligations under UK GDPR.

7. LIABILITY

7.1 Service Provider's total liability shall not exceed the total fees paid in the 3 months 
preceding the event giving rise to the claim.

7.2 Neither party shall be liable for indirect, consequential, or special damages.

8. GOVERNING LAW

This Agreement is governed by the law of Scotland and the parties submit to the non-exclusive 
jurisdiction of the Scottish courts.
`;

async function generateContracts() {
  await writeFile(join(CONTRACTS_DIR, 'sample-1-cloud-storage-auto-renewal.txt'), sample1);
  await writeFile(join(CONTRACTS_DIR, 'sample-2-professional-services.txt'), sample2);

  console.log('✓ Sample contracts created in test-contracts/');
  console.log('  sample-1-cloud-storage-auto-renewal.txt — dangerous auto-renewal trap scenario');
  console.log('  sample-2-professional-services.txt — no auto-renewal, for comparison');
  console.log('\nNote: These are .txt files. The extractor handles PDFs in production.');
  console.log('To test with .txt, we\\'ll need to wrap them in a test adapter (see run-text.ts)');
}

async function generateInvoices() {
  const INVOICES_DIR = join(__dirname, '../../test-invoices');
  await mkdir(INVOICES_DIR, { recursive: true });

  const templates = [
    {
      filename: 'invoice-1-perfect-reconciliation.txt',
      content: `INVOICE #9901\nDataVault Limited\n1 Tech Street, London\nTo: Acme Corp Limited\nBilling Period: 2026-01-01 to 2026-01-31\n\nCHARGES:\n- Enterprise Cloud Storage Base Fee: 7000.00\n- Overages (Tier 2): 500.00\nCREDITS:\n- SLA Miss Credit (Jan 14 Outage): -500.00\n\nTotal Amount Due: 7000.00\nTotal Credits Applied: 500.00\nCurrency: GBP\nDue upon receipt.`
    },
    {
      filename: 'invoice-2-unauthorised-hike.txt',
      content: `INVOICE #9902\nDataVault Limited\n1 Tech Street, London\nTo: Acme Corp Limited\nBilling Period: 2026-02-01 to 2026-02-28\n\nCHARGES:\n- Enterprise Cloud Storage Base Fee: 92000.00\n- Overages (Tier 2): 0.00\n\nTotal Amount Due: 92000.00\nTotal Credits Applied: 0.00\nCurrency: GBP\nDue upon receipt.`
    },
    {
      filename: 'invoice-3-missing-credit.txt',
      content: `INVOICE #9903\nDataVault Limited\n1 Tech Street, London\nTo: Acme Corp Limited\nBilling Period: 2026-03-01 to 2026-03-31\n\nCHARGES:\n- Enterprise Cloud Storage Base Fee: 7000.00\nCREDITS:\n- SLA Miss Credit (Mar 2 Outage): -750.00\n\nTotal Amount Due: 7000.00\nTotal Credits Applied: 0.00\nCurrency: GBP\nDue upon receipt.`
    }
  ];

  for (const template of templates) {
    const filePath = join(INVOICES_DIR, template.filename);
    await writeFile(filePath, template.content, 'utf-8');
  }
  console.log('✓ Sample invoices created in test-invoices/');
}

async function runAll() {
  await generateContracts();
  await generateInvoices();
}

runAll().catch(console.error);

