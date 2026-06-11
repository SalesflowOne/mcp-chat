## Auth (Supabase)

AgentOps uses **Supabase Auth** as the single identity provider. The app ships branded pages at:

| Route | Purpose |
|-------|---------|
| `/login` | Email/password sign in |
| `/register` | New account signup |
| `/forgot-password` | Request password reset email |
| `/reset-password` | Set new password from email link |
| `/settings` | Profile + password management |

Legacy `/sign-in` and `/sign-up` redirect to `/login` and `/register`.

### Required environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser + middleware) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin operations only |
| `AGENTOPS_PERSIST_SECRET` | RPC fallback when service role unavailable on Vercel |
| `NEXT_PUBLIC_APP_URL` | App origin for auth redirects (`https://agentops.one`) |

### Supabase Dashboard

1. **Authentication → URL configuration**
   - Site URL: `https://agentops.one`
   - Redirect URLs: `https://agentops.one/auth/callback`, `https://agentops.one/reset-password`
2. **Authentication → Providers** — enable Email
3. Run migrations in `supabase/migrations/` including `20260612100000_supabase_auth_profiles.sql`

### Data model (OneAccess-ready)

- `profiles` — global user fields (`auth.users.id` FK)
- `user_roles` — per-app roles (`app_id = 'agentops'`)
- `app_users` — app-specific flags (`is_master_admin`, etc.)
- `organizations` / `organization_members` — workspaces

Service-role access on the server enforces tenant boundaries after `auth.getUser()`.

## Supabase persistence

See `scripts/fix-vercel-supabase-env.mjs` and `scripts/sync-vercel-env.mjs` for Vercel env setup.
