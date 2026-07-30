import { getDatabase } from "@/lib/db";
import {
  createTask,
  listTasks,
  TASK_STATUSES,
  type TaskInput,
  type TaskSort,
} from "@/lib/tasks";

export const dynamic = "force-dynamic";

const SORTS: TaskSort[] = ["topic", "status", "dueDate"];

function isTaskSort(value: string | null): value is TaskSort {
  return value !== null && SORTS.includes(value as TaskSort);
}

function isTaskInput(value: unknown): value is TaskInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Record<string, unknown>;
  return (
    typeof input.title === "string" &&
    typeof input.description === "string" &&
    typeof input.dueDate === "string" &&
    typeof input.topic === "string" &&
    typeof input.status === "string" &&
    TASK_STATUSES.includes(input.status as TaskInput["status"])
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sort = url.searchParams.get("sort");
  const archived = url.searchParams.get("archived") === "true";

  if (sort !== null && !isTaskSort(sort)) {
    return Response.json({ error: "Invalid sort field" }, { status: 400 });
  }

  const tasks = listTasks(getDatabase(), { archived, sort: sort ?? "dueDate" });
  return Response.json({ tasks });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isTaskInput(body)) {
      return Response.json({ error: "Invalid task fields" }, { status: 400 });
    }

    const task = createTask(getDatabase(), body);
    return Response.json({ task }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create task";
    return Response.json({ error: message }, { status: 400 });
  }
}
