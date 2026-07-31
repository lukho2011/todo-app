"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

  type TaskStatus = "Todo" | "In-Progress" | "Complete";
  type SortField = "topic" | "status" | "dueDate";

  type Task = {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    topic: string;
    status: TaskStatus;
    archivedAt: string | null;
    overdue: boolean;
  };

  type TaskForm = Omit<Task, "id" | "archivedAt" | "overdue">;

  const emptyForm: TaskForm = {
    title: "",
    description: "",
    dueDate: "",
    topic: "",
    status: "Todo",
  };

  const statusLabels: Record<TaskStatus, string> = {
    Todo: "Todo",
    "In-Progress": "In progress",
    Complete: "Complete",
  };

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  }

  export default function Home() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
    const [form, setForm] = useState<TaskForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [sort, setSort] = useState<SortField>("dueDate");
    const [showArchived, setShowArchived] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadTasks = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const [activeResponse, archivedResponse] = await Promise.all([
          fetch(`/api/tasks?sort=${sort}`),
          fetch(`/api/tasks?archived=true&sort=${sort}`),
        ]);
        if (!activeResponse.ok || !archivedResponse.ok) {
          throw new Error("Could not load tasks");
        }
        const activeData = (await activeResponse.json()) as { tasks: Task[] };
        const archivedData = (await archivedResponse.json()) as { tasks: Task[] };
        setTasks(activeData.tasks);
        setArchivedTasks(archivedData.tasks);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load tasks");
      } finally {
        setLoading(false);
      }
    }, [sort]);

    useEffect(() => {
      const timer = window.setTimeout(() => void loadTasks(), 0);
      return () => window.clearTimeout(timer);
    }, [loadTasks]);

    function updateForm(field: keyof TaskForm, value: string) {
      setForm((current) => ({ ...current, [field]: value }));
    }

    function beginEdit(task: Task) {
      setEditingId(task.id);
      setForm({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        topic: task.topic,
        status: task.status,
      });
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function cancelEdit() {
      setEditingId(null);
      setForm(emptyForm);
    }

    async function submitForm(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setSaving(true);
      setError(null);
      try {
        const response = await fetch(editingId ? `/api/tasks/${editingId}` : "/api/tasks", {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Could not save task");
        }
        cancelEdit();
        await loadTasks();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Could not save task");
      } finally {
        setSaving(false);
      }
    }

    async function archive(task: Task) {
      setError(null);
      const response = await fetch(`/api/tasks/${task.id}`, { method: "PATCH" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not archive task");
        return;
      }
      await loadTasks();
    }

    const visibleTasks = showArchived ? archivedTasks : tasks;

    return (
      <main className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">PERSONAL WORKSPACE / 2026</p>
            <h1>Things worth finishing.</h1>
          </div>
          <div className="task-count" aria-label={`${tasks.length} active tasks`}>
            <strong>{String(tasks.length).padStart(2, "0")}</strong>
            <span>active<br />tasks</span>
          </div>
        </header>

        <section className="workspace-grid">
          <aside className="editor-panel">
            <div className="panel-heading">
              <span className="section-number">01</span>
              <h2>{editingId ? "Refine task" : "Add a task"}</h2>
            </div>
            <form onSubmit={submitForm} className="task-form">
              <label>
                Title
                <input required value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="What needs your attention?" />
              </label>
              <label>
                Description
                <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="A little context..." rows={4} />
              </label>
              <div className="form-row">
                <label>
                  Due date
                  <input required type="date" value={form.dueDate} onChange={(event) => updateForm("dueDate", event.target.value)} />
                </label>
                <label>
                  Topic
                  <input required value={form.topic} onChange={(event) => updateForm("topic", event.target.value)} placeholder="e.g. University" />
                </label>
              </div>
              <label>
                Status
                <select value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
                  <option value="Todo">Todo</option>
                  <option value="In-Progress">In progress</option>
                  <option value="Complete">Complete</option>
                </select>
              </label>
              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save changes" : "Create task"}
                </button>
                {editingId && <button className="text-button" type="button" onClick={cancelEdit}>Cancel</button>}
              </div>
            </form>
            {error && <p className="error-message" role="alert">{error}</p>}
          </aside>

          <section className="list-panel" aria-labelledby="tasks-heading">
            <div className="list-heading">
              <div className="panel-heading">
                <span className="section-number">02</span>
                <h2 id="tasks-heading">{showArchived ? "Archive" : "Current work"}</h2>
              </div>
              <button className="archive-toggle" type="button" onClick={() => setShowArchived((current) => !current)}>
                {showArchived ? "View active" : `View archive (${archivedTasks.length})`}
              </button>
            </div>
            <div className="sort-bar">
              <span>Sort by</span>
              {(["dueDate", "topic", "status"] as SortField[]).map((field) => (
                <button className={sort === field ? "sort-button selected" : "sort-button"} key={field} type="button" onClick={() => setSort(field)}>
                  {field === "dueDate" ? "Due date" : field[0].toUpperCase() + field.slice(1)}
                </button>
              ))}
            </div>
            {loading ? (
              <p className="empty-state">Loading your work...</p>
            ) : visibleTasks.length === 0 ? (
              <div className="empty-state"><strong>{showArchived ? "Nothing archived yet." : "Your list is clear."}</strong><span>{showArchived ? "Archived tasks will stay here for reference." : "Add the first task to begin."}</span></div>
            ) : (
              <div className="task-list">
                {visibleTasks.map((task) => (
                  <article className={task.overdue ? "task-card overdue" : "task-card"} key={task.id}>
                    <div className="task-card-main">
                      <div className="task-title-row"><h3>{task.title}</h3>{task.overdue && <span className="overdue-label">Overdue</span>}</div>
                      {task.description && <p>{task.description}</p>}
                      <div className="task-meta"><span>{task.topic}</span><span>{formatDate(task.dueDate)}</span></div>
                    </div>
                    <div className="task-card-side">
                      <span className={`status status-${task.status.toLowerCase().replace("-", "")}`}>{statusLabels[task.status]}</span>
                      {!showArchived && <div className="task-actions"><button type="button" onClick={() => beginEdit(task)}>Edit</button><button type="button" onClick={() => archive(task)}>Archive</button></div>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    );
  }
