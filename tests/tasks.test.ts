import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";

import {
  archiveTask,
  createTask,
  getTask,
  listTasks,
  updateTask,
} from "../src/lib/tasks";

const temporaryDirectories: string[] = [];
const testDatabases: Database.Database[] = [];
const schema = fs.readFileSync(path.join(process.cwd(), "src", "lib", "schema.sql"), "utf8");

function createTestDatabase() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "todo-app-"));
  temporaryDirectories.push(directory);
  const database = new Database(path.join(directory, "test.db"));
  testDatabases.push(database);
  database.exec(schema);
  return database;
}

afterEach(() => {
  for (const database of testDatabases.splice(0)) {
    database.close();
  }
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("task persistence", () => {
  it("creates a task with all fields and derives overdue", () => {
    const database = createTestDatabase();
    const task = createTask(database, {
      title: "Submit lab",
      description: "Finish the SQLite implementation",
      dueDate: "2026-07-01",
      topic: "COMS3011A",
      status: "Todo",
    });

    expect(task).toMatchObject({
      title: "Submit lab",
      description: "Finish the SQLite implementation",
      dueDate: "2026-07-01",
      topic: "COMS3011A",
      status: "Todo",
      overdue: true,
    });
  });

  it("updates an existing task and retains the change", () => {
    const database = createTestDatabase();
    const task = createTask(database, {
      title: "Draft report",
      description: "First draft",
      dueDate: "2026-08-04",
      topic: "Writing",
      status: "Todo",
    });

    updateTask(database, task.id, {
      title: "Final report",
      description: "Completed draft",
      dueDate: "2026-08-05",
      topic: "COMS3011A",
      status: "In-Progress",
    });

    expect(getTask(database, task.id)).toMatchObject({
      title: "Final report",
      description: "Completed draft",
      topic: "COMS3011A",
      status: "In-Progress",
    });
  });

  it("archives a task without deleting it from the database", () => {
    const database = createTestDatabase();
    const task = createTask(database, {
      title: "Read notes",
      description: "Review lecture notes",
      dueDate: "2026-08-01",
      topic: "Study",
      status: "Complete",
    });

    archiveTask(database, task.id);

    expect(listTasks(database)).toHaveLength(0);
    expect(listTasks(database, { archived: true })).toHaveLength(1);
    expect(getTask(database, task.id)?.archivedAt).not.toBeNull();
  });

  it("sorts tasks by topic, status, and due date", () => {
    const database = createTestDatabase();
    createTask(database, {
      title: "Later",
      description: "",
      dueDate: "2026-08-10",
      topic: "Zeta",
      status: "Complete",
    });
    createTask(database, {
      title: "Soon",
      description: "",
      dueDate: "2026-08-01",
      topic: "Alpha",
      status: "Todo",
    });

    expect(listTasks(database, { sort: "topic" }).map((task) => task.topic)).toEqual([
      "Alpha",
      "Zeta",
    ]);
    expect(listTasks(database, { sort: "status" }).map((task) => task.status)).toEqual([
      "Todo",
      "Complete",
    ]);
    expect(listTasks(database, { sort: "dueDate" }).map((task) => task.dueDate)).toEqual([
      "2026-08-01",
      "2026-08-10",
    ]);
  });
});
