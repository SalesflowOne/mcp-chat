## Clerk setup (agentops.one satellite)

`agentops.one` is a **Clerk satellite** on the One OS instance (`oneaccess.one` primary). Embedded `<SignIn />` on the satellite domain is blocked by Clerk.

**Account Portal (sign-in):** `https://accounts.oneaccess.one/sign-in` until `accounts.agentops.one` DNS exists.

### Auth flow (after this fix)

1. User opens `https://www.agentops.one/sign-in` (apex redirects to www).
2. Client calls `Clerk.buildSignInUrl()` → Account Portal with `redirect_url` including `__clerk_sync=1`.
3. User signs in on `accounts.oneaccess.one`.
4. Clerk redirects back to `https://www.agentops.one/?__clerk_sync=1` and the satellite syncs the session.
5. FAPI traffic uses `https://www.agentops.one/__clerk` (proxied by Next.js middleware). Use **www** — Vercel redirects apex to www and Clerk rejects a proxy on a different host than the browser.

Do **not** hardcode Account Portal links without `buildSignInUrl()` — session sync will fail.

### Vercel env

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_CLERK_IS_SATELLITE` | `true` |
| `NEXT_PUBLIC_CLERK_DOMAIN` | `www.agentops.one` |
| `NEXT_PUBLIC_CLERK_PROXY_URL` | `https://www.agentops.one/__clerk` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `https://accounts.oneaccess.one/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `https://accounts.oneaccess.one/sign-up` |
| `NEXT_PUBLIC_APP_URL` | `https://www.agentops.one` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | `https://www.agentops.one/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` | `https://www.agentops.one/` |

Run `node scripts/sync-vercel-env.mjs` (needs `VERCEL_TOKEN`) or set these in the Vercel dashboard.

Run `node scripts/fix-clerk-auth.mjs` (needs `CLERK_SECRET_KEY`) to refresh allowed redirect origins and the satellite proxy URL in Clerk.

### Clerk Dashboard (required once)

**Configure → Paths** — the instance still defaults to `https://oneaccess.one` (no DNS). Set:

| Setting | Value |
|---------|--------|
| Home URL | `https://www.agentops.one` |
| After sign-in URL | `https://www.agentops.one` |
| After sign-up URL | `https://www.agentops.one` |
| Logo link URL | `https://www.agentops.one` |

The Backend API cannot set `home_url` to a satellite domain; this must be done in the dashboard (or add DNS for apex `oneaccess.one`).

**Configure → Domains → www.agentops.one (satellite)** — proxy URL should be `https://www.agentops.one/__clerk` (set automatically by `scripts/fix-clerk-auth.mjs`).

### Optional DNS

| Host | Type | Value |
|------|------|--------|
| `accounts.agentops.one` | CNAME | `accounts.clerk.services` |
| `clerk.agentops.one` | CNAME | `frontend-api.clerk.services` (optional if using `__clerk` proxy) |
| `oneaccess.one` | A/ALIAS or redirect | Point to a live app or redirect to `https://www.agentops.one` |

Do **not** use apex `oneaccess.one` without DNS — users will see `DNS_PROBE_FINISHED_NXDOMAIN`.
