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
3. Copy URL, anon key, and **service role** key into Vercel (`SUPABASE_SERVICE_ROLE_KEY`).
   - On the shared **One OS** project, use migration `20260531140000_agentops_mcp_chat_tables.sql` (not the full foundation file if `organizations` already exists).
   - `agent-workspace` may have empty `SUPABASE_SERVICE_ROLE_KEY` — paste the service role from **Supabase → Project Settings → API**.

```bash
# Optional local bootstrap for master admin after first sign-in
npx tsx scripts/bootstrap-master-admin.ts
```

## Clerk setup (agentops.one)

`agentops.one` is a **Clerk satellite domain** in the dashboard, but **`sso.oneaccess.one` is not live** (DNS does not resolve). This app therefore uses **standalone sign-in** on agentops itself.

**Vercel env (agentops-mcp-chat):**

- `NEXT_PUBLIC_CLERK_STANDALONE_AUTH=true`
- `NEXT_PUBLIC_CLERK_DOMAIN=agentops.one`
- Do **not** set `NEXT_PUBLIC_CLERK_SIGN_IN_URL` to `sso.oneaccess.one` or `oneaccess.one`
- `DISABLE_AUTH=false`

Sign-in URL: `https://agentops.one/sign-in` (Clerk `<SignIn />` hosted here).

If you later deploy a working primary One OS app, set `NEXT_PUBLIC_CLERK_STANDALONE_AUTH=false`, `NEXT_PUBLIC_CLERK_IS_SATELLITE=true`, and point `NEXT_PUBLIC_CLERK_SIGN_IN_URL` at that app's `/sign-in`.

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
