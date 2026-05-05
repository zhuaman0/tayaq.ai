# Database migrations

Run these in order against the correct Supabase project. They are written
plain so you can paste them into the Supabase SQL editor — no migration
tool required.

## Order

1. `001_daily_challenge.sql` — `daily_challenges`, `daily_challenge_completions` + RLS
2. `002_vocab_lookup_cache.sql` — global vocab lookup cache (read-shared, server-write only)
3. `003_tts_cache.sql` — TTS cache table; **also** create the `tts-cache` storage bucket (SQL block at the bottom of that file is commented out — uncomment or run via dashboard).

## After migrations run

The runtime code in `server/api/` already calls these tables. Until they
exist, the relevant endpoints fail open:

- vocab lookup → re-calls OpenAI on every request (no cache)
- TTS → re-synthesizes every time (no cache)
- Daily challenge → returns 500 (no fallback; the feature won't work without the tables)

## Required env

The handlers expect these in the runtime env (Nuxt picks them up via
`runtimeConfig.supabaseServiceKey` / `process.env.SUPABASE_URL`):

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
OPENAI_API_KEY=<...>
```

## Notes

- The vocab cache is **global** — one row per word, shared by all users —
  to maximize OpenAI cost savings. If you ever want per-user customization,
  add a `user_id` column and adjust the upsert.
- TTS cache stores audio in a public bucket so the URL can be served
  directly to the browser without re-signing. Switch to private + signed
  URLs in `tts.post.ts` if you need privacy.
- Daily challenge XP defaults: 50 for fully correct, 20 for partial
  (score ≥ 60). Tweak `XP_PERFECT` / `XP_PARTIAL` in
  `server/api/daily-challenge/submit.post.ts`.
