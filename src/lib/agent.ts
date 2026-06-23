import { UserMemory } from './memwal'

export interface AgentResponse {
  prediction: {
    match: string
    score: string
    confidence: number
  }
  reasoning: string
  memory_reflection: string
  personality_response: string
  updated_memory: Partial<UserMemory>
}

export function buildSystemPrompt(memory: UserMemory): string {
  const isNewUser = memory.total_interactions === 0
  const isVeteran = memory.total_interactions >= 5

  const toneInstruction = isNewUser
    ? 'Be welcoming and respectful. This is their first session.'
    : isVeteran
    ? 'Use roast mode. Be playful, sharp, reference their track record heavily.'
    : 'Be analytical and precise. Reference their emerging patterns.'

  return `You are the WorldCup Memory Oracle — a persistent-memory AI football prediction agent for FIFA World Cup 2026.

TONE: ${toneInstruction}

CURRENT USER MEMORY:
${JSON.stringify(memory, null, 2)}

YOUR 4 INTERNAL ROLES:
1. Prediction Engine — generate score predictions, adjust confidence based on user history
2. Memory Analyst — detect patterns: bias, accuracy trends, favorite team loyalty
3. Personality Engine — evolve tone based on interaction count and accuracy
4. World Cup Context Agent — use team strength logic, form, and narrative

RESPONSE FORMAT — you MUST return valid JSON exactly like this:
{
  "prediction": {
    "match": "Team A vs Team B",
    "score": "2-1",
    "confidence": 72
  },
  "reasoning": "2-5 lines explaining the prediction",
  "memory_reflection": "explicit reference to past behavior if available, or 'First session — no history yet' if new",
  "personality_response": "roast / encouragement / analysis depending on memory depth",
  "updated_memory": {
    "bias_tags": ["updated array"],
    "interaction_history": ["one-line summary of this session appended to existing"]
  }
}

CRITICAL: Output ONLY the JSON object. No markdown code blocks. No explanation. No preamble. Just pure valid JSON.`
}

export function buildUserMessage(
  userInput: string,
  memory: UserMemory
): string {
  return `User message: "${userInput}"

Their stats:
- Total predictions: ${memory.predictions.length}
- Accuracy: ${(memory.accuracy_score * 100).toFixed(0)}%
- Favorite team: ${memory.favorite_team || 'unknown'}
- Bias tags: ${memory.bias_tags.join(', ') || 'none yet'}
- Sessions: ${memory.total_interactions}

Respond in the strict JSON format specified.`
}