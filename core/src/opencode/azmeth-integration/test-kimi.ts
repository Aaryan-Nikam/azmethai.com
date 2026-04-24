/**
 * Quick smoke test — verifies Azure Kimi K2.5 endpoint responds.
 * Run: npx tsx src/opencode/azmeth-integration/test-kimi.ts
 */

import OpenAI from 'openai'

const ENDPOINT = process.env.AZURE_AI_ENDPOINT ?? 'https://nikam-mn2vv7tk-eastus2.services.ai.azure.com/models'
const API_KEY = process.env.AZURE_AI_API_KEY
const API_VER = process.env.AZURE_AI_API_VERSION ?? '2024-05-01-preview'
const MODEL = process.env.AZURE_AI_MODEL ?? 'kimi-K2.5'

if (!API_KEY) {
  throw new Error('Missing AZURE_AI_API_KEY (set it in your shell or an .env file).')
}

async function main() {
  console.log('🔵 Testing Azure Kimi K2.5 endpoint...')

  const client = new OpenAI({
    apiKey: API_KEY,
    baseURL: ENDPOINT,
    defaultQuery: { 'api-version': API_VER },
    defaultHeaders: { 'api-key': API_KEY },
  })

  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 64,
    stream: true,
    messages: [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      { role: 'user', content: 'Say "Azmeth engine online" and nothing else.' },
    ],
  })

  let response = ''
  process.stdout.write('🤖 Kimi: ')
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? ''
    if (text) {
      response += text
      process.stdout.write(text)
    }
  }
  console.log('\n')

  if (response.trim()) {
    console.log('✅ Azure Kimi K2.5 is LIVE and responding.')
  } else {
    console.log('❌ Empty response — check endpoint and API key.')
  }
}

main().catch(e => {
  console.error('❌ Error:', e.message ?? e)
  process.exit(1)
})
