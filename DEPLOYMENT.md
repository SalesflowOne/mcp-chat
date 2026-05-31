# AgentOps / mcp-chat — Deployment

## Architecture

- **Clerk** — authentication, organizations, sessions
- **Supabase** — all tenant application data (`app_users`, `organizations`, `chat_threads`, etc.)
- **Server-side access control** — Clerk validates identity; API routes use `SUPABASE_SERVICE_ROLE_KEY` only after membership checks

## Required environment variables

| Variable | Scope | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk dashboard |
| `CLERK_SECRET_KEY` | Server only | Clerk dashboard |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase API keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Never expose to browser |
| `OPENAI_API_KEY` (or other AI keys) | Server | At least one provider |
| `PIPEDREAM_*` | Server | MCP integrations |
| `DISABLE_AUTH` | Server | `false` in production |
| `DISABLE_PERSISTENCE` | Server | `false` when Supabase is configured |

## Supabase setup

1. Create or use the same Supabase project as **agent-workspace**.
2. Run the migration in `supabase/migrations/20260531130000_agentops_multitenant_foundation.sql` via Supabase SQL editor or CLI.
3. Copy URL, anon key, and service role key into Vercel.

```bash
# Optional local bootstrap for master admin after first sign-in
npx tsx scripts/bootstrap-master-admin.ts
```

## Clerk setup

1. Add your deployment URL to **Clerk → Domains** (e.g. `https://agentops-mcp-chat.vercel.app`).
2. Enable **Organizations** in Clerk if you use Clerk org switching.
3. Set `DISABLE_AUTH=false` on Vercel and redeploy.

## Master admin

Email `ceo@salesflow.one` is promoted on every Clerk sync:

- `role = master_admin`
- `is_master_admin = true`

Admin UI: `/admin` (master admin only, server-enforced).

## Sync env from agent-workspace (Vercel)

```bash
VERCEL_TOKEN=... node scripts/sync-vercel-env.mjs
```

The sync script copies Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) from `agent-workspace` when present.
