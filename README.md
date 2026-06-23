# WorldCup Memory Oracle ⚽🧠

A persistent-memory AI football prediction agent for FIFA World Cup 2026, powered by Walrus Memory + Claude AI.

## Stack
- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Claude claude-sonnet-4-6** (agent reasoning)
- **Walrus Memory SDK** (`@mysten-incubation/memwal`) — persistent storage
- **Sui dapp-kit** — wallet connect
- **Vercel** — deployment

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.local` and fill in your values:
```
ANTHROPIC_API_KEY=your_key_here
WALRUS_DELEGATE_KEY=0x...
WALRUS_ACCOUNT_ID=...
WALRUS_RELAYER_URL=https://relayer.memory.walrus.xyz
WALRUS_NAMESPACE=worldcup-oracle
```

### 3. Run locally
```bash
npm run dev
```

### 4. Deploy to Vercel
```bash
vercel --prod
```
Add all env vars in the Vercel dashboard under Settings → Environment Variables.

## How memory works
1. User connects Sui wallet → wallet address = user ID
2. Every chat interaction loads memory from Walrus via `memwal.recall()`
3. Claude receives the full memory object in its system prompt
4. Agent response includes `updated_memory` block
5. Memory is saved back to Walrus via `memwal.remember()`
6. Next session: agent behavior changes based on accumulated history

## Key features
- **Prediction tracking** — every match prediction stored with outcome
- **Accuracy score** — recalculated after each result submission
- **Bias tags** — Claude detects patterns (overconfident, Brazil fan, accurate predictor)
- **Tone evolution** — roast mode unlocks after 5+ sessions
- **Memory Dashboard** — full history visible, result submission UI
