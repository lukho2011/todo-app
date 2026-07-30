import { getDatabase } from "@/lib/db";
import { archiveTask, updateTask, TASK_STATUSES, type TaskInput } from "@/lib/tasks";

export const dynamic = "force-dynamic";

type TaskRouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
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

export async function PUT(request: Request, context: TaskRouteContext) {
  const id = parseId((await context.params).id);
  if (!id) {
    return Response.json({ error: "Invalid task ID" }, { status: 400 });
  }

  try {
    const body: unknown = await request.json();
    if (!isTaskInput(body)) {
      return Response.json({ error: "Invalid task fields" }, { status: 400 });
    }

    const task = updateTask(getDatabase(), id, body);
    return task
      ? Response.json({ task })
      : Response.json({ error: "Task not found" }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update task";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(_request: Request, context: TaskRouteContext) {
  const id = parseId((await context.params).id);
  if (!id) {
    return Response.json({ error: "Invalid task ID" }, { status: 400 });
  }

  const task = archiveTask(getDatabase(), id);
  return task
    ? Response.json({ task })
    : Response.json({ error: "Task not found or already archived" }, { status: 404 });
}
