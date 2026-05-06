# Tayaq.ai 🔥

> The AI English tutor that roasts you in Kazakh, then actually teaches you. Built for Gen Z and Millennial Kazakh learners who got bored of "London is the capital of Great Britain."

**Live:** [tayaqai.vercel.app](https://tayaqai.vercel.app) · **Stack:** Nuxt 4 · Vue 3 · OpenAI Realtime · Supabase · Vercel

---

## What it does

Tayaq.ai gives you a **savage but caring AI tutor** named **Қатал Мұғалім** ("strict teacher") who speaks primarily in Kazakh and weaves in English for examples, vocabulary, and grammar terms — the way a real Kazakh teacher actually teaches.

When you make a mistake, the tutor roasts you using **Уятай subculture, modern Kazakh memes, and "ел не дейді" cultural pressure** (calibrated to your age — gentler for 15, brutal at 30+). Then explains the rule, asks you to repeat, and tracks your progress so you keep advancing.

---

## Features

### 🎤 Live Voice Tutor — `/live`
Push-to-talk realtime conversation with the AI. Powered by **OpenAI Realtime API** (`gpt-realtime-1.5`, voice `cedar`) over WebRTC.

- **Push-to-talk:** hold the mic button, speak in English, release to send
- **Live subtitles:** your speech captioned at the bottom, AI's reply at the top, both stream incrementally
- **Bilingual flow:** AI speaks Kazakh as the primary language, English for the phrases being taught
- **5-minute session cap:** hard timer in the header to control OpenAI Realtime cost (~$1-2 per session)
- **Auto-redirect:** if you ask "I want to practice writing" the AI tells you to switch to `/chat`

### ✍️ Text Chat Tutor — `/chat`
Streaming text-based tutor for writing practice. Same Қатал Мұғалім persona, GPT-4-class model, age-calibrated roasts plus structured grammar corrections (✅ correct / ❌ wrong format).

### 📚 Curriculum + Cross-Session Progression
Three CEFR-aligned levels with topic progression baked into the prompt:

- **Beginner (A1-A2):** greetings, food, home, family, numbers, colors — present simple, articles, to-be
- **Intermediate (B1-B2):** work, travel, opinions, eating out, tech, school — past/perfect tenses, modals, conditionals
- **Advanced (C1-C2):** business, idioms, phrasal verbs, debate, formal register — subjunctive, inversion, mixed conditionals

The AI itself decides when you've mastered a topic via **OpenAI Realtime function calling** (`mark_topic_mastered`) and advances you to the next one. When all topics in a level are done, you bump up automatically. Returning visitors see a **"📚 Picking up where you left off"** banner with their saved level + topic.

### 🎥 YouTube Vocabulary Extractor — `/vocab` (YouTube tab)
Paste any YouTube video with English captions → AI extracts the 12 most useful intermediate-advanced words with definitions, transcript-anchored examples, and Kazakh translations. Add them to your vocab collection in one click.

Production-grade transcript fetching via **Supadata.ai** (works on Vercel where direct YouTube scraping is blocked by datacenter IP filtering).

### 🃏 Vocabulary System — `/vocab`
- **Words tab:** all your saved words, searchable, with examples and translations
- **Collections:** organize words into custom decks
- **Flashcards:** spaced-repetition-style review
- **Quiz:** multiple-choice tests on saved vocab
- **Lookup:** instant word lookup with AI-generated definition + example + Kazakh translation

### 📝 Grammar — `/grammar`
On-demand grammar topic explanations with examples and practice prompts.

### 🔥 Challenge Mode — `/challenge`
Timed grammar/vocab challenges to drill specific skills.

### 🏆 Leaderboard — `/leaderboard`
City-based and global ranking by XP, streak days, and topics mastered.

### 🗺️ Community Map — `/map`
H3-indexed geographic heatmap of active learners. See where Tayaq is being used across Kazakhstan.

### 💬 Community — `/community`
Direct messaging between users for language exchange and study buddy connections.

### 👤 Profiles + Auth — `/login`, `/register`, `/profile`
Supabase Auth (email + Google OAuth). Profile shows XP, streak, mastered topics, location, bio.

### 🔥 Daily Streak System
Login streak counter persisted in `profiles` — visible on profile + leaderboard.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Nuxt 4 (Vue 3, SSR), TailwindCSS, custom design tokens |
| Realtime voice | OpenAI Realtime API (gpt-realtime-1.5) over WebRTC, ephemeral tokens |
| Text AI | OpenAI SDK (GPT-4o-class for chat, GPT-4.1 for vocab extraction) |
| Speech | OpenAI Whisper (STT) + TTS endpoints |
| YouTube transcripts | Supadata.ai (primary) + youtube-transcript (local dev fallback) |
| Database + auth | Supabase (Postgres + Auth + Realtime) with `@nuxtjs/supabase` |
| Hosting | Vercel (auto-deploy on push to main) |
| Geo | H3 hexagonal indexing for heatmap |

---

## Project Structure

```
app/
├── pages/         13 routes — index, chat, live, vocab, grammar, challenge,
│                  leaderboard, community, map, login, register, profile/
├── composables/   useRealtimeVoice, useDeviceId, useChat, useSTT, useTTS,
│                  useGeminiLive, useMessages, useEnsureProfile
└── layouts/       default + chat layouts

server/
├── api/
│   ├── chat.post.ts                Text tutor with streaming
│   ├── realtime-token.get.ts       Mints ephemeral OpenAI Realtime tokens
│   │                               + injects mark_topic_mastered tool
│   ├── progress.{get,post}.ts      Curriculum progression CRUD
│   ├── stt.post.ts, tts.post.ts    Whisper transcription / TTS
│   ├── streak.post.ts              Daily login streak tracking
│   ├── youtube/analyze.post.ts     YouTube → vocab extraction
│   ├── vocab/                      Words + collections CRUD + lookup
│   └── geo/                        Heatmap, schools, events
└── utils/
    ├── persona.ts                  Қатал Мұғалім text persona + roast intensity
    ├── voicePersona.ts             Voice-tuned Kazakh-primary persona
    ├── curriculum.ts               Levels, topics, vocabulary, mastery logic
    ├── progress.ts                 Supabase progress read/write
    └── supabaseAdmin.ts            Service-role client

supabase/
├── setup.sql                       profiles, messages, chat_sessions,
│                                   audit_log, daily_stats
├── vocab_table.sql                 vocabulary saved words
└── learning_progress_table.sql     Cross-session curriculum progression
```

---

## Setup

### 1. Clone + install

```bash
git clone https://github.com/zhuaman0/tayaq.ai.git
cd tayaq.ai
npm install
```

### 2. Environment variables

Create `.env` in the project root:

```bash
# OpenAI — text chat, voice tutor, STT, TTS, vocab extraction
OPENAI_API_KEY=sk-...

# Supabase — auth, profiles, vocab, progress, leaderboard
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>
NUXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=<anon-key>

# Supadata — YouTube transcript fetching (free tier 100/month)
# Sign up at https://supadata.ai
SUPADATA_API_KEY=

# Optional: Google Gemini (legacy, kept for fallback)
GEMINI_API_KEY=
```

### 3. Run Supabase migrations

In your Supabase project dashboard → **SQL Editor** → run each file in order:

```bash
supabase/setup.sql                  # profiles, messages, chat_sessions
supabase/vocab_table.sql            # vocabulary
supabase/learning_progress_table.sql # curriculum progression
```

### 4. Run dev server

```bash
npm run dev
# → http://localhost:3000
```

### 5. Console app (separate INF 395 capstone artifact)

There's also a Node.js console resilient-service prototype in [`console-app/`](console-app/):

```bash
npm run console
```

See [`console-app/README.md`](console-app/README.md) for the cache/crash/logic test protocol.

---

## Deployment (Vercel)

Project auto-deploys on push to `main` via Vercel's GitHub integration. Environment variables are set in **Vercel → Project Settings → Environment Variables** (Production scope), not in this repo. After updating any env var, trigger a redeploy from **Deployments → ⋯ → Redeploy** (without "Use existing build cache").

---

## Team

INF 395 capstone, SDU University:
- **[@nuradilabyz](https://github.com/nuradilabyz)** — Live voice tutor, curriculum, progression
- **[@zhuaman0](https://github.com/zhuaman0)** — Vocab system, YouTube analyzer, profiles, geo
- A third teammate handles community + leaderboard + design

---

## License

Educational project. Not for commercial redistribution without permission.
