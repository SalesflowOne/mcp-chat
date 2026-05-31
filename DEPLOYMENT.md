## Clerk setup (agentops.one satellite)

`agentops.one` is a **Clerk satellite** on the shared One OS Clerk instance. The app must **not** send users to apex `oneaccess.one` (no DNS). Sign-in uses **`accounts.agentops.one`**, not `accounts.oneaccess.one`.

### Auth flow

1. User opens `https://agentops.one/sign-in`.
2. App redirects to `https://accounts.agentops.one/sign-in` with `redirect_url` and `sign_in_force_redirect_url` set to `https://agentops.one/`.
3. After sign-in, Clerk returns to **agentops.one** (not oneaccess.one).

### Required DNS (Cloudflare)

| Host | Type | Value |
|------|------|--------|
| `accounts` | CNAME | `accounts.clerk.services` |

Then verify the domain in **Clerk Dashboard → Domains** if prompted.

### Vercel env

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_CLERK_IS_SATELLITE` | `true` |
| `NEXT_PUBLIC_CLERK_DOMAIN` | `agentops.one` |
| `NEXT_PUBLIC_CLERK_PROXY_URL` | `https://agentops.one/__clerk` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `https://accounts.agentops.one/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `https://accounts.agentops.one/sign-up` |
| `NEXT_PUBLIC_APP_URL` | `https://agentops.one` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | `https://agentops.one/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` | `https://agentops.one/` |

Run `node scripts/sync-vercel-env.mjs` and `node scripts/fix-clerk-auth.mjs`.

### Vercel domains

- Apex `agentops.one` serves the app (no redirect to www).
- `www.agentops.one` → `agentops.one` (308). Run `node scripts/fix-vercel-agentops-domains.mjs` if needed.

### Clerk Dashboard (stop oneaccess.one fallbacks)

**Configure → Paths** — set Home, After sign-in, After sign-up, and Logo link to **`https://agentops.one`**.

The API cannot set these to a satellite domain; the app passes `sign_in_force_redirect_url` on Account Portal links as a safeguard.
