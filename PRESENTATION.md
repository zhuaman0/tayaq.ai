# INF 395 — 1st Assignment: Phase 1 Kickoff Presentation
## Tayaq.ai — AI English Tutor with Speech-to-Speech Interface

---

## 👥 Team Members & Roles

| Member | Role | Responsibilities |
|--------|------|-----------------|
| Zumagali Aman | Full-Stack Developer & Project Lead | Architecture, frontend (Nuxt 3), backend (Node/H3), AI integration (GPT-4o), speech pipeline (STT/TTS), deployment |

---

## 📌 Project Domain / Problem

### The English Education Crisis in Central Asia

Kazakhstan is investing heavily in trilingual education (Kazakh, Russian, English), yet English proficiency remains critically low:

| Statistic | Source |
|-----------|--------|
| Kazakhstan ranks **89th out of 116 countries** in English proficiency — "Very Low" tier, scoring only **4.57 out of 100** | EF English Proficiency Index, 2024 |
| **72% of students** lose focus within 10 minutes of a traditional lecture-style lesson | Microsoft Research / Pearson Study, 2023 |
| **95% of language app users** quit within the first month — only 5% retention after 30 days | Duolingo public data, 2023 |
| **80% of Kazakh university graduates** cannot hold a basic English conversation despite 10+ years of classes | National Testing Center of Kazakhstan |
| Students spend **3.5 hours/day** on TikTok/Instagram but less than **15 minutes** on studying | DataReportal Kazakhstan Digital Report, 2024 |

### Root Causes

| Problem | Why It Hurts |
|---------|-------------|
| **Boring, repetitive drills** | Zero emotional engagement → students forget |
| **No speaking practice** | Students read/write but never speak |
| **Fear of making mistakes** | Students stay silent to avoid embarrassment |
| **No cultural connection** | Foreign textbooks feel irrelevant to Kazakh youth |
| **Expensive private tutors** | $15–30/hour, inaccessible for most families |

### Our Insight

> **People remember embarrassing and emotional moments forever.** If grammar corrections are delivered as funny, culturally relevant Kazakh roasts — the lessons stick. **Pain = Memory = Learning.**

---

## 🎯 Scope & Main Goals

### What is Tayaq.ai?

A **voice-first AI English tutor** that uses "tough love" and Kazakh humor to teach grammar:

1. 🎤 Student **speaks** English via Push-to-Talk
2. 🧠 AI **detects** mistakes using GPT-4o
3. 🔥 AI **roasts** mistakes in Kazakh (8 culturally relevant humor categories)
4. ✅ AI **teaches** the correct grammar with clear ✅/❌ format
5. 🔊 AI **speaks** the response aloud via Text-to-Speech

### Goals

| # | Goal | Success Metric |
|---|------|----------------|
| 1 | Make English practice **addictive** | >30% 30-day retention (vs. 5% industry avg) |
| 2 | Train **actual speaking** skills | 50+ sentences spoken per session |
| 3 | **Cultural relevance** — Kazakh humor for Gen Z | 8 roast categories with KZ slang/references |
| 4 | **Accessible** — free, web-based, no download | Works on any device with browser + mic |
| 5 | **Adaptive** — age-calibrated intensity | 5 levels: Mild → Spicy → Painful → Brutal → No Mercy |

### Target Users

- 🎯 **Primary:** Kazakh-speaking youth aged 15–30 learning English
- 🎯 **Secondary:** English teachers seeking AI-assisted tools
- 🎯 **Tertiary:** Any L2 English learner who enjoys humor-driven learning

---

## 📦 Expected Outputs / Outcomes

### Deliverables

| Output | Description | Status |
|--------|-------------|--------|
| **Web Application** | Nuxt 3 + Tailwind CSS, deployed publicly | ✅ In progress |
| **AI Persona** | "Tayaq.ai" — 8 roast categories, bilingual KZ/EN, age-calibrated | ✅ Done |
| **Speech Pipeline** | Push-to-Talk (STT) → GPT-4o → Voice Response (TTS) | ✅ Done |
| **Landing Page** | Conversion-optimized with demo roasts + age gate | ✅ Done |
| **Chat Interface** | Streaming responses, subtitles, TTS, suggestion chips, mic input | ✅ Done |
| **User Accounts** | Auth + progress tracking + lesson history | 🔲 Phase 4 |
| **Gamification** | Streaks, XP, badges, leaderboard | 🔲 Phase 4 |
| **Beta Launch** | Public URL with real user testing + demo video | 🔲 Phase 5 |

### Expected Outcomes

