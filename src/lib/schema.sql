CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL,
  topic TEXT NOT NULL CHECK (length(trim(topic)) > 0),
  status TEXT NOT NULL CHECK (status IN ('Todo', 'In-Progress', 'Complete')),
  archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON tasks (archived_at);
CREATE INDEX IF NOT EXISTS idx_tasks_topic ON tasks (topic);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
