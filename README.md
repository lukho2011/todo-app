# Things Worth Finishing

A local-first todo application built for COMS3011A Lab 1. It runs on one machine for one user and stores tasks in SQLite.

## Third-Party Code

- **Next.js 16**: Provides the App Router, server runtime, route handlers, and production build tooling.
- **React 19** and **React DOM 19**: Provide the interactive task form and task list UI.
- **Tailwind CSS 4** and **@tailwindcss/postcss**: Provide the CSS processing setup used by the Next.js project.
- **better-sqlite3**: Provides a synchronous, local SQLite driver that is simple and reliable for a single-user desktop-style application.
- **Vitest**: Provides a fast test runner for deterministic behavior tests.
- **TypeScript**: Provides static types for task data, API boundaries, and React components.
- **ESLint** and **eslint-config-next**: Catch JavaScript, TypeScript, React, and Next.js problems before submission.

## Database Design

The runtime database is `data/todos.db`, created automatically on first API use. The checked-in schema is [docs/DATABASE.md](docs/DATABASE.md) and [src/lib/schema.sql](src/lib/schema.sql).

The schema contains one `tasks` table with title, description, due date, topic, fixed status, and nullable `archived_at` fields. There are no relationships because this single-user application has no second entity table. Archiving sets `archived_at` on the existing row; it never deletes the task. Overdue is derived at read time from the due date and status, so it is not a stored status or column.

## Running It

### Prerequisites

Use **Node.js 22 LTS** (Node.js 20 LTS is also suitable). The development machine used for this repository currently has Node.js `v24.14.0`; the application passed lint, tests, and production build there, but the assignment's clean-clone prerequisite should use Node 20 or 22 LTS.

Git is required to clone the repository.

### Clean clone and install

```bash
git clone https://github.com/lukho2011/todo-app.git
cd todo-app
npm install
```

No manual database setup is needed. The application creates `data/todos.db` from the committed schema on its first request.

### Test

```bash
npm test
```

The tests create throwaway SQLite databases in the operating system temporary directory and clean them up. They do not depend on `data/todos.db` or on any developer data.

### Development server

```bash
npm run dev
```

Open http://localhost:3000. Create tasks with title, description, due date, topic, and one of the three statuses: Todo, In progress, or Complete. Use the controls to edit, archive, view archived tasks, and sort by due date, topic, or status. Overdue tasks are visibly marked separately from status.

### Production check

```bash
npm run build
npm start
```

Stop the server with `Ctrl+C`. Restarting it does not remove `data/todos.db`, so saved tasks persist.

To run all automated checks in one command:

```bash
npm run check
```

## Documentation and AI transcript

- [Database design](docs/DATABASE.md)
- [AI usage transcript](docs/AI-USAGE.md)
- The assignment source PDF is included as [lab_one.pdf](lab_one.pdf).
