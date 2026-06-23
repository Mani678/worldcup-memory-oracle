import { MemWal } from '@mysten-incubation/memwal'

let client: MemWal | null = null

function getMemwalClient(): MemWal {
  if (!client) {
    console.log('[Walrus] Initializing client with:')
    console.log('  - accountId:', process.env.WALRUS_ACCOUNT_ID?.substring(0, 10) + '...')
    console.log('  - serverUrl:', process.env.WALRUS_RELAYER_URL)
    console.log('  - namespace:', process.env.WALRUS_NAMESPACE)
    
    try {
      client = MemWal.create({
        key: process.env.WALRUS_DELEGATE_KEY!,
        accountId: process.env.WALRUS_ACCOUNT_ID!,
        serverUrl: process.env.WALRUS_RELAYER_URL || 'https://relayer.memory.walrus.xyz',
        namespace: process.env.WALRUS_NAMESPACE || 'worldcup-oracle',
      })
      console.log('[Walrus] Client initialized successfully')
    } catch (err) {
      console.error('[Walrus] Client init error:', err)
      throw err
    }
  }
  return client
}

export interface UserMemory {
  user_id: string
  predictions: Prediction[]
  accuracy_score: number
  favorite_team: string
  bias_tags: string[]
  interaction_history: string[]
  total_interactions: number
}

export interface Prediction {
  match: string
  user_prediction: string
  actual_result: string | null
  correct: boolean | null
  timestamp: string
}

export const EMPTY_MEMORY = (user_id: string): UserMemory => ({
  user_id,
  predictions: [],
  accuracy_score: 0,
  favorite_team: '',
  bias_tags: [],
  interaction_history: [],
  total_interactions: 0,
})

export async function loadUserMemory(walletAddress: string): Promise<UserMemory> {
  try {
    console.log('[Walrus] Loading memory for:', walletAddress)
    const memwal = getMemwalClient()
    
    console.log('[Walrus] Calling recall...')
    const result = await memwal.recall({
      query: `memory for ${walletAddress}`,
    })

    console.log('[Walrus] Recall returned:', result)
    console.log('[Walrus] Results count:', result.results?.length || 0)

    if (!result.results || result.results.length === 0) {
      console.log('[Walrus] No memory found, returning empty')
      return EMPTY_MEMORY(walletAddress)
    }

    for (const r of result.results) {
      console.log('[Walrus] Checking result:', r)
      try {
        const parsed = JSON.parse(r.text)
        if (parsed.user_id === walletAddress) {
          console.log('[Walrus] ✓ Found matching memory')
          return parsed as UserMemory
        }
      } catch (e) {
        console.log('[Walrus] Parse failed:', e)
      }
    }

    return EMPTY_MEMORY(walletAddress)
  } catch (err) {
    console.error('[Walrus] Load error:', err)
    return EMPTY_MEMORY(walletAddress)
  }
}

export async function saveUserMemory(memory: UserMemory): Promise<void> {
  try {
    console.log('[Walrus] Saving memory for:', memory.user_id)
    const memwal = getMemwalClient()
    
    const content = JSON.stringify(memory)
    console.log('[Walrus] Content to save:', content.substring(0, 200))
    
    console.log('[Walrus] Calling remember...')
    const result = await memwal.remember(content)
    console.log('[Walrus] Remember returned:', result)
    console.log('[Walrus] ✓ Memory saved')
  } catch (err) {
    console.error('[Walrus] Save error:', err)
    throw err
  }
}