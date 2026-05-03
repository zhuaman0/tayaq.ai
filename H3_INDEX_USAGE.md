# H3 Index Column — Usage Across Tables

## What is H3?

**Uber H3** is a hexagonal hierarchical spatial indexing system. It converts any latitude/longitude coordinate into a **hexagonal cell ID** (a string like `"872d4b59dffffff"`).

```python
import h3
cell = h3.latlng_to_cell(43.24, 76.94, 7)  # → "872d4b59dffffff"
```

We use **Resolution 7** (~5.16 km² per hex) — ideal for city-district-level proximity.

---

## Tables with `h3_index` Column

### 1. `profiles.h3_index` — Student Location Indexing

| Column | Type | Example Value |
|---|---|---|
| `h3_index` | TEXT | `"872d4b59dffffff"` |

**Purpose:** Find nearby learners for community meetups.

```sql
-- Find students near me (O(1) string comparison, not O(n) distance calc)
SELECT username, city FROM profiles
WHERE h3_index IN ('872d4b59dffffff', '872d4b58fffffff', '872d4b5b7ffffff');
```

**How it's set:**
1. User selects city → frontend sends coordinates to Python H3 Service
2. Python: `h3.latlng_to_cell(lat, lng, 7)` → hex ID
3. Hex ID saved to `profiles.h3_index`

---

### 2. `chat_sessions.h3_index` — Where Learning Happens

| Column | Type | Example Value |
|---|---|---|
| `h3_index` | TEXT | `"872d4b59dffffff"` |

**Purpose:** Geographic analytics — which districts produce the most sessions?

```sql
-- Sessions per district today
SELECT h3_index, COUNT(*) as session_count
FROM chat_sessions
WHERE started_at::date = CURRENT_DATE
GROUP BY h3_index
ORDER BY session_count DESC;
```

---

### 3. `audit_log.h3_index` — Geo-tagged Security Events

| Column | Type | Example Value |
|---|---|---|
| `h3_index` | TEXT | `"872d4b59dffffff"` |

**Purpose:** Detect suspicious activity from unusual locations.

```sql
-- Flag: user logged in from a different hex than usual
SELECT * FROM audit_log
WHERE user_id = '...' AND action = 'user.login'
  AND h3_index != (SELECT h3_index FROM profiles WHERE id = '...');
```

---

### 4. `daily_stats.h3_index` — Spatial Analytics & Heatmaps

| Column | Type | Example Value |
|---|---|---|
| `h3_index` | TEXT | `"872d4b59dffffff"` |

**Purpose:** Power heatmap visualizations showing learner density by district.

```sql
-- Heatmap data: mistakes per hex cell today
SELECT h3_index, total_mistakes, active_users
FROM daily_stats
WHERE stat_date = CURRENT_DATE AND h3_index IS NOT NULL;
```

---

## Summary Table

| Table | H3 Column | Purpose | Query Type |
|---|---|---|---|
| `profiles` | `h3_index` | Find nearby learners | `WHERE h3_index IN (neighbors)` |
| `chat_sessions` | `h3_index` | Track where learning happens | `GROUP BY h3_index` |
| `audit_log` | `h3_index` | Geo-tag security events | Location anomaly detection |
| `daily_stats` | `h3_index` | Heatmaps & spatial analytics | District-level aggregation |

---

## Why H3 Instead of PostGIS?

| | H3 | PostGIS |
|---|---|---|
| **Column type** | TEXT (simple string) | GEOMETRY (complex type) |
| **Query** | `WHERE h3_index IN (...)` | `ST_DWithin(geom, point, radius)` |
| **Performance** | O(1) — string index lookup | O(n) — distance calculation |
| **Setup** | `pip install h3` | PostgreSQL extension + config |
| **Works on Supabase free tier** | ✅ Yes | ❌ Limited support |
| **Hexagonal heatmaps** | ✅ Built-in | ❌ Requires custom polygons |

**Conclusion:** H3 gives us spatial indexing with zero infrastructure overhead — just a TEXT column and a Python library.
