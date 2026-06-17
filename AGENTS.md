# Agent Guidelines for sample-project

## Build/Test Commands

- `bun run dev` — run all services (client + server + css) via shoreman (see `Procfile`)
- `bun run build` — full pipeline: check, test, build web + server + CSS
- `AGENT=1 bun run test` — run all tests (`--conditions=browser --coverage`); the `--conditions=browser` flag is required for SolidJS
- `AGENT=1 bun test --conditions=browser src/path/to/file.test.ts` — run a single test file
- `bun run check` — typecheck (`tsgo`), lint (`oxlint`), format (`oxfmt`)

## Architecture

- **`src/server/`** — Bun.serve() HTTP + WebSocket server
- **`src/client/`** — SolidJS SPA bundled via `build.ts`; components in `components/`, Tailwind CSS v4
- **`src/shared/`** — shared types (`types.ts`) and WebSocket message schemas (`messages.ts`, valibot)
- **`src/tools/`** — CLI utilities

## Code Style

- **Runtime**: Bun — use `Bun.serve`, `bun:sqlite`, `Bun.file`, `Bun.$` (no express, better-sqlite3, node:fs, execa, dotenv)
- **Formatting**: oxfmt (semi: false, singleQuote: true, printWidth: 120); strict TypeScript; no JSDoc
- **Naming**: camelCase vars/functions, PascalCase classes/interfaces, UPPER_CASE constants
- **Imports**: explicit, grouped: built-ins → external deps → internal modules
- **Testing**: `bun:test`; component tests use `@solidjs/testing-library` + `happy-dom`; tests live next to source files
- **Debugging**: reproduce issues in a test case first; use debug logs, don't guess
- **Errors**: use proper Error objects, async/await, no silent failures; minimal comments
