import { NextRequest, NextResponse } from 'next/server'
import { loadUserMemory, saveUserMemory, UserMemory } from '@/lib/memwal'
import { buildSystemPrompt, buildUserMessage, AgentResponse } from '@/lib/agent'
import { selectFreeModel } from '@/lib/openrouter'

async function callOpenRouter(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = await selectFreeModel()
  
  console.log('[OpenRouter] Using model:', model)

  const body = JSON.stringify({
    model,
    max_tokens: 1000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'WorldCup Memory Oracle',
      },
      body,
    })

    const data = await res.json()
    console.log('[OpenRouter] Status:', res.status)

    if (!res.ok) {
      throw new Error(`Status ${res.status}: ${JSON.stringify(data.error || data)}`)
    }

    let content = data.choices?.[0]?.message?.content
    if (!content && data.choices?.[0]?.message?.reasoning) {
      console.log('[OpenRouter] Using reasoning field')
      content = data.choices[0].message.reasoning
    }

    if (!content) {
      throw new Error('No content in response')
    }

    return content
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[OpenRouter] Error:', msg)
    throw err
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, walletAddress } = await req.json()

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet required' }, { status: 400 })
    }

    const memory = await loadUserMemory(walletAddress)
    const systemPrompt = buildSystemPrompt(memory)
    const userMessage = buildUserMessage(message, memory)

    const rawText = await callOpenRouter(systemPrompt, userMessage)
    
    console.log('===== RAW RESPONSE START =====')
    console.log(rawText)
    console.log('===== RAW RESPONSE END =====')

    let agentResponse: AgentResponse
    try {
      // Try direct parse first
      agentResponse = JSON.parse(rawText.trim())
      console.log('✓ Direct parse succeeded')
    } catch (e1) {
      console.log('Direct parse failed, trying to extract JSON...')
      
      // Try to extract JSON from text
      const jsonMatch = rawText.match(/\{[\s\S]*?\n\}/)
      if (jsonMatch) {
        try {
          agentResponse = JSON.parse(jsonMatch[0])
          console.log('✓ Extracted JSON parse succeeded')
        } catch (e2) {
          console.error('Extracted JSON parse failed:', e2)
          throw new Error('Could not parse extracted JSON')
        }
      } else {
        console.error('No JSON object found in response')
        throw new Error('No JSON found in response')
      }
    }

    const updatedMemory: UserMemory = {
      ...memory,
      total_interactions: memory.total_interactions + 1,
      bias_tags: agentResponse.updated_memory?.bias_tags ?? memory.bias_tags,
      interaction_history: [
        ...memory.interaction_history,
        ...(agentResponse.updated_memory?.interaction_history ?? []),
      ].slice(-20),
    }

    saveUserMemory(updatedMemory).catch(e => console.error('Save failed:', e))

    return NextResponse.json({ agentResponse, memory: updatedMemory })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Agent error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}