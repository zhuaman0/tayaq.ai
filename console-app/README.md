# English Lesson Manager — INF 395 Assignment 2

A console-based "Resilient Service" prototype for the Tayaq.ai platform.
Demonstrates stateful workflow, caching, file persistence, and logging.

## Quick Start

```bash
npm run console
```

## Project Structure

```
console-app/
├── index.js          # Console menu (entry point)
├── stateMachine.js   # Workflow logic + transition validation
├── lessonStore.js    # Cache + file persistence (CRUD)
├── logger.js         # Logging to log.txt
├── db.json           # Auto-created JSON database
└── log.txt           # Auto-created action log
```

## Features

- **Stateful Workflow** — 3 stages (Created → InProgress → Completed) with validation
- **Caching** — In-memory dictionary with CACHE MISS/HIT logging
- **Persistence** — JSON file with synchronous writes (crash-safe)
- **Logging** — Every action recorded with ISO timestamps
- **Console Menu** — Create, update, view, search, list lessons

## Tech Stack

- Node.js (v18+)
- JavaScript (ESM)
- Built-in modules only — no external dependencies

## Documentation

- [DEFENSE_GUIDE.md](./DEFENSE_GUIDE.md) — Step-by-step demo instructions
- [SPEECH.md](./SPEECH.md) — Presentation speech text (English)

## Team

- Zhumagali Aman
- Rustamov Shokhrukh
- Abyz Nuradil

SDU — Suleyman Demirel University
