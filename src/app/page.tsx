'use client'

import { useState, useRef, useEffect } from 'react'
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Trophy, Brain, Zap, Target } from 'lucide-react'
import { UserMemory } from '@/lib/memwal'
import { AgentResponse } from '@/lib/agent'
import MemoryDashboard from '@/components/MemoryDashboard'
import OracleMessage from '@/components/OracleMessage'

interface Message {
  role: 'user' | 'oracle'
  content: string
  agentData?: AgentResponse
  timestamp: Date
}

export default function Home() {
  const account = useCurrentAccount()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [memory, setMemory] = useState<UserMemory | null>(null)
  const [showDashboard, setShowDashboard] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load memory when wallet connects
  useEffect(() => {
    if (account?.address) {
      fetch(`/api/memory?wallet=${account.address}`)
        .then(r => r.json())
        .then(({ memory }) => {
          setMemory(memory)
          if (memory.total_interactions === 0) {
            setMessages([{
              role: 'oracle',
              content: "First session. No history on you yet. Tell me a match you want to predict.",
              timestamp: new Date()
            }])
          } else {
            setMessages([{
              role: 'oracle',
              content: `Session ${memory.total_interactions + 1}. I remember you. ${memory.predictions.length} predictions on record. Accuracy: ${(memory.accuracy_score * 100).toFixed(0)}%. Let's see if you've improved.`,
              timestamp: new Date()
            }])
          }
        })
    }
  }, [account?.address])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || !account?.address || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, walletAddress: account.address })
      })

      const data = await res.json()

      if (!res.ok || !data.agentResponse) {
        setMessages(prev => [...prev, {
          role: 'oracle',
          content: `Error: ${data.error || 'Failed to get response from agent'}`,
          timestamp: new Date()
        }])
        return
      }

      const { agentResponse, memory: updatedMemory } = data

      setMemory(updatedMemory)
      setMessages(prev => [...prev, {
        role: 'oracle',
        content: agentResponse.personality_response,
        agentData: agentResponse,
        timestamp: new Date()
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'oracle',
        content: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  if (!account) {
    return <LandingPage />
  }

  return (
    <div className="flex h-screen bg-oracle-bg">
      {/* Sidebar */}
      <div className="w-64 bg-oracle-card border-r border-oracle-border flex flex-col">
        <div className="p-4 border-b border-oracle-border">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-oracle-gold" />
            <span className="font-bold text-oracle-gold">WorldCup Oracle</span>
          </div>
          <p className="text-xs text-oracle-muted font-mono">FIFA 2026 Memory Agent</p>
        </div>

        {/* Wallet */}
        <div className="p-4 border-b border-oracle-border">
          <p className="text-xs text-oracle-muted mb-1">Connected</p>
          <p className="text-xs font-mono text-oracle-green truncate">{account.address}</p>
        </div>

        {/* Stats */}
        {memory && (
          <div className="p-4 space-y-3">
            <StatRow icon={<Target className="w-4 h-4" />} label="Predictions" value={memory.predictions.length} />
            <StatRow icon={<Zap className="w-4 h-4" />} label="Accuracy" value={`${(memory.accuracy_score * 100).toFixed(0)}%`} />
            <StatRow icon={<Brain className="w-4 h-4" />} label="Sessions" value={memory.total_interactions} />
          </div>
        )}

        <div className="mt-auto p-4 space-y-2">
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className="w-full text-sm py-2 px-3 rounded bg-oracle-border hover:bg-oracle-purple/20 text-oracle-muted hover:text-white transition-colors"
          >
            {showDashboard ? 'Hide' : 'Show'} Memory Dashboard
          </button>
          <ConnectButton />
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {showDashboard && memory ? (
          <MemoryDashboard memory={memory} walletAddress={account.address} onMemoryUpdate={setMemory} />
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="bg-oracle-purple/20 border border-oracle-purple/30 rounded-xl px-4 py-3 max-w-lg">
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      <OracleMessage message={msg} />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-oracle-muted"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-oracle-green"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-mono">Oracle accessing Walrus memory...</span>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-oracle-border">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about a match... e.g. 'Predict Argentina vs France'"
                  className="flex-1 bg-oracle-card border border-oracle-border rounded-xl px-4 py-3 text-sm outline-none focus:border-oracle-purple/50 placeholder:text-oracle-muted font-mono"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-oracle-purple hover:bg-oracle-purple/80 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-3 rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-oracle-muted mt-2 font-mono">Memory stored on Walrus Mainnet · Powered by Claude</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-oracle-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-bold text-oracle-green font-mono">{value}</span>
    </div>
  )
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-oracle-bg flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg"
      >
        <div className="text-6xl mb-6">⚽</div>
        <h1 className="text-4xl font-bold text-white mb-2">
          WorldCup <span className="text-oracle-gold">Memory Oracle</span>
        </h1>
        <p className="text-oracle-muted mb-2 text-lg">FIFA 2026 · Persistent Memory Agent</p>
        <p className="text-sm text-oracle-muted mb-8 font-mono">
          Predicts. Remembers. Roasts. Evolves.<br />
          Powered by Walrus Memory + Claude AI
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8 text-left">
          {[
            { icon: '🧠', title: 'Remembers You', desc: 'Tracks predictions across sessions on Walrus' },
            { icon: '🔥', title: 'Roasts Your Record', desc: 'Gets sharper the longer you play' },
            { icon: '📊', title: 'Visible Memory', desc: 'Full history, accuracy score, bias tags' },
          ].map((f, i) => (
            <div key={i} className="bg-oracle-card border border-oracle-border rounded-xl p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-sm font-semibold text-white mb-1">{f.title}</p>
              <p className="text-xs text-oracle-muted">{f.desc}</p>
            </div>
          ))}
        </div>

        <ConnectButton />
        <p className="text-xs text-oracle-muted mt-4 font-mono">Connect your Sui wallet to begin</p>
      </motion.div>
    </div>
  )
}