# Defense Speech — INF 395 Assignment 2
### Total time: 2-3 minutes

---

## Slide 1: Title

> Hello everyone. We are Team Tayaq.ai — Zhumagali Aman, Rustamov Shokhrukh, and Abyz Nuradil.
>
> Today we will present our Resilient Service Prototype — an English Lesson Manager built with Node.js.

**Time: ~10 seconds**

---

## Slide 2: System Architecture

> Our system has four modules.
>
> First, **index.js** — this is the console menu where the user interacts with the system.
>
> Second, **stateMachine.js** — this handles the workflow logic and validates all stage transitions.
>
> Third, **lessonStore.js** — this is the core module. It manages the cache and file persistence. All data is saved to a JSON file using writeFileSync.
>
> And fourth, **logger.js** — this records every action to a log.txt file with timestamps.
>
> The data flows like this: user input goes through state machine validation, then gets saved to the file database, cached in memory, and logged.

**Time: ~30 seconds**

---

## Slide 3: Stateful Workflow

> Our main object is a Lesson, and it moves through three stages: Created, InProgress, and Completed.
>
> We use an allowlist pattern — only specific transitions are allowed. Created can only go to InProgress. InProgress can only go to Completed. And Completed is the final stage — nothing can be changed after that.
>
> If someone tries to skip a stage — for example, jumping from Created directly to Completed — the system blocks it with an error message.

**Time: ~20 seconds**

---

## Slide 4: Stateful Workflow — PROOF

> Here you can see the terminal output.
>
> When we tried to go from Created to Completed, the system showed an error: "Illegal transition." It tells us that the next valid stage is InProgress.
>
> And when we tried to modify a Completed lesson, it said: "Final stage, cannot be modified."
>
> So all illegal transitions are blocked.

**Time: ~15 seconds**

---

## Slide 5: Caching Mechanism

> For caching, we use a simple JavaScript object as an in-memory dictionary.
>
> When we request a lesson for the first time, the system reads from the JSON file — this is a Cache Miss.
>
> The second time we request the same lesson, it comes from memory — this is a Cache Hit. No file reading needed, so it is much faster.
>
> The cache resets when the program restarts. This is correct behavior — after a crash, everything loads fresh from the file.

**Time: ~20 seconds**

---

## Slide 6: Caching — PROOF

> Here is the proof. After restarting the program, we requested lesson L-1001.
>
> The first request shows Cache Miss — loaded from file.
>
> The second request shows Cache Hit — loaded from cache.
>
> The log.txt file also confirms both entries with timestamps.

**Time: ~10 seconds**

---

## Slide 7: File-Based Persistence

> We use a JSON file called db.json as our database.
>
> The key function here is writeFileSync. This is a synchronous write — it means the program stops and waits until the operating system confirms the data is written to disk.
>
> So even if the program crashes right after saving, the data is already safe on the file. This is why we pass the crash test.
>
> Every lesson also stores timestamps for each stage change.

**Time: ~20 seconds**

---

## Slide 8: Crash Test — PROOF

> Here is the crash test. We updated a lesson from Created to InProgress.
>
> Then we killed the program with Ctrl+C.
>
> After restarting, we checked the lesson — and the status is still InProgress. The data survived the crash.
>
> This works because writeFileSync saves data to disk before anything else can happen.

**Time: ~15 seconds**

---

## Slide 9: Logging & CIA Triad

> Every action in our system is recorded in log.txt with an ISO timestamp. We use appendFileSync, which is append-only — so the log also survives crashes.
>
> Now about the CIA Triad.
>
> **Confidentiality** — all data is stored locally. There is no network transmission and no external API calls.
>
> **Integrity** — the state machine prevents illegal changes. Timestamps create an audit trail, and the log file is append-only.
>
> **Availability** — the system recovers from crashes thanks to file persistence. The cache makes repeated requests faster. And there is no dependency on external databases.

**Time: ~25 seconds**

---

## Slide 10: Enhanced Features

> Our console application has a user-friendly menu with six options: create a lesson, update status, view by ID, search by status, list all lessons, and exit.
>
> All input is validated — empty fields are rejected, and illegal transitions are blocked automatically.
>
> Every stage change records a timestamp.

**Time: ~10 seconds**

---

## Slide 11: Live Demo

> Now we will demonstrate the three tests live.
>
> First — the Cache Test. Second — the Crash Test. Third — the Logic Test.

**Time: ~5 seconds, then switch to terminal**

---

## Slide 12: Thank You

> That is our presentation. Thank you for your attention.
>
> We are ready for questions.

**Time: ~5 seconds**

---

## Total estimated time: ~3 minutes (presentation) + live demo
