## Clerk setup (agentops.one satellite)

`agentops.one` is a **Clerk satellite**. You cannot use embedded `<SignIn />` on this domain — Clerk returns *"not allowed on a satellite domain"*.

**Sign-in URL (Account Portal):** `https://accounts.oneaccess.one/sign-in` (until `accounts.agentops.one` DNS exists)

Flow:

1. User visits `https://agentops.one/sign-in`
2. App redirects to Account Portal with `?redirect_url=https://agentops.one/...`
3. After auth, user returns to `https://agentops.one`

**Vercel env (defaults in code if unset):**

- `NEXT_PUBLIC_CLERK_IS_SATELLITE=true`
- `NEXT_PUBLIC_CLERK_DOMAIN=agentops.one`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://accounts.oneaccess.one/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://accounts.oneaccess.one/sign-up`
- `NEXT_PUBLIC_APP_URL=https://agentops.one`

### Fix `DNS_PROBE_FINISHED_NXDOMAIN` for accounts.agentops.one

`accounts.agentops.one` has **no DNS record** today. Add this at your DNS host (same place as `agentops.one`):

| Type  | Name      | Value                    |
|-------|-----------|--------------------------|
| CNAME | `accounts` | `accounts.clerk.services` |

In **Clerk Dashboard → Configure → Domains → Account portal**, verify `accounts.agentops.one`, then switch Vercel env to:

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://accounts.agentops.one/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://accounts.agentops.one/sign-up`

**Already working:** `clerk.agentops.one` (satellite Frontend API), `accounts.oneaccess.one` (Account Portal, same One OS instance).

Do **not** use `sso.oneaccess.one` or apex `oneaccess.one` (no DNS).

### Fix redirect to dead `oneaccess.one` after sign-in

Clerk Dashboard still has **Home URL** and **After sign-in URL** set to `https://oneaccess.one` (no DNS). That is **not** in this repo — it is instance config from Clerk.

**Required (Clerk Dashboard → Configure → Paths / Account Portal):**

| Setting | Set to |
|---------|--------|
| Home URL | `https://agentops.one` |
| After sign-in URL | `https://agentops.one` |
| After sign-up URL | `https://agentops.one` |
| Allowed redirect URLs | `https://agentops.one` |

**Vercel env (set by sync script):**

- `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=https://agentops.one/`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=https://agentops.one/`
- `NEXT_PUBLIC_APP_URL=https://agentops.one`

Until the dashboard URLs are updated, users may still land on `oneaccess.one` after Account Portal sign-in if Clerk ignores `redirect_url`.
