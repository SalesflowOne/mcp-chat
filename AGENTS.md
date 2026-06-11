# AGENTS.md

## Cursor Cloud specific instructions

### Product

Single **Next.js 16** app (`mcp-chat` / AgentOps): AI chat with **Pipedream MCP** tool integration, optional **Clerk** auth, and optional **Supabase** persistence.

### Minimal local dev (recommended for agents)

Copy env and disable auth/persistence (defaults in `.env.example`):

```bash
cp .env.example .env.local
# Set DISABLE_AUTH=true and DISABLE_PERSISTENCE=true (already in .env.example)
# Add at least one LLM key: OPENAI_API_KEY and/or ANTHROPIC_API_KEY
# Add Pipedream OAuth credentials for chat to complete (see below)
pnpm install
pnpm dev
```

App runs at **http://localhost:3000**. Health check: `GET /healthcheck` → `{"status":"ok"}`.

### Required secrets for full chat E2E

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` | LLM responses |
| `PIPEDREAM_CLIENT_ID`, `PIPEDREAM_CLIENT_SECRET`, `PIPEDREAM_PROJECT_ID`, `PIPEDREAM_PROJECT_ENVIRONMENT` | MCP tool discovery (chat hangs without these) |

Optional: `EXA_API_KEY` (Web_Search tool), Clerk + Supabase vars when `DISABLE_AUTH=false` / `DISABLE_PERSISTENCE=false`.

### Toolchain

- **Node.js** 22.x (see `.tool-versions`)
- **pnpm** 9.12.3 (`packageManager` in `package.json`; run `corepack enable` if needed)
- No Python runtime; no Docker required for minimal dev

### Common commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Production build | `pnpm build` |
| Start production | `pnpm start` |
| Lint (note) | `pnpm lint` currently fails on Next.js 16 — `next lint` was removed; use `pnpm exec biome lint .` for Biome checks |
| DB migrations (legacy Postgres) | `docker compose up -d` then `POSTGRES_URL=postgresql://postgres@localhost:5432/postgres pnpm db:migrate` |

### Gotchas

- **Chat requires Pipedream MCP**: The `/api/chat` route always connects to `https://remote.mcp.pipedream.net`. Without valid Pipedream OAuth credentials, submissions hang on "Beep boop beep..." with `Failed to establish MCP connection` in server logs.
- **Auth bypass**: With `DISABLE_AUTH=true`, middleware uses a guest session (`EXTERNAL_USER_ID` or generated guest id).
- **Persistence bypass**: With `DISABLE_PERSISTENCE=true`, chat history is not saved; Supabase/Postgres are not needed.
- **Redis in docker-compose.yml** is unused by application code.
- **Artifacts/Documents** still use legacy Drizzle/Postgres even when Supabase handles chat history.

### Full production-like dev

Set `DISABLE_AUTH=false`, `DISABLE_PERSISTENCE=false`, configure Clerk + Supabase, apply migrations in `supabase/migrations/`, then `pnpm dev`.
