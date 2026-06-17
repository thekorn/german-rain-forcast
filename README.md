# German Rain Forecast

## Overview

German Rain Forecast shows an interactive Germany-wide rain forecast map. The app loads hourly precipitation forecasts from the DWD ICON model through Open-Meteo and renders the data as a browser map with timeline playback controls.

## Forecast data

- **Source**: [Open-Meteo DWD ICON API](https://open-meteo.com/en/docs/dwd-api), using hourly `precipitation` values in millimeters for Germany grid points.
- **Update cadence**: the backend keeps a shared in-memory forecast cache for one hour. Requests within that window are served from the cache instead of calling Open-Meteo per user request.
- **Refresh behavior**: a background refresh starts when the server boots and repeats hourly. If a refresh fails after data was already cached, the API keeps serving the stale cached forecast with refresh metadata so the map remains usable.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Frontend**: [SolidJS](https://www.solidjs.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: `Bun.serve()` HTTP API and static file serving
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

To run the backend with generated fake data for a random very rainy period:

```bash
bun run dev:server -- --fake-data
```

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