- 📈 Students **practice speaking daily** — low friction, available 24/7
- 📈 **Grammar retention improves** — emotional learning > rote memorization
- 📈 **Speaking confidence grows** — safe AI environment, no peer judgment
- 📈 **Cultural pride** — first AI tutor that speaks "their language" (Kazakh humor)

---

## ⚠️ Challenges / Constraints

### Technical Challenges

| Challenge | Mitigation Strategy |
|-----------|-------------------|
| Browser STT quality limited & Chrome-only | Upgrade to OpenAI Whisper (server-side) in Phase 3 |
| Browser TTS sounds robotic | Upgrade to ElevenLabs with custom Kazakh-style voice |
| LLM sometimes breaks output format | Strong system prompt + output validation layer |
| Latency (STT → LLM → TTS roundtrip) | Streaming responses + 70-word limit per response |
| Kazakh language TTS — very few voice options | Use Russian voices as fallback (mutually intelligible for youth) |

### Project Constraints

| Constraint | Impact |
|-----------|--------|
| **Solo developer** | Scope limited to core features per phase |
| **14-week deadline** | Must prioritize and ship core loop first |
| **API costs** | OpenAI + ElevenLabs billed per request — need budget control |
| **No native mobile app** | Web-only + PWA as compromise |
| **Content moderation** | Roasts must be funny, never abusive — requires careful prompt engineering |
| **OpenAI quota limits** | Free tier limited — need billing setup for production use |

---

## 📅 14-Week Implementation Plan

```
Phase 1 ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░  Weeks 1–3   Foundation
Phase 2 ░░░░░░▓▓▓▓▓▓░░░░░░░░░░░░░░░░  Weeks 4–6   Voice Pipeline
Phase 3 ░░░░░░░░░░░░▓▓▓▓▓▓░░░░░░░░░░  Weeks 7–9   Premium Voice
Phase 4 ░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓░░░░  Weeks 10–12 UX & Growth
Phase 5 ░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓  Weeks 13–14 Launch
```

### Phase 1 — Foundation (Weeks 1–3) ✅ COMPLETE

| Week | Task | Deliverable |
|------|------|-------------|
| 1 | Project setup, research, architecture design | Nuxt 3 project scaffold, tech stack decision |
| 2 | Landing page UI (hero, how-it-works, CTA) | Live landing page with age-gate modal |
| 3 | Chat UI + GPT-4o text integration | Working text chat with streaming responses |

### Phase 2 — Voice Pipeline (Weeks 4–6) ✅ COMPLETE

| Week | Task | Deliverable |
|------|------|-------------|
| 4 | System prompt engineering (persona, 8 roast categories) | Tayaq.ai persona with age calibration |
| 5 | Text-to-Speech (auto-speak + mute + replay) | AI speaks responses aloud |
| 6 | Speech-to-Text (Push-to-Talk microphone) | Mic button with live transcript + auto-send |

### Phase 3 — Premium Voice & Quality (Weeks 7–9)

| Week | Task | Deliverable |
|------|------|-------------|
| 7 | Upgrade TTS → ElevenLabs (authoritative KZ voice) | High-quality AI voice |
| 8 | Upgrade STT → OpenAI Whisper (server-side) | Accurate multi-accent transcription |
| 9 | Conversation history + lesson tracking | Track mistakes, show progress over time |

### Phase 4 — User Experience & Growth (Weeks 10–12)

| Week | Task | Deliverable |
|------|------|-------------|
| 10 | User authentication (Google login) + profiles | Cross-session data persistence |
| 11 | Gamification (streaks, XP, badges, leaderboard) | "Days survived" counter, achievements |
| 12 | Conversation scenarios (job interview, restaurant) | Scenario picker before chat begins |

### Phase 5 — Launch (Weeks 13–14)

| Week | Task | Deliverable |
|------|------|-------------|
| 13 | Mobile optimization, PWA, performance tuning | Responsive on all devices, installable |
| 14 | Beta launch, user testing, final presentation | Public URL + demo video + presentation |

---

### 🟢 Current Status: Phase 2 Complete (Week 6 of 14)

**What's working today:**
- ✅ Landing page with hero section, roast examples, age-gate modal
- ✅ Chat UI with GPT-4o streaming + suggestion chips
- ✅ Tayaq.ai persona — 8 Kazakh roasting categories, 5 age-calibrated levels
- ✅ Text-to-Speech — auto-speak, mute toggle, per-message replay
- ✅ Push-to-Talk — mic button with live transcript + auto-send

---

*Tayaq.ai — Ауырмай шыдамай, ағылшын тілін үйренбейсің!*
*(Without pain and patience, you won't learn English!)*
