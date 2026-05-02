# Defense Cheatsheet — Quick Commands

## Before defense (clean start)

```bash
cd ~/Desktop/tayaqai
rm -f console-app/db.json console-app/log.txt
```

## Start the app

```bash
npm run console
```

---

## Live Demo Order

### Test 1 — Create lesson
```
1
Aisulu
Past Simple Tense
```
Result: `[ACTION] Created lesson L-1001`

### Test 2 — CACHE TEST (after restart)

Exit (`6`), then `npm run console` again.

```
3
L-1001
```
Result: `[CACHE_MISS] loaded from file`

```
3
L-1001
```
Result: `[CACHE_HIT] loaded from cache`

### Test 3 — LOGIC TEST (illegal transition)
```
2
L-1001
Completed
```
Result: `ERROR: Illegal transition from "Created" to "Completed"`

Then valid transition:
```
2
L-1001
InProgress
```
Result: `Lesson L-1001 advanced to InProgress`

### Test 4 — CRASH TEST

Press `Ctrl + C` to kill the program.

Restart: `npm run console`

```
3
L-1001
```
Result: `Status: InProgress` ✅ data survived crash

### Test 5 — Show log.txt (bonus)

Open new terminal:
```bash
cat console-app/log.txt
```

---

## CIA Triad — Key Phrases

- **Confidentiality:** "Data stored locally, no network transmission"
- **Integrity:** "State machine prevents illegal changes, timestamps are an audit trail"
- **Availability:** "writeFileSync ensures crash recovery, cache speeds up reads"

---

## If something breaks

| Problem | Fix |
|---------|-----|
| Lesson not found | Check ID format: `L-1001` (uppercase L) |
| db.json corrupt | `rm console-app/db.json` and restart |
| Wrong directory | `cd ~/Desktop/tayaqai` |
