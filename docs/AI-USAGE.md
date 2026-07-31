# AI Usage Transcript

This file records task-level AI assistance used during the COMS3011A Lab 1 project. The author reviewed the suggestions, ran the checks, and made the final decisions.

## Planning and constraints

The assignment brief was supplied first. The constraints were: local-first execution, SQLite rather than memory or JSON persistence, no user accounts, no task deletion, exactly three fixed statuses, overdue derived rather than stored, at least three real deterministic tests, clean-clone documentation, and a coherent Git history of at least six commits.

The implementation plan was narrowed to small working commits: Next.js baseline, SQLite persistence and tests, API routes, UI, documentation, and final verification.

## Design correction

An early suggested route/database plan assumed Prisma and a separate migration workflow. That was rejected for this small local application because it introduced an ORM layer and extra generated setup without improving the one-table data model. The implementation uses `better-sqlite3` with the checked-in `src/lib/schema.sql` instead. The shipped code in `src/lib/db.ts` reads that schema and creates `data/todos.db` on first use.

The archive design was also constrained: archive updates `tasks.archived_at` and never deletes the row. The overdue marker is calculated in `src/lib/tasks.ts` from the due date and status; it is not a database column and `Overdue` is not offered in the UI status select.

## Debugging correction

The first temporary-database tests failed on Windows because `fs.rmSync` attempted to remove a directory while its SQLite connection was still open. The test cleanup was corrected to close every `better-sqlite3` connection before removing its temporary directory. The same `npm test` command then passed all four behavior tests.

The first frontend replacement also left the generated page wrapper around the new module, causing a parser error. The stale wrapper and an extra closing brace were removed. React lint then rejected a direct state update from the loading effect; the shared loader was changed to a stable `useCallback` and the initial effect call was deferred with a timer. `npm run lint` and `npm run build` then passed.

## Evidence

The implementation was validated with:

- `npm test`: four isolated SQLite behavior tests pass.
- `npm run lint`: passes.
- `npm run build`: passes.

The Git history records the work in separate pushed commits with specific messages. The first commit is `chore: initialize Next.js project with TypeScript and Tailwind`; later commits cover persistence/tests, API routes, and the workspace UI.
