## Clerk setup (agentops.one satellite)

### Why sign-in uses `accounts.oneaccess.one`

AgentOps is on the **shared One OS Clerk instance**. The hosted sign-in UI lives at `accounts.oneaccess.one` (same as other satellites). That is **not** the dead apex `oneaccess.one`.

After sign-in, users are sent to **`https://agentops.one/`** via `redirect_url` and `sign_in_force_redirect_url`.

### Cloudflare DNS (agentops.one zone)

Run:

```bash
node scripts/setup-cloudflare-agentops-dns.mjs
```

| Subdomain | CNAME target |
|-----------|----------------|
| `accounts` | `accounts.clerk.services` |
| `clerk` | `frontend-api.clerk.services` |

Records must be **DNS only** (grey cloud), not proxied.

`accounts.agentops.one` DNS is required for the future switch, but **Clerk must also provision** that hostname on their edge (Dashboard → Domains → agentops.one). Until then, the app uses `accounts.oneaccess.one`.

### Vercel env

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `https://accounts.oneaccess.one/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `https://accounts.oneaccess.one/sign-up` |
| `NEXT_PUBLIC_APP_URL` | `https://agentops.one` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | `https://agentops.one/` |
| `NEXT_PUBLIC_CLERK_PROXY_URL` | `https://agentops.one/__clerk` |

### Clerk Dashboard (required)

**Configure → Paths** — set Home, After sign-in, After sign-up, Logo link to **`https://agentops.one`** (not `https://oneaccess.one`).

**Domains → agentops.one** — verify `accounts` CNAME so `accounts.agentops.one` can replace `accounts.oneaccess.one` later.

### Vercel domains

Run `node scripts/fix-vercel-agentops-domains.mjs` — apex serves app; www → apex.
