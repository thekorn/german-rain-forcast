---
name: sqlite3-cli
description: >-
  Queries and inspects SQLite files with the sqlite3 CLI using Markdown table output by default.
  Use when exploring a .sqlite database, verifying rows after migrations, reproducing data issues,
  or when the user mentions sqlite3, SQLite CLI, or ad-hoc DB inspection.
---

# sqlite3 CLI (Markdown by default)

## Default output

Before running **any** `SELECT` (or when starting a session), use **column headers** and **Markdown tables** so results paste cleanly into chat and docs.

**Non-interactive (preferred for agents):** prefix every `sqlite3` invocation that prints query results with:

```bash
sqlite3 /path/to/db.sqlite \
  -cmd ".headers on" \
  -cmd ".mode markdown" \
  "SELECT * FROM my_table LIMIT 10;"
```

**Interactive:** open the DB, then run:

```text
.headers on
.mode markdown
```

Keep `.headers on` and `.mode markdown` until you intentionally switch modes (e.g. `.mode list` for machine parsing).

## Open a database

```bash
sqlite3 /path/to/database.sqlite
```

For this project, align with the running app: use the same file as `DATABASE_PATH` (see `src/server/lib/env.ts`). Schema reference: `docs/DB.md`.

## Common inspection commands

Run these after the default `.headers on` / `.mode markdown` (or pass the same `-cmd` lines before the SQL argument).

| Goal            | Command / SQL                       |
| --------------- | ----------------------------------- |
| List tables     | `.tables`                           |
| Table DDL       | `.schema events` (replace name)     |
| Full schema     | `.schema`                           |
| Columns + types | `PRAGMA table_info(events);`        |
| Row count       | `SELECT COUNT(*) AS n FROM events;` |

## Multi-statement scripts

```bash
sqlite3 /path/to/db.sqlite <<'SQL'
.headers on
.mode markdown
SELECT id, title FROM events ORDER BY occurred_at DESC LIMIT 5;
SQL
```

## Notes

- Requires a system `sqlite3` with **`.mode markdown`** (SQLite 3.41+). If `markdown` is missing, fall back to `.mode box` or `.mode column` and still use `.headers on`.
- Do not rely on `:memory:` for inspecting a running app’s data unless the process shares that in-memory DB; prefer the on-disk path the server uses.
