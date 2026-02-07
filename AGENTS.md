# Chronos Agent Guide

## Overview
Chronos is an alternative-history simulator with:
- Next.js 16 + React 19 frontend (App Router)
- FastAPI backend API
- Gemini models for simulation, image generation, and audio narration

The app runs as a single repo with a TypeScript UI (`src/`) and Python API (`api/`).

## Tech Stack

### Frontend
- Framework: Next.js `16.1.2` (App Router)
- UI: React `19.2.3`, TypeScript (strict mode)
- Styling: Tailwind CSS v4 (`@tailwindcss/postcss`), custom CSS tokens in `src/app/globals.css`
- Icons: `lucide-react`
- HTTP client: `axios` (`src/lib/axios-client.ts`)
- Local persistence: `localStorage` (session history and metadata)

### Backend
- Framework: FastAPI `0.128.0`
- Server: Uvicorn (dev script runs with `--reload`)
- Validation/schema: Pydantic v2 + `pydantic-settings`
- AI SDK: `google-genai`
- Env management: `python-dotenv` (`.env.local` loaded in `api/main.py`)

### Tooling
- Package manager: pnpm lockfile present (npm scripts also available)
- Linting: ESLint 9 + `eslint-config-next` core-web-vitals/typescript
- TypeScript path alias: `@/* -> src/*`

## Runtime Architecture

### High-level flow
1. User sends divergence input in UI chat.
2. Frontend posts `/api/simulate-turn` with input + prior history + current world state.
3. Backend calls Gemini simulation model and returns strict JSON (`SimulationResponse`).
4. Frontend updates world state, chat, timeline history, and suggested actions.
5. Frontend fires async side requests:
   - `/api/generate-audio` for narrated scene
   - `/api/generate-image` for timeline background image

### API routing
`api/main.py` creates an `APIRouter(prefix="/api")` and mounts:
- `simulation_agent.router`
- `image_agent.router`
- `audio_agent.router`

Endpoints:
- `POST /api/simulate-turn`
- `POST /api/generate-image`
- `POST /api/generate-audio`
- `GET /` health check

### Frontend composition
- Entry page: `src/app/page.tsx`
- Root shell/state orchestrator: `src/components/modules/index.tsx`
- Main feature modules:
  - `chat.tsx` (conversation + suggested actions)
  - `history.tsx` (session sidebar)
  - `header.tsx` + `year-odometer.tsx` (timeline/top controls)
  - `stats/*` (chaos, mood, stability)
  - `deviations.tsx` (world divergence list)
  - `ruler.tsx` (timeline animation)

## Data Contracts
Shared TypeScript domain models live in `src/types.ts` and mirror backend Pydantic models in `api/models.py`.

Core entities:
- `WorldState`: `year`, `chaos_level`, `deviations`, `population_mood`, `geopolitical_stability`
- `SimulationResponse`: `narrative`, `world_state_update`, `suggested_actions`
- `ImageResponse`: optional `image` (data URI)
- `AudioResponse`: optional `audio` (data URI)

Important: keep frontend and backend schemas synchronized when changing contract fields.

## Design Patterns and Conventions

### State and persistence
- Centralized UI state is held in the root `App` component (`index.tsx`).
- Session persistence pattern:
  - Metadata list key: `chronos_sessions_list`
  - Per-session key prefix: `chronos_session_`
- Current session auto-saves on relevant state change.

### API client pattern
- Single axios instance with base URL from `NEXT_PUBLIC_API_BASE_URL`.
- Response interceptor normalizes backend errors into thrown `Error(message)`.

### Async orchestration
- Simulation turn is awaited (blocking user flow).
- Image/audio generation are fire-and-forget follow-up requests with independent loading states.
- Audio playback utilities are isolated in `src/utils/audio.ts`.

### Prompting pattern (backend)
- Each endpoint builds a specialized prompt for one modality.
- Simulation endpoint enforces JSON output (`response_mime_type="application/json"`) and schema.
- `clean_json` removes markdown fences defensively before JSON parse.

## Environment and Configuration

### Required environment variables
- `NEXT_PUBLIC_API_BASE_URL` (frontend -> backend base URL)
- `GEMINI_API_KEY` (used by Google GenAI client)
- `CLIENT_URL` (CORS allowlist origin for FastAPI)
- `PORT` (FastAPI port setting; defaults to 8000 in settings)

Do not commit real credentials. Use local `.env.local` only.

## Development Workflow

### Run locally
- Frontend + backend together: `npm run dev`
- Frontend only: `npm run next-dev`
- Backend only: `npm run fastapi-dev`

Default local URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8000`

### Code quality
- Lint: `npm run lint`
- Auto-fix lint issues: `npm run lint:fix`

## Architectural Constraints
- No database currently; all user session data is browser-local.
- Backend is stateless across requests except for model outputs.
- AI responses are non-deterministic; UI must handle null image/audio and transient API failures.
- CORS depends on `CLIENT_URL`; mismatches break browser API calls.

## Recommended Practices for Contributors
- Keep API and TS models in sync whenever schema changes.
- Preserve route prefix conventions (`/api/*`) and centralized router registration.
- Keep long-running/optional enrichments (audio/image) non-blocking.
- Avoid moving session persistence out of `localStorage` unless introducing a full persistence layer.
- Add error handling first when expanding AI endpoints.
- Keep visual theme tokens in `globals.css` as the single source for palette/typography.

## Known Gaps / Follow-ups
- `.env.local` currently contains a live-looking API key; rotate and replace with a non-sensitive local secret.
- `api/config.py` default `PORT=8000` and `.env.local` sets `PORT=4000`; runtime behavior depends on launch command.
- File name typo exists: `src/components/modules/stats/choas-level.tsx` (consider rename for consistency).
