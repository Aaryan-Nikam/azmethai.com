import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5678;

app.post('/webhook', (req, res) => {
  console.log('\n======================================');
  console.log('🔔 [MOCK n8n WEBHOOK] RECEIVED EXECUTION');
  console.log('======================================');
  console.log(`Tool Name : ${req.body.tool_name}`);
  console.log(`Context   : Role ${req.body.context?.role_id} @ Tenant ${req.body.context?.tenant_id}`);
  console.log('Payload   :', JSON.stringify(req.body.payload, null, 2));
  console.log('======================================\n');

  // Simulate execution outcome based on tool name
  if (req.body.tool_name === 'gmail_send_email') {
    return res.json({
      success: true,
      message: `Email successfully sent to ${req.body.payload.to}`,
      timestamp: new Date().toISOString()
    });
  }

  if (req.body.tool_name === 'hubspot_create_contact') {
    return res.json({
      success: true,
      contact_id: 'hs_' + Math.floor(Math.random() * 1000000),
      message: `${req.body.payload.email} added to Hubspot.`,
    });
  }

  // Fallback default
  res.json({
    success: true,
    message: `Mock execution of ${req.body.tool_name} completed successfully`,
    received_payload: req.body.payload
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [MOCK n8n SERVER] Listening on http://localhost:${PORT}/webhook`);
  console.log(`Make sure N8N_WEBHOOK_URL=http://localhost:${PORT}/webhook is in your .env`);
});
