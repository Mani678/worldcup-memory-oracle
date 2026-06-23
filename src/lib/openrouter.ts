// OpenRouter model discovery and fallback

interface OpenRouterModel {
  id: string
  name: string
  pricing: {
    prompt: string
    completion: string
  }
}

interface ModelsCache {
  freeModels: string[]
  selectedModel: string
  cachedAt: number
}

const CACHE_DURATION = 3600000 // 1 hour in ms
let modelsCache: ModelsCache | null = null

async function fetchAvailableModels(): Promise<OpenRouterModel[]> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models')
    if (!res.ok) {
      console.error('Failed to fetch OpenRouter models:', res.status)
      return []
    }
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.error('Error fetching OpenRouter models:', err)
    return []
  }
}

function extractFreeModels(models: OpenRouterModel[]): string[] {
  return models
    .filter(m => m.id.includes(':free'))
    .map(m => m.id)
}

async function getAvailableFreeModels(): Promise<string[]> {
  const now = Date.now()
  
  // Return cached result if still valid
  if (modelsCache && now - modelsCache.cachedAt < CACHE_DURATION) {
    console.log('[OpenRouter] Using cached free models list')
    return modelsCache.freeModels
  }

  console.log('[OpenRouter] Fetching fresh models list...')
  const models = await fetchAvailableModels()
  const freeModels = extractFreeModels(models)
  
  modelsCache = {
    freeModels,
    selectedModel: freeModels[0] || 'openrouter/free',
    cachedAt: now,
  }

  console.log('[OpenRouter] Found', freeModels.length, 'free models:', freeModels.slice(0, 5))
  return freeModels
}

export async function selectFreeModel(): Promise<string> {
  const freeModels = await getAvailableFreeModels()
  
  // Prefer models in this order
  const preferences = [
    'llama/llama-3.3-70b:free',
    'google/gemini-flash-1.5:free',
    'qwen/qwen-3-coder:free',
    'openrouter/free', // fallback to auto-router
  ]

  for (const pref of preferences) {
    if (freeModels.includes(pref)) {
      console.log('[OpenRouter] Selected preferred model:', pref)
      return pref
    }
  }

  // If no preferences match, use the first available
  if (freeModels.length > 0) {
    console.log('[OpenRouter] No preferred model available, using:', freeModels[0])
    return freeModels[0]
  }

  // Ultimate fallback
  console.warn('[OpenRouter] No free models found, using fallback')
  return 'openrouter/free'
}
