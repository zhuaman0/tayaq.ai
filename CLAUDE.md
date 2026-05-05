# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

Tayaq.ai is a hyper-localized AI English tutor for Kazakh youth. The repo contains **two unrelated applications** that share no runtime code:

1. **Nuxt 4 web app** (root + `app/`, `server/`) — the actual product: a chat UI that streams responses from OpenAI, with a "Қатал Мұғалім" (Strict Teacher) persona that roasts grammar mistakes in Kazakh.
2. **Console app** (`console-app/`) — a self-contained Node.js CLI built for INF 395 Assignment 2 ("Resilient Service" prototype). It manages English lessons through a state machine and is intentionally dependency-free (built-ins only). It does not import from or depend on the Nuxt app.

When asked to work in one, do not pull patterns from the other unless explicitly asked.

## Commands

```bash
npm install            # install Nuxt deps (postinstall runs `nuxt prepare`)
npm run dev            # Nuxt dev server on http://localhost:3000
npm run build          # production build
npm run generate       # static generation
npm run preview        # preview production build
node console-app/index.js   # run the console app (no npm script in committed package.json)
```

Note: README.md mentions `npm run console`, but that script is **not** in committed `package.json` — it currently appears as an uncommitted local change. Run the file directly as shown above unless re-adding the script.

There is no test suite, no linter config, and no typecheck script. `tsconfig.json` only references generated `.nuxt/*` configs — type checking happens through Nuxt/Vue tooling at dev/build time.

## Web app architecture

**Streaming chat path.** The frontend never talks to OpenAI directly — the API key is server-only via `runtimeConfig.openaiApiKey` in `nuxt.config.ts` and is read inside the Nitro route. Three layers wired together:

- `app/composables/useChat.ts` — owns message state, picks an age-appropriate Kazakh welcome greeting, posts to `/api/chat`, and parses the SSE stream chunk-by-chunk (`data: {...}\n\n`, terminated by `data: [DONE]`).
- `server/api/chat.post.ts` — Nitro event handler. Validates the API key, builds the system prompt, calls `openai.chat.completions.create({ stream: true })`, and pipes deltas back as SSE via a `ReadableStream`. Errors during streaming are emitted as `{error}` events on the same stream rather than HTTP errors.
- `server/utils/persona.ts` — `buildSystemPrompt({ age })` selects one of five roast intensity tiers (MILD ≤15, SPICY ≤20, PAINFUL ≤25, BRUTAL ≤30, NO MERCY 30+) and embeds it in a fixed response-format contract (Roast → Correction → Explanation → Practice). When changing tutor behavior, edit this file — the API route just forwards messages.

The user's `age` is passed from the client on every request and re-evaluated server-side, so changing the tier boundaries is a one-file change.

**Pages and layouts.** `app/pages/index.vue` is the landing page; `app/pages/chat.vue` is the chat UI and uses the `chat` layout. Tailwind theme extensions (brand/accent/kazakh color groups, Inter/Outfit fonts) live in `tailwind.config.js`; global CSS in `app/assets/css/main.css`.

## Console app architecture (`console-app/`)

Three-stage finite state machine for lesson lifecycles, with a synchronous file-backed store. Designed to demonstrate caching + persistence + logging, so the patterns are intentional:

- `stateMachine.js` — defines `STAGES = ['Created', 'InProgress', 'Completed']` and an allowlist `TRANSITIONS` map. `validateTransition` throws on illegal moves; `Completed` is terminal. **Add new stages here, not in callers.**
- `lessonStore.js` — CRUD over `console-app/db.json`. Uses `fs.writeFileSync` for crash-safety (every mutation flushes immediately) and an in-memory `cache` object that resets on restart. `getLesson` is the only cache-aware read; `getAllLessons`/`searchByStatus` always re-read the file. The cache logs `CACHE_HIT` / `CACHE_MISS` events — preserve this behavior, it's part of the assignment demo.
- `logger.js` — appends to `console-app/log.txt` with `appendFileSync` and prints colored output. Categories: `ACTION`, `TRANSITION`, `CACHE_HIT`, `CACHE_MISS`, `ERROR`, `SEARCH`.
- `index.js` — readline-based menu (1–6). The entry point.

`db.json` and `log.txt` are git-ignored runtime files and are auto-created on first run.

## Things to know

- ESM everywhere (`"type": "module"` in `package.json`). Use `import`/`export`, not `require`.
- The committed `.env` is git-ignored by `.gitignore`, but **the working tree contains a real-looking `OPENAI_API_KEY`**. Do not echo it back, paste it into commits, or include it in any output. If asked to wire up env handling, prefer `.env.example` with a placeholder.
- PowerShell on Windows: chain commands with `;` and `if ($?)`, not `&&`. The console app uses `import.meta.dirname`, which requires Node 20+.
- Commit-message style on this repo is mixed; recent commits follow Conventional Commits (`feat:`, `docs:`, `chore:`). Match that.
