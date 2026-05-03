# Analytics / Aggregated Table — `daily_stats`

## Why an Aggregated Table?

**Problem:** Raw data queries are slow at scale.

```sql
-- ❌ SLOW: Scans every row in profiles + messages + chat_sessions
SELECT 
  COUNT(DISTINCT p.id) AS active_users,
  COUNT(m.id) AS messages_sent,
  SUM(cs.xp_earned) AS total_xp
FROM profiles p
LEFT JOIN messages m ON m.sender_id = p.id AND m.created_at::date = '2026-02-25'
LEFT JOIN chat_sessions cs ON cs.user_id = p.id AND cs.started_at::date = '2026-02-25'
WHERE p.last_login_at = '2026-02-25';
-- ⏱️ ~500ms with 10K users, ~5s with 100K users
```

**Solution:** Pre-aggregate into one row per city per day.

```sql
-- ✅ FAST: Single row lookup
SELECT * FROM daily_stats WHERE stat_date = '2026-02-25' AND city = 'Almaty';
-- ⏱️ ~2ms always, regardless of user count
```

---

## Table Schema

```sql
CREATE TABLE IF NOT EXISTS daily_stats (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_date   DATE NOT NULL,                -- The date
  city        TEXT,                          -- City (NULL = global total)
  h3_index    TEXT,                          -- H3 hex cell for spatial analytics
  total_users     INTEGER DEFAULT 0,        -- Registered users up to this date
  active_users    INTEGER DEFAULT 0,        -- Users who logged in today
  messages_sent   INTEGER DEFAULT 0,        -- DMs sent today
  sessions_started INTEGER DEFAULT 0,       -- AI chat sessions today
  total_xp_earned INTEGER DEFAULT 0,        -- XP earned today (all users)
  total_mistakes  INTEGER DEFAULT 0,        -- Grammar errors caught today
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stat_date, city)                   -- One row per city per day
);
```

---

## Sample Data

| stat_date | city | h3_index | total_users | active_users | messages_sent | sessions_started | total_xp_earned | total_mistakes |
|---|---|---|---|---|---|---|---|---|
| 2026-02-25 | Almaty | 872d4b... | 1,250 | 340 | 89 | 156 | 4,680 | 312 |
| 2026-02-25 | Astana | 872c19... | 870 | 215 | 52 | 98 | 2,940 | 198 |
| 2026-02-25 | Shymkent | 872e01... | 430 | 87 | 21 | 43 | 1,290 | 86 |
| 2026-02-25 | _NULL_ | _NULL_ | 2,550 | 642 | 162 | 297 | 8,910 | 596 |
| 2026-02-24 | Almaty | 872d4b... | 1,240 | 312 | 76 | 142 | 4,260 | 284 |

> Row with `city = NULL` stores the **global total** for that day.

---

## How It Gets Populated

```mermaid
flowchart LR
    A["📨 Event Queue"] -->|"session.end"| B["Audit Writer"]
    B --> C{"Aggregate"}
    C -->|"UPSERT"| D["daily_stats"]
    
    style A fill:#e94560,color:#fff
    style D fill:#16a34a,color:#fff
```

```sql
-- Called by Audit Writer after each event
INSERT INTO daily_stats (stat_date, city, active_users, sessions_started, total_xp_earned, total_mistakes)
VALUES (CURRENT_DATE, 'Almaty', 1, 1, 30, 5)
ON CONFLICT (stat_date, city)
DO UPDATE SET
  active_users     = daily_stats.active_users + 1,
  sessions_started = daily_stats.sessions_started + 1,
  total_xp_earned  = daily_stats.total_xp_earned + 30,
  total_mistakes   = daily_stats.total_mistakes + 5;
```

> Uses `UPSERT` (`ON CONFLICT ... DO UPDATE`) — creates the row if it doesn't exist, increments if it does.

---

## Performance Comparison

| Approach | Query | Rows Scanned | Time |
|---|---|---|---|
| **Raw query** (no aggregation) | JOIN profiles + messages + sessions | 100,000+ | ~5 sec |
| **Aggregated table** (daily_stats) | Single SELECT by date + city | 1 row | ~2 ms |
| **Speedup** | | | **2,500× faster** |

---

## Use Cases

| Dashboard Widget | Query |
|---|---|
| "Active users today" | `SELECT active_users FROM daily_stats WHERE stat_date = TODAY AND city IS NULL` |
| "XP earned this week in Almaty" | `SELECT SUM(total_xp_earned) FROM daily_stats WHERE city = 'Almaty' AND stat_date >= TODAY - 7` |
| "Growth trend (30 days)" | `SELECT stat_date, total_users FROM daily_stats WHERE city IS NULL ORDER BY stat_date DESC LIMIT 30` |
| "Most active city" | `SELECT city, active_users FROM daily_stats WHERE stat_date = TODAY ORDER BY active_users DESC LIMIT 1` |
| "Mistakes heatmap" | `SELECT h3_index, total_mistakes FROM daily_stats WHERE stat_date = TODAY AND h3_index IS NOT NULL` |
