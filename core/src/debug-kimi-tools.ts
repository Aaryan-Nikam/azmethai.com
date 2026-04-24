import OpenAI from 'openai'

async function main() {
  const client = new OpenAI({
    apiKey: process.env.AZURE_KIMI_API_KEY,
    baseURL: process.env.AZURE_KIMI_ENDPOINT,
    defaultQuery: { 'api-version': '2024-05-01-preview' },
    defaultHeaders: { 'api-key': process.env.AZURE_KIMI_API_KEY ?? '' },
  })

  const r = await client.chat.completions.create({
    model: 'kimi-K2.5',
    max_tokens: 256,
    messages: [{ role: 'user', content: 'Call execute_javascript with code: console.log(42)' }],
    tools: [{
      type: 'function',
      function: {
        name: 'execute_javascript',
        description: 'run js',
        parameters: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
      },
    }],
    tool_choice: 'auto',
  })

  console.log('=== RAW TOOL CALLS ===')
  console.log(JSON.stringify(r.choices[0]?.message?.tool_calls, null, 2))
  console.log('finish_reason:', r.choices[0]?.finish_reason)
  console.log('message.content:', r.choices[0]?.message?.content)
}

main().catch(e => { console.error(e); process.exit(1) })
