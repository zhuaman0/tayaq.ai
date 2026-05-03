# Tayaq.ai — AI English Tutor with Speech-to-Speech Interface

## Project Overview

**Tayaq.ai** is a voice-first AI English tutor that uses "tough love" to teach Kazakh-speaking youth proper English grammar. Students speak English sentences via a push-to-talk interface; the AI detects mistakes, **roasts them in Kazakh** with culturally relevant humor, provides clear grammar corrections (✅/❌), and speaks the response aloud — creating a memorable, speech-to-speech learning loop.

### Core Idea
> "Motivation by pain" — students remember grammar rules because the emotional, funny roasts make lessons stick.

### Tech Stack
- **Frontend:** Nuxt 3 + Tailwind CSS
- **Backend:** Nuxt Server API (H3)
- **LLM:** OpenAI GPT-4o
- **STT:** Browser SpeechRecognition API → upgrade to Whisper
- **TTS:** Browser SpeechSynthesis API → upgrade to ElevenLabs
- **Deploy:** Vercel / Railway

---

## 14-Week Semester Plan

### Phase 1 — Foundation (Weeks 1–3)

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Project setup, research, architecture design | Nuxt project scaffold, tech stack decision doc |
| 2 | Landing page UI (hero, how-it-works, CTA) | Live landing page with age-gate modal |
| 3 | Chat UI + basic text input/output with GPT-4o | Working text-based chat with streaming responses |

### Phase 2 — Voice Pipeline (Weeks 4–6)

| Week | Focus | Deliverable |
|------|-------|-------------|
| 4 | System prompt engineering (Tayaq.ai persona, 8 roast categories, age calibration) | Polished AI persona with consistent output format |
| 5 | Text-to-Speech — AI reads responses aloud | Auto-speak with mute toggle + replay per message |
| 6 | Speech-to-Text — Push-to-Talk microphone input | Working mic button with live transcript + auto-send |

### Phase 3 — Premium Voice & Quality (Weeks 7–9)

| Week | Focus | Deliverable |
|------|-------|-------------|
| 7 | Upgrade TTS to ElevenLabs (Kazakh-style authoritative voice) | High-quality AI voice, custom voice selection |
| 8 | Upgrade STT to OpenAI Whisper (server-side, higher accuracy) | Server API route for audio transcription |
| 9 | Conversation memory + lesson tracking (store corrections, track progress) | User can see past mistakes and improvements |

### Phase 4 — User Experience & Growth (Weeks 10–12)

| Week | Focus | Deliverable |
|------|-------|-------------|
| 10 | User auth (Google/email login) + profile persistence | Users keep their history across sessions |
| 11 | Gamification — streaks, XP, leaderboard, achievement badges | "Days survived" counter, roast intensity unlocks |
| 12 | Scenarios / Conversation modes (job interview, ordering food, casual chat) | Scenario picker before chat begins |

### Phase 5 — Launch (Weeks 13–14)

| Week | Focus | Deliverable |
|------|-------|-------------|
| 13 | Mobile optimization, PWA support, performance tuning | Responsive on all devices, installable as app |
| 14 | Beta launch, user testing, bug fixes, final presentation | Public beta URL, demo video, presentation deck |

---

## Current Progress (Weeks 1–6 ✅)

- ✅ Nuxt 3 project with Tailwind CSS
- ✅ Landing page with hero, roast examples, age-gate modal
- ✅ Chat UI with streaming GPT-4o responses + suggestion chips
- ✅ Tayaq.ai persona — 8 roasting categories, age-calibrated intensity
- ✅ Text-to-Speech (browser SpeechSynthesis) — auto-speak + mute + replay
- ✅ Push-to-Talk (browser SpeechRecognition) — mic button + live transcript

**Status: Phase 2 complete. Ready to begin Phase 3.**

---

## Team

| Role | Name |
|------|------|
| Developer | Zumagali Aman |

## Links

- **Repo:** Local development
- **Live (dev):** http://localhost:3000
