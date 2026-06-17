# sample project

## Overview

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Frontend**: [SolidJS](https://www.solidjs.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: `Bun.serve()` with WebSocket support
- **Real-time communication**: [ws-kit](https://github.com/nicksrandall/ws-kit) (WebSocket message routing with [Valibot](https://valibot.dev/) schemas)
- **Linting/Formatting**: [oxlint](https://oxc.rs/) + [oxfmt](https://oxc.rs/)
- **Type checking**: [tsgo](https://github.com/microsoft/typescript-go) (native TypeScript checker)

## Architecture

## Prerequisites

- [Bun](https://bun.sh) (v1.3.9+)
- AWS credentials with read access to ECS (configured via `.env` or environment variables)

## Setup

```bash
bun install
```

Create a `.env` file with your variables:

```env
PORT=3000                 # optional, defaults to 3000
```

## Development

Run all services (client dev server + backend) concurrently:

```bash
bun run dev
```

This uses [shoreman](https://www.chrismytton.com/shoreman/) to run the services defined in the `Procfile`:

- **client** — Bun bundler in watch mode (`bun run dev:web`)
- **css** — Tailwind CSS compiler in watch mode (`bun run dev:css`)
- **server** — Bun server with hot reload (`bun run dev:server`)

## Build & Production

```bash
bun run build    # Run checks, tests, then build web + server + CSS
bun start        # Start the production server
```

## Testing

```bash
bun run test
```

Tests use the Bun test runner with `@solidjs/testing-library` and `happy-dom` for component tests. The `--conditions=browser` flag is required for SolidJS and is included in the `test` script.

## Code Quality

```bash
bun run check    # Run typecheck + lint + format + spellcheck
```
