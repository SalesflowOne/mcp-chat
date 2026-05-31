## Clerk setup (agentops.one satellite)

`agentops.one` is a **Clerk satellite** on the One OS Clerk instance (primary domain `oneaccess.one` — DNS not required for app traffic; only Clerk Account Portal / FAPI use it today). Embedded `<SignIn />` on the satellite domain is blocked by Clerk.

**Account Portal (sign-in):** `https://accounts.oneaccess.one/sign-in` (same pattern as other satellites until `accounts.agentops.one` DNS exists).

### Auth flow

1. User opens `https://agentops.one/sign-in` (www redirects to apex via `vercel.json`).
2. Client calls `Clerk.buildSignInUrl()` → Account Portal with `redirect_url` including `__clerk_sync=1`.
3. User signs in on `accounts.oneaccess.one`.
4. Clerk redirects back to `https://agentops.one/` and the satellite syncs the session.
5. FAPI uses `https://agentops.one/__clerk` (Next.js middleware proxy).

Do **not** hardcode Account Portal URLs without `buildSignInUrl()` — session sync will fail.

### Vercel env

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_CLERK_IS_SATELLITE` | `true` |
| `NEXT_PUBLIC_CLERK_DOMAIN` | `agentops.one` |
| `NEXT_PUBLIC_CLERK_PROXY_URL` | `https://agentops.one/__clerk` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `https://accounts.oneaccess.one/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `https://accounts.oneaccess.one/sign-up` |
| `NEXT_PUBLIC_APP_URL` | `https://agentops.one` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | `https://agentops.one/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` | `https://agentops.one/` |

Run `node scripts/sync-vercel-env.mjs` (needs `VERCEL_TOKEN`) or set in the Vercel dashboard.

Run `node scripts/fix-clerk-auth.mjs` (needs `CLERK_SECRET_KEY`) for allowed redirect origins + satellite proxy URL.

### Vercel domains

Canonical host is **apex** `agentops.one` (like `clawops.one`). `vercel.json` redirects `www.agentops.one` → `agentops.one`.

In **Vercel → Project → Domains**, avoid a project-level rule that sends `agentops.one` → `www` (that breaks the Clerk proxy). Prefer apex as primary.

### Clerk Dashboard (recommended)

**Configure → Paths** — instance defaults may still point at `https://oneaccess.one` (no DNS). Set:

| Setting | Value |
|---------|--------|
| Home URL | `https://agentops.one` |
| After sign-in URL | `https://agentops.one` |
| After sign-up URL | `https://agentops.one` |
| Logo link URL | `https://agentops.one` |

**Configure → Domains → agentops.one (satellite)** — proxy URL: `https://agentops.one/__clerk`.

### Optional DNS

| Host | Type | Value |
|------|------|--------|
| `accounts.agentops.one` | CNAME | `accounts.clerk.services` |
| `clerk.agentops.one` | CNAME | `frontend-api.clerk.services` (optional if using `__clerk` proxy) |
