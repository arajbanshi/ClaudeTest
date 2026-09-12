# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This repo is a small full-stack chat application:

- **Backend** (`src/claudetest/`): a FastAPI service that wraps the Claude Agent SDK, exposing chat endpoints over HTTP/SSE. Managed with `uv`.
- **Frontend** (`src/chat-ui/`): an Angular 22 app (standalone components, SSR, NgRx) that talks to the backend.

These two halves have independent toolchains and dependency files — commands must be run from the correct directory.

## Commands

### Backend (run from repo root)

```bash
uv sync                                          # install/update dependencies
uv run uvicorn claudetest.main:app --reload      # run the API server (http://localhost:8000)
```

The `claudetest` console script (`uv run claudetest`) only runs the placeholder `main()` in `__init__.py` — it does not start the server. Use the `uvicorn` command above for the actual API.

There is no test suite for the backend yet.

### Frontend (run from `src/chat-ui/`)

```bash
npm install
npm start                # ng serve, http://localhost:4200
npm run build            # production build to dist/
npm test                 # unit tests via Vitest (ng test)
npm run watch            # dev build in watch mode
```

To run a single test file/spec, use Vitest's filtering directly, e.g. `npx vitest run src/app/app.spec.ts`.

Code style is enforced via `.prettierrc` (single quotes, 100-char width, Angular parser for HTML) and `.editorconfig` (2-space indent). Run `npx prettier --write .` inside `src/chat-ui/` before committing frontend changes.

## Architecture

### Backend: request flow

`src/claudetest/main.py` defines two FastAPI routes that both delegate to `src/claudetest/agent_runner.py`:

- `POST /chat` — calls `run_prompt()`, collects the full agent reply, and returns it as JSON.
- `POST /chat/stream` — calls `stream_prompt()`, an async generator, and re-emits each text delta as an SSE `data:` event, followed by a terminal `event: done` event.

`agent_runner.py` is the only place that talks to the Claude Agent SDK (`claude_agent_sdk.query`). Both functions construct a `ClaudeAgentOptions` scoped to the `workspace/` directory (`WORKSPACE = <repo_root>/workspace`) with `allowed_tools=["Read", "Glob", "Grep"]` and `permission_mode="acceptEdits"` — this is a sandboxed, read-only agent session, not a general-purpose one. When extending agent capabilities, be deliberate about widening `allowed_tools`, since the workspace directory is what the SDK can act on.

- `run_prompt()` drains the query stream and concatenates `TextBlock`s from `AssistantMessage`s into a single string.
- `stream_prompt()` filters for `StreamEvent`s of type `content_block_delta` / `text_delta` and yields raw text chunks — this is what powers the streaming endpoint.

### Frontend: state management

The Angular app uses NgRx (`@ngrx/store` + `@ngrx/effects`, wired up in `app.config.ts`) for chat state, under `src/app/state/`:

- `chat.model.ts` — shape of chat state (`messages`, `currentReply`, `isStreaming`, `error`) and `initialChatState`.
- `chat.actions.ts` — the action group (`ChatActions`): `sendMessage`, `streamChunkReceived`, `streamCompleted`, `streamFailed`.
- `chat.feature.ts` — `createFeature` reducer that folds those actions into state (e.g. appends the user message and flips `isStreaming` on `sendMessage`, appends incoming text to `currentReply` on each chunk, finalizes the message list on `streamCompleted`).

The intended flow is: dispatch `sendMessage` → an effect (not yet present) opens an SSE connection to `POST /chat/stream` → each SSE chunk dispatches `streamChunkReceived` → stream end dispatches `streamCompleted`. When adding the effect, follow this action sequence rather than calling the HTTP API directly from components, so streaming state stays centralized in the NgRx store.

The app is SSR-enabled (`app.config.server.ts`, `main.server.ts`, `server.ts` via Express) — keep browser-only APIs (e.g. `EventSource`) guarded so they don't break server rendering.

## Coding practices for this repo

- Keep the SDK integration isolated in `agent_runner.py`; route-handling logic belongs in `main.py`. Don't call `claude_agent_sdk` directly from route handlers.
- Backend code targets Python 3.14 (see `.python-version`, `requires-python`) and uses modern typing (`AsyncIterator`, `str | None`-style unions) — match that style rather than importing from `typing` for constructs the stdlib now supports natively.
- Frontend state changes go through actions/reducers, not direct component mutation of shared state — extend `chat.actions.ts`/`chat.feature.ts` rather than introducing parallel state in components.
- Prefer Angular standalone components and signals (as in `app.ts`) over NgModules, consistent with the existing scaffold.
- The `workspace/` directory is the sandbox the agent reads from — treat it as agent-facing content, not application source.
