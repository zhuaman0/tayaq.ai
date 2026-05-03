# 3. Data Modeling — Tayaq.ai

## 3.1 ER Diagram (Conceptual)

```mermaid
erDiagram
    USER ||--|| PROFILE : has
    USER ||--o{ MESSAGE : sends
    USER ||--o{ MESSAGE : receives
    USER ||--o{ CHAT_SESSION : starts
    CHAT_SESSION ||--o{ AUDIT_LOG : generates
    PROFILE ||--o{ DAILY_STATS : aggregated_into

    USER {
        uuid id PK
        text email
        text username
        jsonb raw_user_meta_data
        timestamptz created_at
    }

    PROFILE {
        uuid id PK_FK
        text username
        text avatar_url
        text city
        text bio
        int total_xp
        int streak_days
        int total_roasts
        date last_login_at
        float lat
        float lng
        text h3_index
        timestamptz created_at
    }

    MESSAGE {
        uuid id PK
        uuid sender_id FK
        uuid receiver_id FK
        text content
        bool read
        timestamptz created_at
    }

    CHAT_SESSION {
        uuid id PK
        uuid user_id FK
        int roast_level
        text h3_index
        int messages_count
        int mistakes_found
        int xp_earned
        timestamptz started_at
        timestamptz ended_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid user_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb old_data
        jsonb new_data
        text ip_address
        text h3_index
        timestamptz created_at
    }

    DAILY_STATS {
        uuid id PK
        date stat_date
        text city
        text h3_index
        int total_users
        int active_users
        int messages_sent
        int sessions_started
        int total_xp_earned
        int total_mistakes
        timestamptz created_at
    }
```

### Entity Relationships

| Relationship | Type | Description |
|---|---|---|
| USER → PROFILE | 1:1 | Every user has exactly one profile |
| USER → MESSAGE | 1:N | A user can send many messages |
| USER → CHAT\_SESSION | 1:N | A user can have many AI chat sessions |
| CHAT\_SESSION → AUDIT\_LOG | 1:N | Each session generates audit events |
| PROFILE → DAILY\_STATS | N:1 | Profiles aggregated into daily stats by city |

---

## 3.2 Logical Schema (Tables)

### Table 1: `profiles` — User profiles with location data

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PK, FK → auth.users | Supabase auth user ID |
| `username` | TEXT | | Display name |
| `avatar_url` | TEXT | | Profile picture URL |
| `city` | TEXT | | User's city (e.g. "Almaty") |
| `bio` | TEXT | | Short bio text |
| `total_xp` | INTEGER | DEFAULT 0 | Total experience points earned |
| `streak_days` | INTEGER | DEFAULT 0 | Current login streak |
| `total_roasts` | INTEGER | DEFAULT 0 | Grammar corrections survived |
| `last_login_at` | DATE | DEFAULT CURRENT_DATE | Last active date |
| `lat` | DOUBLE PRECISION | | Latitude |
| `lng` | DOUBLE PRECISION | | Longitude |
| **`h3_index`** | **TEXT** | | **H3 hex cell ID (resolution 7)** |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Account creation time |

> **H3 usage**: The `h3_index` column stores the Uber H3 hexagonal cell ID for the user's location. This enables O(1) spatial queries — finding nearby users by comparing hex IDs instead of computing distances for every user.

---

### Table 2: `messages` — Direct messages between users

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Message ID |
| `sender_id` | UUID | FK → auth.users, NOT NULL | Who sent it |
| `receiver_id` | UUID | FK → auth.users, NOT NULL | Who receives it |
| `content` | TEXT | NOT NULL | Message text |
| `read` | BOOLEAN | DEFAULT FALSE | Read receipt |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | When sent |

---

### Table 3: `chat_sessions` — AI tutor conversation sessions

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Session ID |
| `user_id` | UUID | FK → auth.users, NOT NULL | Student |
| `roast_level` | INTEGER | DEFAULT 1 | Roast intensity (1-5) |
| **`h3_index`** | **TEXT** | | **User's location during session** |
| `messages_count` | INTEGER | DEFAULT 0 | Messages in session |
| `mistakes_found` | INTEGER | DEFAULT 0 | Grammar errors caught |
| `xp_earned` | INTEGER | DEFAULT 0 | XP gained this session |
| `started_at` | TIMESTAMPTZ | DEFAULT NOW() | Session start |
| `ended_at` | TIMESTAMPTZ | | Session end |

