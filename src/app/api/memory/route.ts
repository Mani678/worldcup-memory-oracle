import { NextRequest, NextResponse } from 'next/server'
import { loadUserMemory, saveUserMemory, Prediction } from '@/lib/memwal'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const walletAddress = searchParams.get('wallet')

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
  }

  const memory = await loadUserMemory(walletAddress)
  return NextResponse.json({ memory })
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, action, data } = await req.json()

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    const memory = await loadUserMemory(walletAddress)

    if (action === 'add_prediction') {
      const prediction: Prediction = {
        match: data.match,
        user_prediction: data.user_prediction,
        actual_result: null,
        correct: null,
        timestamp: new Date().toISOString(),
      }
      memory.predictions.push(prediction)
      if (data.favorite_team) memory.favorite_team = data.favorite_team
    }

    if (action === 'submit_result') {
      // Find the prediction and update it
      const pred = memory.predictions.find(
        (p) => p.match === data.match && p.actual_result === null
      )
      if (pred) {
        pred.actual_result = data.actual_result
        pred.correct = data.actual_result === pred.user_prediction

        // Recalculate accuracy
        const resolved = memory.predictions.filter((p) => p.correct !== null)
        const correct = resolved.filter((p) => p.correct === true)
        memory.accuracy_score = resolved.length > 0 ? correct.length / resolved.length : 0
      }
    }

    await saveUserMemory(memory)
    return NextResponse.json({ memory })
  } catch (err) {
    console.error('Memory route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
