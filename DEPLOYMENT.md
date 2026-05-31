## Clerk setup (agentops.one satellite)

`agentops.one` is a **Clerk satellite**. You cannot use embedded `<SignIn />` on this domain — Clerk returns *"not allowed on a satellite domain"*.

**Sign-in URL (Account Portal):** `https://accounts.agentops.one/sign-in`

Flow:

1. User visits `https://agentops.one/sign-in`
2. App redirects to `https://accounts.agentops.one/sign-in?redirect_url=...`
3. After auth, user returns to `https://agentops.one`

**Vercel env:**

- `NEXT_PUBLIC_CLERK_IS_SATELLITE=true`
- `NEXT_PUBLIC_CLERK_DOMAIN=agentops.one`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://accounts.agentops.one/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://accounts.agentops.one/sign-up`
- `NEXT_PUBLIC_APP_URL=https://agentops.one`

**DNS (Clerk Dashboard → Domains):**

- Satellite `agentops.one` — Verified (you have this)
- Account portal `accounts.agentops.one` — add the CNAME Clerk shows under **Account portal** / **Domains** if sign-in does not load

Do **not** use `sso.oneaccess.one` (no DNS).
