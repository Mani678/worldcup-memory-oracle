'use client'

import { Trophy, Brain, TrendingUp } from 'lucide-react'
import { AgentResponse } from '@/lib/agent'

interface Message {
  role: 'user' | 'oracle'
  content: string
  agentData?: AgentResponse
  timestamp: Date
}

export default function OracleMessage({ message }: { message: Message }) {
  const { agentData } = message

  if (!agentData) {
    return (
      <div className="flex gap-3 max-w-2xl">
        <div className="w-8 h-8 rounded-full bg-oracle-gold/20 border border-oracle-gold/40 flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs">⚽</span>
        </div>
        <div className="bg-oracle-card border border-oracle-border rounded-xl px-4 py-3">
          <p className="text-sm text-oracle-muted">{message.content}</p>
        </div>
      </div>
    )
  }

  const { prediction, reasoning, memory_reflection, personality_response } = agentData
  const confidenceColor =
    prediction.confidence >= 70 ? 'text-oracle-green' :
    prediction.confidence >= 50 ? 'text-oracle-gold' : 'text-oracle-red'

  return (
    <div className="flex gap-3 max-w-2xl">
      <div className="w-8 h-8 rounded-full bg-oracle-gold/20 border border-oracle-gold/40 flex items-center justify-center flex-shrink-0 mt-1">
        <span className="text-xs">⚽</span>
      </div>

      <div className="space-y-2 flex-1">
        {/* Prediction card */}
        <div className="bg-oracle-card border border-oracle-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-oracle-gold" />
            <span className="text-xs font-mono text-oracle-gold uppercase tracking-wider">Prediction</span>
          </div>
          <p className="text-sm text-oracle-muted mb-1 font-mono">{prediction.match}</p>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-white font-mono">{prediction.score}</span>
            <div className="text-right">
              <p className="text-xs text-oracle-muted">Confidence</p>
              <p className={`text-xl font-bold font-mono ${confidenceColor}`}>{prediction.confidence}%</p>
            </div>
          </div>
          {/* Confidence bar */}
          <div className="mt-3 h-1.5 bg-oracle-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${prediction.confidence}%`,
                background: prediction.confidence >= 70 ? '#00ff87' : prediction.confidence >= 50 ? '#ffd700' : '#ff3366'
              }}
            />
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-oracle-card border border-oracle-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-oracle-purple" />
            <span className="text-xs font-mono text-oracle-purple uppercase tracking-wider">Reasoning</span>
          </div>
          <p className="text-sm text-gray-300">{reasoning}</p>
        </div>

        {/* Memory reflection */}
        {memory_reflection && (
          <div className="bg-oracle-purple/10 border border-oracle-purple/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-oracle-purple" />
              <span className="text-xs font-mono text-oracle-purple uppercase tracking-wider">Memory</span>
            </div>
            <p className="text-sm text-oracle-muted italic">{memory_reflection}</p>
          </div>
        )}

        {/* Personality / roast */}
        <div className="bg-oracle-card border border-oracle-border rounded-xl p-4">
          <p className="text-sm text-white">{personality_response}</p>
        </div>
      </div>
    </div>
  )
}