> **H3 usage**: Tracks where sessions happen geographically, enabling analytics like "Which city has the most active learners?" and regional heatmaps.

---

### Table 4: `audit_log` — Tracks all important system events

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Log entry ID |
| `user_id` | UUID | FK → auth.users | Who performed action |
| `action` | TEXT | NOT NULL | Event type (see below) |
| `entity_type` | TEXT | | Target table name |
| `entity_id` | UUID | | Target row ID |
| `old_data` | JSONB | | Previous state (for updates) |
| `new_data` | JSONB | | New state (for updates) |
| `ip_address` | TEXT | | Client IP |
| **`h3_index`** | **TEXT** | | **User's location during event** |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | When it happened |

**Tracked actions:**

| Action | When Triggered |
|---|---|
| `user.register` | New user signs up |
| `user.login` | User logs in |
| `profile.update` | User changes profile (city, bio) |
| `session.start` | AI chat session begins |
| `session.end` | AI chat session ends |
| `message.send` | DM sent to another user |
| `streak.update` | Streak incremented or reset |
| `xp.earn` | XP awarded for activity |

> **Why audit log?** Enables full traceability of user actions. Essential for security (who did what, when), debugging, and analytics. Stores `old_data`/`new_data` as JSONB for flexible schema evolution.

---

### Table 5: `daily_stats` — Aggregated analytics (analytics table)

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Row ID |
| `stat_date` | DATE | NOT NULL, UNIQUE w/ city | The date |
| `city` | TEXT | | City name (NULL = global) |
| **`h3_index`** | **TEXT** | | **Hex cell for spatial analytics** |
| `total_users` | INTEGER | DEFAULT 0 | Users registered up to this date |
| `active_users` | INTEGER | DEFAULT 0 | Users who logged in today |
| `messages_sent` | INTEGER | DEFAULT 0 | DMs sent today |
| `sessions_started` | INTEGER | DEFAULT 0 | AI chat sessions today |
| `total_xp_earned` | INTEGER | DEFAULT 0 | XP earned today (all users) |
| `total_mistakes` | INTEGER | DEFAULT 0 | Grammar errors caught today |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Row creation |

> **Why aggregated table?** Instead of running expensive `COUNT(*)` / `SUM()` queries on millions of rows each time the admin dashboard loads, we pre-aggregate daily stats. One row per city per day = instant dashboard queries.

---

## 3.3 H3 Index — Usage & Justification

### What is H3?
**Uber H3** is a hexagonal hierarchical spatial index. It divides the Earth into hexagonal cells at 16 resolutions. We use **resolution 7** (~5.16 km² per hex).

### Where H3 is used

| Table | Column | Purpose |
|---|---|---|
| `profiles` | `h3_index` | Index student locations for nearby search |
| `chat_sessions` | `h3_index` | Track where learning happens geographically |
| `audit_log` | `h3_index` | Geo-tag security events |
| `daily_stats` | `h3_index` | Spatial analytics & heatmaps |

### Why H3 over lat/lng distance queries?

| Approach | Query | Performance |
|---|---|---|
| **Traditional** | `WHERE ST_Distance(point, target) < 5000` | O(n) — scans every row |
| **H3 Indexing** | `WHERE h3_index IN (neighbors)` | O(1) — simple string comparison |

```python
import h3

# Convert location → hex cell (instant)
cell = h3.latlng_to_cell(43.24, 76.94, 7)  # → "8720e60a1ffffff"

# Find nearby cells (instant, no distance math)
nearby = h3.grid_disk(cell, 1)  # Returns 7 hex IDs

# Query: students in same area
SELECT * FROM profiles WHERE h3_index IN ('8720e60a1ffffff', '8720e60a3ffffff', ...);
```

### Justification

> We chose H3 because Tayaq.ai is a **location-aware educational platform**. Students need to find nearby learners for real-life meetups. H3 gives us O(1) spatial queries without PostGIS complexity, works natively with PostgreSQL TEXT columns, and produces beautiful hexagonal heatmaps for our analytics dashboard.

---

## 3.4 Row Level Security (RLS) Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Everyone ✅ | Own only ✅ | Own only ✅ | — |
| `messages` | Own (sender/receiver) ✅ | Own (as sender) ✅ | Own (as receiver) ✅ | — |
| `chat_sessions` | Own only ✅ | Own only ✅ | Own only ✅ | — |
| `audit_log` | Admin only 🔒 | Service role only 🔒 | — | — |
| `daily_stats` | Everyone ✅ | Service role only 🔒 | Service role only 🔒 | — |
