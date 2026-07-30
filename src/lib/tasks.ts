import type Database from "better-sqlite3";

export const TASK_STATUSES = ["Todo", "In-Progress", "Complete"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  topic: string;
  status: TaskStatus;
  archivedAt: string | null;
  overdue: boolean;
};

export type TaskInput = {
  title: string;
  description: string;
  dueDate: string;
  topic: string;
  status: TaskStatus;
};

type TaskRow = Omit<Task, "overdue" | "dueDate" | "archivedAt"> & {
  due_date: string;
  archived_at: string | null;
};

const SORT_COLUMNS = {
  topic: "topic COLLATE NOCASE",
  status: "CASE status WHEN 'Todo' THEN 1 WHEN 'In-Progress' THEN 2 ELSE 3 END",
  dueDate: "due_date",
} as const;

export type TaskSort = keyof typeof SORT_COLUMNS;

function toTask(row: TaskRow): Task {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    topic: row.topic,
    status: row.status,
    archivedAt: row.archived_at,
    overdue: row.status !== "Complete" && row.due_date < today,
  };
}

function assertValidInput(input: TaskInput) {
  if (!input.title.trim() || !input.topic.trim() || !input.dueDate) {
    throw new Error("Title, topic, and due date are required");
  }

  if (!TASK_STATUSES.includes(input.status)) {
    throw new Error("Invalid task status");
  }
}

export function createTask(db: Database.Database, input: TaskInput): Task {
  assertValidInput(input);
  const result = db
    .prepare(
      `INSERT INTO tasks (title, description, due_date, topic, status)
       VALUES (@title, @description, @dueDate, @topic, @status)`,
    )
    .run(input);

  return getTask(db, Number(result.lastInsertRowid))!;
}

export function getTask(db: Database.Database, id: number): Task | null {
  const row = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(id) as TaskRow | undefined;
  return row ? toTask(row) : null;
}

export function listTasks(
  db: Database.Database,
  options: { archived?: boolean; sort?: TaskSort } = {},
): Task[] {
  const archived = options.archived ?? false;
  const sortColumn = SORT_COLUMNS[options.sort ?? "dueDate"];
  const rows = db
    .prepare(
      `SELECT * FROM tasks
       WHERE archived_at IS ${archived ? "NOT NULL" : "NULL"}
       ORDER BY ${sortColumn} ASC, id ASC`,
    )
    .all() as TaskRow[];
  return rows.map(toTask);
}

export function updateTask(
  db: Database.Database,
  id: number,
  input: TaskInput,
): Task | null {
  assertValidInput(input);
  const result = db
    .prepare(
      `UPDATE tasks
       SET title = @title, description = @description, due_date = @dueDate,
           topic = @topic, status = @status
       WHERE id = @id`,
    )
    .run({ ...input, id });

  return result.changes ? getTask(db, id) : null;
}

export function archiveTask(db: Database.Database, id: number): Task | null {
  const result = db
    .prepare("UPDATE tasks SET archived_at = datetime('now') WHERE id = ? AND archived_at IS NULL")
    .run(id);
  return result.changes ? getTask(db, id) : null;
}
