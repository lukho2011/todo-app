# Database Design

## SQLite database

The application stores all task data in one local SQLite database at `data/todos.db`. The `data/` directory is ignored by Git because it is runtime data, while the schema is committed in `src/lib/schema.sql`.

## `tasks`

| Column | Type | Constraint | Purpose |
|---|---|---|---|
| `id` | INTEGER | Primary key, autoincrement | Stable task identifier |
| `title` | TEXT | Required, non-empty | Task title |
| `description` | TEXT | Required, defaults to empty text | Additional context |
| `due_date` | TEXT | Required | ISO calendar date in `YYYY-MM-DD` form |
| `topic` | TEXT | Required, non-empty | Task grouping/topic |
| `status` | TEXT | Required; one of `Todo`, `In-Progress`, `Complete` | Fixed workflow status |
| `archived_at` | TEXT | Nullable | Archive timestamp; `NULL` means active |

Indexes support active/archive filtering and the three supported sort fields: topic, status, and due date.

There is one table and therefore no foreign-key relationship. An archived task remains the same row in `tasks`; archiving sets `archived_at` instead of deleting or copying the task.

## Derived overdue rule

Overdue is not stored in SQLite and is not a fourth status. At read time, a task is marked overdue when its due date is before the current calendar date and its status is not `Complete`. This keeps the database as the source of truth and prevents overdue values becoming stale.
