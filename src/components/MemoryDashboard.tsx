'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Target, TrendingUp, Tag, Clock, CheckCircle, XCircle } from 'lucide-react'
import { UserMemory } from '@/lib/memwal'

interface Props {
  memory: UserMemory
  walletAddress: string
  onMemoryUpdate: (m: UserMemory) => void
}

export default function MemoryDashboard({ memory, walletAddress, onMemoryUpdate }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [resultForm, setResultForm] = useState({ match: '', actual_result: '' })
  const [msg, setMsg] = useState('')

  const resolved = memory.predictions.filter(p => p.correct !== null)
  const pending = memory.predictions.filter(p => p.correct === null)

  async function submitResult() {
    if (!resultForm.match || !resultForm.actual_result) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          action: 'submit_result',
          data: resultForm
        })
      })
      const { memory: updated } = await res.json()
      onMemoryUpdate(updated)
      setMsg('Result saved to Walrus ✓')
      setResultForm({ match: '', actual_result: '' })
    } catch {
      setMsg('Save failed. Try again.')
    } finally {
      setSubmitting(false)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-oracle-gold" />
          <div>
            <h2 className="text-xl font-bold text-white">Memory Dashboard</h2>
            <p className="text-xs text-oracle-muted font-mono">Stored on Walrus Mainnet</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Predictions', value: memory.predictions.length, color: 'text-white' },
            { label: 'Accuracy', value: `${(memory.accuracy_score * 100).toFixed(0)}%`, color: memory.accuracy_score >= 0.6 ? 'text-oracle-green' : memory.accuracy_score >= 0.4 ? 'text-oracle-gold' : 'text-oracle-red' },
            { label: 'Sessions', value: memory.total_interactions, color: 'text-oracle-purple' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-oracle-card border border-oracle-border rounded-xl p-4 text-center"
            >
              <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-xs text-oracle-muted mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Bias tags */}
        {memory.bias_tags.length > 0 && (
          <div className="bg-oracle-card border border-oracle-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-oracle-purple" />
              <span className="text-sm font-semibold text-oracle-purple">Behavioral Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {memory.bias_tags.map((tag, i) => (
                <span key={i} className="text-xs px-3 py-1 rounded-full bg-oracle-purple/20 border border-oracle-purple/30 text-oracle-purple font-mono">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prediction history */}
        <div className="bg-oracle-card border border-oracle-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-oracle-gold" />
            <span className="text-sm font-semibold text-oracle-gold">Prediction History</span>
          </div>

          {memory.predictions.length === 0 ? (
            <p className="text-sm text-oracle-muted text-center py-4 font-mono">No predictions yet. Start chatting with the Oracle.</p>
          ) : (
            <div className="space-y-2">
              {[...memory.predictions].reverse().map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-oracle-bg border border-oracle-border/50">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{p.match}</p>
                    <p className="text-xs text-oracle-muted font-mono mt-0.5">
                      Your pick: <span className="text-white">{p.user_prediction}</span>
                      {p.actual_result && <> · Result: <span className="text-white">{p.actual_result}</span></>}
                    </p>
                  </div>
                  <div className="ml-4">
                    {p.correct === null ? (
                      <span className="text-xs text-oracle-gold font-mono bg-oracle-gold/10 px-2 py-1 rounded">PENDING</span>
                    ) : p.correct ? (
                      <CheckCircle className="w-5 h-5 text-oracle-green" />
                    ) : (
                      <XCircle className="w-5 h-5 text-oracle-red" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit result */}
        {pending.length > 0 && (
          <div className="bg-oracle-card border border-oracle-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-oracle-green" />
              <span className="text-sm font-semibold text-oracle-green">Submit Match Result</span>
            </div>
            <div className="space-y-3">
              <select
                value={resultForm.match}
                onChange={e => setResultForm(f => ({ ...f, match: e.target.value }))}
                className="w-full bg-oracle-bg border border-oracle-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-oracle-purple/50"
              >
                <option value="">Select pending match...</option>
                {pending.map((p, i) => (
                  <option key={i} value={p.match}>{p.match} (your pick: {p.user_prediction})</option>
                ))}
              </select>
              <input
                value={resultForm.actual_result}
                onChange={e => setResultForm(f => ({ ...f, actual_result: e.target.value }))}
                placeholder="Actual result e.g. 2-1"
                className="w-full bg-oracle-bg border border-oracle-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-oracle-purple/50 placeholder:text-oracle-muted"
              />
              <button
                onClick={submitResult}
                disabled={submitting || !resultForm.match || !resultForm.actual_result}
                className="w-full py-2 bg-oracle-green/20 border border-oracle-green/30 hover:bg-oracle-green/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-oracle-green text-sm font-semibold transition-colors"
              >
                {submitting ? 'Saving to Walrus...' : 'Submit Result'}
              </button>
              {msg && <p className="text-xs text-center font-mono text-oracle-green">{msg}</p>}
            </div>
          </div>
        )}

        {/* Interaction history */}
        {memory.interaction_history.length > 0 && (
          <div className="bg-oracle-card border border-oracle-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-oracle-muted" />
              <span className="text-sm font-semibold text-oracle-muted">Session History</span>
            </div>
            <div className="space-y-2">
              {[...memory.interaction_history].reverse().map((h, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-xs text-oracle-muted font-mono mt-0.5 flex-shrink-0">#{memory.interaction_history.length - i}</span>
                  <p className="text-xs text-oracle-muted">{h}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Walrus proof */}
        <div className="text-center py-2">
          <p className="text-xs text-oracle-muted font-mono">
            Memory stored on <span className="text-oracle-green">Walrus Mainnet</span> · Account: {memory.user_id.slice(0, 8)}...{memory.user_id.slice(-6)}
          </p>
        </div>

      </div>
    </div>
  )
}
