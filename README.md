# Linxi AI — Social Companion Agent Starter

> **Open-source starter template for building AI companions that feel alive.**  
> Next.js 16 · TypeScript · DeepSeek · Tailwind CSS

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FStanley0601%2Flinxi-ai&env=LLM_API_KEY&envDescription=Your%20DeepSeek%20API%20key%20(server-side%20only%2C%20never%20exposed%20to%20the%20browser)&envLink=https%3A%2F%2Fplatform.deepseek.com%2F&project-name=linxi-ai&repository-name=linxi-ai)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![DeepSeek](https://img.shields.io/badge/LLM-DeepSeek-purple)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What is this?

Linxi is a **production-ready starter template** for building AI social companions — characters that don't just respond to you, but *live their own life*, reach out proactively, remember your conversations, and react emotionally to what you say.

Use it as a foundation to build:
- 🤖 AI friends / virtual companions
- 💬 Character-driven chatbots with personality
- 🎮 Interactive narrative experiences
- 📱 Social AI apps (WeChat/LINE/Telegram style)

### What makes it different from a basic chatbot?

| Basic Chatbot | Linxi Agent |
|---------------|-------------|
| Waits for user input | **Proactively reaches out** (time engine) |
| Stateless conversations | **Remembers everything** (memory summaries) |
| Fixed personality | **Mood changes in real-time** (emotion state machine) |
| Text-only | **Sends stickers, selfies, posts "moments"** |
| Generic responses | **Adapts to user interests** (silent extraction) |

---

## ⚡ Quick Start

### 1-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FStanley0601%2Flinxi-ai&env=LLM_API_KEY&envDescription=Your%20DeepSeek%20API%20key%20(server-side%20only%2C%20never%20exposed%20to%20the%20browser)&envLink=https%3A%2F%2Fplatform.deepseek.com%2F&project-name=linxi-ai&repository-name=linxi-ai)

### Local Development

```bash
git clone https://github.com/Stanley0601/linxi-ai.git
cd linxi-ai
npm install
npm run dev
```

Open http://localhost:3000

### Environment Variables

Create `.env.local`:

```bash
LLM_API_KEY=your_deepseek_api_key                # Get one at https://platform.deepseek.com
LLM_BASE_URL=https://api.deepseek.com/v1         # Optional: any OpenAI-compatible endpoint
LLM_MODEL=deepseek-chat                          # Optional: model name
```

> ⚠️ **Never use a `NEXT_PUBLIC_` prefix for the API key** — `NEXT_PUBLIC_` variables are bundled into client-side JavaScript and visible to every visitor. `LLM_API_KEY` stays on the server, where all LLM calls happen (`/api/chat`, `/api/summary`).

> Without an API key, the app runs in **mock mode** with pre-written responses — great for UI development.

---

## 🧠 Core Engines (6 modules)

### 1. Time Acceleration Engine
Story-time runs at **10× real-time**. The AI doesn't reply instantly — it reaches out at "natural" intervals. Early relationship = slower replies. As you get closer = faster responses. This **uncertainty creates anticipation**.

### 2. Mood State Machine
5 emotional states (happy / calm / excited / anxious / low). Your words **shift the AI's mood in real-time**:
- Encouragement → mood brightens, tone becomes playful
- Criticism → mood drops, replies get shorter

### 3. Conversation Memory (LLM Summaries)
On chat exit, an LLM generates a memory summary — topics discussed, user attitude, **and what the AI itself said**. Next session, the AI naturally references past conversations.

### 4. Silent Interest Extraction
No forms or preference surveys. The system detects **100+ interest keywords** from natural conversation and routes the AI toward topics you care about — without the user noticing any algorithm.

### 5. Informational Companionship
Not just emotional support — the AI acts as a **well-informed friend**. Sports scores, movie recommendations, trending news — blended naturally into conversation.

### 6. Realism System
The AI sends **stickers** (6 emotion types), **selfies** (multi-scene photo pool), and **posts to a social feed** (with AI-generated captions). Complete "alive" presence.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│  UI Layer     Next.js 16 · TypeScript · Tailwind    │
│               Framer Motion · App Router            │
├─────────────────────────────────────────────────────┤
│  AI Layer     DeepSeek Chat API · Dynamic Prompts   │
│               Memory Summaries · Emotion Analysis   │
├─────────────────────────────────────────────────────┤
│  Engine       Mood FSM · Time Accelerator           │
│  Layer        Interest Extractor · Proactive Msgs   │
│               Sticker Engine · Selfie System        │
├─────────────────────────────────────────────────────┤
│  Infra        Vercel / CloudBase · Static Export    │
│               localStorage Persistence              │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main app state machine
│   ├── globals.css                 # Global styles
│   └── api/
│       ├── chat/route.ts           # Chat API (server-side)
│       └── summary/route.ts        # Memory summary generation
├── components/
│   ├── Landing.tsx                 # Splash screen
│   ├── StorySelect.tsx             # Character selection
│   ├── MessageListPage.tsx         # Chat list (messaging app style)
│   ├── ChatView.tsx                # Main chat interface
│   ├── ChatBubbles.tsx             # Message bubbles + stickers
│   ├── MomentsFeed.tsx             # Social feed / "moments"
│   └── BottomTabBar.tsx            # Tab navigation
├── lib/
│   ├── chat-engine.ts              # Core conversation engine
│   ├── chat-summary.ts             # Memory summary system
│   ├── mood-engine.ts              # Mood state machine (5 states)
│   ├── time-engine.ts              # Time acceleration (10×)
│   ├── interest-context.ts         # Interest extraction (100+ keywords)
│   ├── proactive-messages.ts       # Proactive message scheduler
│   ├── stickers.ts                 # Sticker engine
│   ├── selfies.ts                  # Selfie/photo system
│   ├── prompts.ts                  # Prompt engineering templates
│   ├── llm-client.ts              # LLM API client (DeepSeek)
│   ├── characters.ts               # Character definitions
│   └── memory.ts                   # Local state persistence
└── types/
    └── index.ts                    # TypeScript definitions
```

---

## 🔧 Configuration

### Swap LLM Provider

The project uses DeepSeek by default, but you can swap to **any OpenAI-compatible API** via environment variables — no code changes needed:

```bash
LLM_BASE_URL=https://api.openai.com/v1   # or any compatible endpoint
LLM_MODEL=gpt-4o-mini                     # or any model
```

Works with: OpenAI, Anthropic (via proxy), Groq, Together AI, Ollama, etc.

### Add Characters

Edit `src/lib/characters.ts` to add your own AI personas:

```typescript
{
  id: "your-character",
  name: "Alex",
  identity: "a 22-year-old indie game developer",
  personality: "creative, slightly chaotic, sends memes at 3am",
  speakingStyle: "casual, lots of abbreviations, occasional deep thoughts"
}
```

---

## 🚀 Deployment

### Vercel (Recommended)

Click the deploy button above, or:

```bash
npm i -g vercel
vercel --prod
```

Set `LLM_API_KEY` in your Vercel project settings (server-side environment variable).

### Docker

```bash
docker build -t linxi-ai .
docker run -p 3000:3000 -e LLM_API_KEY=sk-xxx linxi-ai
```

> Static export is not supported: the app relies on server-side API routes (`/api/chat`, `/api/summary`) to keep the LLM API key off the client and to power memory summaries. Deploy to any Node.js-capable host (Vercel, CloudBase server hosting, Docker, etc.).

---

## 🗺️ Roadmap

- [ ] Multi-language support (i18n)
- [ ] Voice messages (TTS integration)
- [ ] Multi-character interactions (characters talk to each other)
- [ ] User-created custom characters
- [ ] Plugin system for extending engines
- [ ] Telegram / Discord / LINE adapters

---

## 🤝 Contributing

PRs welcome! Areas that need help:

- **More characters** with diverse personalities
- **i18n** — translate UI strings
- **New engines** — e.g., photo generation, voice
- **Platform adapters** — Telegram bot, Discord bot, etc.

---

## 📄 License

MIT — use it however you want. Attribution appreciated but not required.

---

<p align="center">
  <b>If this helped you build something cool, star the repo ⭐</b>
</p>
