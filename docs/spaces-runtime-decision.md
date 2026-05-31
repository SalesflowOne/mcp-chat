# AgentOps Spaces Runtime Decision

**Status:** Architecture recommendation only (no implementation in this document)  
**Date:** 2026-05-31  
**Repo:** `SalesflowOne/mcp-chat` (AgentOps / One OS)

---

## Executive Summary

**Recommended architecture:** **Option D — Supabase as system of record + a dedicated preview/runtime layer inside this repo** (extend the existing Vercel AI Chat / artifact side-panel pattern; do not adopt Convex or replace the foundation with bolt.diy/Lovable yet).

**Confidence:** **8/10**

Spaces are not a new database problem alone. They are a **generated multi-file artifact + safe in-browser preview + versioning + publish pipeline** problem. This repo already has ~60% of the *UX shell* (chat + right-hand artifact panel + streaming + version footer) but lacks multi-file projects, HTML/site preview, org-scoped artifact storage on Supabase, and wired agent tools for site generation.

Use **Supabase-only** for metadata, versions, permissions, usage, and file blobs. Add a **sandboxed iframe preview** (static HTML/CSS/JS first) served via a **tenant-scoped preview API route**, not arbitrary React execution in the parent app. Defer Convex, WebContainers, full Vite dev servers, and production deploy automation to later phases.

---

## Clarified Definition of Spaces

In AgentOps, **Spaces** are:

- AI-generated **websites, landing pages, simple apps, or dashboards** (client deliverables)
- Created and revised through **chat**
- **Previewed inside** the AgentOps UI (Viktor Spaces–style: chat left, preview right)
- **Versioned** over time
- Eventually **shared or published** (public link, Vercel/Coolify deploy)

Spaces are **not** primarily:

- Project workrooms or team collaboration rooms
- Replacements for chat threads (though a Space may link to a thread)

---

## Current Codebase Findings

### Framework and routing

| Area | Finding |
|------|---------|
| Framework | **Next.js 16** App Router (`app/`), React 19 RC, `output: "standalone"` in `next.config.ts` |
| Layout | `(chat)/` route group: home, `chat/[id]`, `accounts`, `admin` |
| Auth routes | `(auth)/`: sign-in/up (Clerk satellite → Account Portal redirect) |
| API | Route handlers under `app/(chat)/api/` and `app/api/` |

### Auth (Clerk)

- `@clerk/nextjs` with `middleware.ts`, satellite config in `lib/clerk-config.ts`
- `getEffectiveSession()` in `lib/auth-utils.ts` resolves Clerk user + Supabase tenant (`appUserId`, `organizationId`)
- Master admin flag exists on `app_users.is_master_admin` (bootstrap script present; not fully productized in UI)

### Database — dual persistence (important)

| Layer | Technology | What it stores today |
|-------|------------|----------------------|
| **Supabase (new)** | `@supabase/supabase-js`, migrations in `supabase/migrations/` | `app_users`, `organizations`, `organization_members`, `chat_threads`, `chat_messages`, `connected_accounts`, `usage_events`, RLS enabled (server uses service role after app checks) |
| **Legacy Drizzle** | `drizzle-orm` + `POSTGRES_URL`, schema in `lib/db/schema.ts` | `Chat`, `Message_v2`, `Document`, `Suggestion`, `Vote_v2`, legacy `User` |

**Chat** persistence is bridged: `lib/db/queries.ts` uses Supabase when configured (`lib/data/chat-supabase.ts`), else Drizzle.

**Artifacts/documents** (`Document` table, `/api/document`) are **still Drizzle-only** — not migrated to Supabase, **not org-scoped**.

### Convex

- **Not present** — no `convex` package, no `convex/` directory, no Convex env vars.

### Chat and AI

- **AI SDK v4** (`ai`, `@ai-sdk/react`, provider packages)
- Chat API: `app/(chat)/api/chat/route.ts` + `streamText.ts` (multi-step tool loop, max 20 steps)
- **Primary tools today:** Pipedream MCP (`mods/mcp-client.ts`) + `web_search` (Exa) — not Space builders
- Models: Anthropic, OpenAI, Google via `lib/ai/providers.ts`; dedicated `artifact-model` for document streaming handlers

### Artifact system (closest existing “Spaces” UI)

Inherited from **Vercel AI Chatbot** / Pipedream fork:

| Component | Role |
|-----------|------|
| `components/artifact.tsx` | Full-screen/side panel: chat + artifact split (Framer Motion, ~400px artifact width on desktop) |
| `components/create-artifact.tsx` | Pluggable artifact types |
| `artifacts/{text,code,image,sheet}/` | Client + server handlers |
| `lib/artifacts/server.ts` | `createDocument` / `updateDocument` handlers, version saves |
| `hooks/use-artifact.ts` | Client artifact state |
| `components/document-preview.tsx` | Inline preview in messages |

**Kinds today:** `text` (ProseMirror), `code` (CodeMirror + **Pyodide Python only**), `image`, `sheet` (CSV grid).

**Gaps for Spaces:**

- Single `content` string per document version — **no multi-file tree** (`index.html`, `styles.css`, `app.tsx`)
- **No HTML landing-page preview** in iframe
- **No React/Next/Vite app runtime**
- `artifactsPrompt` exists in `lib/ai/prompts.ts` but is **not included** in `systemPrompt()` — artifact tools appear **disconnected** from the live MCP-focused chat path (UI still supports artifact rendering if tools were re-enabled)
- Document auth checks `document.userId` vs session — **no `organization_id`**

### Storage and files

- `@vercel/blob` used for chat image uploads (`app/(chat)/api/files/upload/route.ts`)
- No Supabase Storage integration yet for generated assets

### MCP / integrations

- Pipedream MCP is the product differentiator (~3k APIs)
- `connected_accounts` table in Supabase for org-scoped integration metadata
- Not aligned with “generate a website” unless agent uses generic tools creatively

### Deployment

- Vercel (`vercel.json`: Next.js framework)
- Clerk satellite + Supabase env documented in `DEPLOYMENT.md`
- No in-repo Vercel deploy API or Coolify integration for user-generated sites

### Package notes relevant to preview

- `react-resizable-panels` is in `package.json` but **not used** for the main chat/artifact layout (custom Framer layout instead)
- `react-markdown` present — usable for markdown artifacts, not full sites
- Pyodide loaded globally in chat layout for Python code artifact “Run”

---

## What Spaces Technically Requires

| Capability | Required for MVP | Notes |
|------------|------------------|-------|
| Space entity | Yes | Title, org, owner, status, optional link to `chat_thread_id` |
| Multi-file artifacts | Yes | `index.html`, CSS, JS, optional assets |
| Version snapshots | Yes | Immutable version per agent revision |
| Chat ↔ Space binding | Yes | User revises via chat; agent updates files |
| In-app preview | Yes | **Sandboxed** render of generated output |
| File storage | Yes | DB for small text; object storage for larger bundles |
| Tenant isolation | Yes | All rows keyed by `organization_id` + membership checks |
| Public share link | Foundation | Opaque token, optional expiry |
| Deploy record | Foundation | URL, provider, status — actual deploy later |
| Real-time multi-user co-editing | No (defer) | Single-user + agent is enough for MVP |
| Full React/Next build pipeline | No (defer) | Start static HTML/CSS/JS |
| Custom domains | No (defer) | Needs deploy layer + DNS |
| GitHub sync | No (defer) | Optional export later |

---

## Database Options

### Option A — Supabase-only

**Verdict:** **Yes for all metadata, versions, permissions, publishing records, and small source files.** Use **Supabase Storage** (or Vercel Blob with org prefixes) for bundles/assets.

### Option B — Convex-only

**Verdict:** **No for this product stage.** Would duplicate Clerk-adjacent tenancy already being built on Supabase, require new auth rules, and split chat (Supabase) from Spaces (Convex).

### Option C — Hybrid Supabase + Convex

**Verdict:** **Not recommended for MVP.** Supabase Realtime + SWR/React state is sufficient for “agent streamed new version → refresh preview.” Convex only pays off for collaborative live editing or complex reactive DAGs — explicitly deferred.

### Option D — Supabase + preview/runtime layer

**Verdict:** **Recommended.** Matches clarified product definition and existing UI patterns.

### Option E — Different OSS foundation (bolt.diy, etc.)

**Verdict:** **Do not switch repo for MVP.** bolt.diy/OpenHands optimize for IDE + repo + terminal; this repo optimizes for **MCP + multi-tenant SaaS + Clerk**. Forking bolt would delay shipping Spaces inside AgentOps and duplicate auth/tenant work.

---

## Supabase-only Evaluation

### Can Supabase handle?

| Concern | Answer |
|---------|--------|
| `spaces` table | Yes |
| Generated files / artifacts | Yes — `space_files` + Storage bucket |
| Version history | Yes — `space_versions` with JSON snapshot or file manifest |
| Page metadata | Yes — JSON columns on `spaces` |
| Deployment records | Yes — `space_deployments` |
| Published URLs | Yes — store canonical URL + slug |
| Permissions | Yes — RLS + server `requireOrgAccess()` (existing pattern) |
| Usage events | Yes — extend `usage_events` |
| Org isolation | Yes — `organization_id` on all Space tables |
| Basic realtime | Yes — Supabase Realtime on `space_versions` or `spaces.updated_at` (optional MVP+) |

### Rendering model

Supabase stores **source code and metadata**; the **Next.js app** renders preview via:

1. Server route `GET /api/spaces/:id/preview` (or `/spaces/:id/preview/frame`) that returns HTML with strict **CSP** and **sandbox** iframe `src`
2. Parent UI embeds iframe — generated JS never runs in AgentOps root origin

**Uncertainty:** Exact RLS policies for Storage public buckets vs signed URLs for share links — design at implementation time; both are standard Supabase patterns.

### Migration note

Existing `Document` / Drizzle artifact rows should **not** be the long-term store. New Space tables on Supabase; optional one-time migration or leave legacy artifacts as “documents” separate from Spaces.

---

## Convex Evaluation

### Would Convex materially improve?

| Area | Benefit | MVP need |
|------|---------|----------|
| Live editing | High for Google Docs–style | Low — agent-driven revisions |
| Chat → preview reactivity | Medium | Achievable with streaming + mutate SWR / Realtime |
| Revision history | Low — Postgres timestamps suffice | |
| Background job state | Medium for deploy pipelines | Defer — use `space_deployments.status` + polling |
| Collaborative editing | High | Out of scope |

**Conclusion:** Convex adds **operational and mental overhead** without unlocking MVP. Revisit only if you ship **multiplayer live co-editing** or **client-side reactive graph** state that outgrows Postgres.

---

## Hybrid Evaluation

Supabase (record of truth) + Convex (live state) is **justified only after** you prove Supabase Realtime or polling is too slow for your UX — unlikely for agent-paced updates (seconds, not milliseconds).

---

## Runtime and Preview Options

### A. Markdown/HTML artifact renderer

| Pros | Cons |
|------|------|
| Simple, fast MVP for landing copy | Not a real “app”; limited interactivity |
| Reuse `react-markdown` / text artifact | No `<script>` execution |

**Use for:** Phase 0 copy-only pages inside existing text artifact — **not sufficient alone** for Viktor-style Spaces.

### B. React component artifact renderer (in-parent)

| Pros | Cons |
|------|------|
| Rich UI in theory | **Dangerous** — arbitrary code execution in AgentOps origin |
| | Bundling, imports, and RSC boundaries are hard |

**Verdict:** **Do not** execute model-generated React in the parent app for MVP.

### C. Sandboxed iframe (static HTML/CSS/JS bundle) — **recommended MVP**

| Pros | Cons |
|------|------|
| Strong isolation (`sandbox`, CSP, separate origin via blob URL or preview route) | No npm install in browser for MVP |
| Matches “landing page / simple app” scope | Cross-origin messaging needed for “inspect element” later |
| Works with multi-file (inline or single HTML entry) | Must sanitize/limit network (no arbitrary fetch to internal APIs) |

**Implementation sketch:** Agent writes `index.html` + assets → stored in Supabase → preview route assembles → iframe `src` with `sandbox="allow-scripts"` (no `allow-same-origin` unless required).

### D. Vite / WebContainer / StackBlitz-style

| Pros | Cons |
|------|------|
| Real React/Vite apps in browser | Large bundle, memory, mobile issues |
| | Far beyond Viktor MVP |

**Defer** until static iframe MVP is validated.

### E. GitHub + Vercel preview deploys

| Pros | Cons |
|------|------|
| Production-faithful preview | Slow (minutes), needs GH + Vercel tokens per org |
| | Cost and abuse surface |

**Defer** to “Publish” phase 2; keep `space_deployments` schema ready.

### F. Coolify preview deploys

Same as E but self-hosted — **higher ops burden**. Defer unless product is explicitly self-hosted-first.

---

## Existing Foundation Evaluation

| Foundation | Fit for AgentOps Spaces |
|------------|-------------------------|
| **PipedreamHQ/mcp-chat (this repo)** | **Best** — MCP, Clerk, Supabase tenant work, artifact panel UI |
| Vercel AI Chatbot | Same lineage; this repo is already the fork |
| LibreChat / Open WebUI | Chat + plugins; weak artifact/site builder UX |
| bolt.diy | Strong builder; weak MCP/Clerk/tenant fit; massive pivot |
| OpenHands | Agent dev environments; not productized SaaS preview |
| Lovable (external) | Reference UX only; not in-repo |

**Recommendation:** **Stay on this repo.** Add a `spaces` module (routes, API, DB, preview) rather than replacing the foundation.

---

## Recommendation

### Recommended architecture

**Option D: Supabase + sandbox/runtime preview layer** (extend existing artifact/chat split UI).

### Confidence level

**8/10**

(-1: artifact tools not fully wired to current MCP chat path; -1: publish/deploy path unproven in this repo.)

### Reason

You already invested in **Clerk + Supabase multi-tenancy** and inherited a **proven chat + side-panel artifact UX**. Spaces mainly adds **multi-file storage**, **iframe preview**, and **agent tools** — not a second database or a new product repo. Convex does not remove the hard problem (safe execution of generated code); a **sandbox iframe** does.

### Tradeoffs

| Gain | Lose |
|------|------|
| Single data plane (Supabase) aligned with chat/orgs | Must build preview security carefully |
| Reuse artifact panel patterns | Full Lovable/bolt parity takes quarters |
| Faster MVP than repo switch | Drizzle `Document` path becomes legacy unless migrated |
| Vercel-friendly (API routes + Blob/Storage) | Real React apps need phase 2 runtime or deploy previews |

### Biggest risk

**Unsafe or broken preview of model-generated HTML/JS** — XSS if preview shares cookies with main app, or SSRF if preview server fetches internal URLs. Mitigate with **dedicated preview origin**, strict **CSP**, **sandbox iframe**, no auth cookies on preview subdomain, and server-side validation of file paths.

### Deferred

- Convex
- WebContainer / in-browser Vite
- Arbitrary React component execution in parent
- GitHub + Vercel/Coolify automated deploy
- Custom domains
- Collaborative multi-cursor editing
- Master admin UI (except existing bootstrap)
- Replacing MCP-first positioning with pure “site builder”

---

## Proposed MVP Architecture

### UX (target)

```
┌─────────────────┬──────────────────────────────┐
│ Chat (thread)   │  Preview (sandboxed iframe)   │
│                 │                              │
│ User ↔ Agent    │  Live render of index.html   │
├─────────────────┴──────────────────────────────┤
│ Tabs: Files | Versions | (Publish disabled)    │
└────────────────────────────────────────────────┘
```

- Route: `/spaces/[spaceId]` or embed Space mode from chat when agent creates a Space
- Reuse `Artifact` layout concepts (`components/artifact.tsx`) with Space-specific toolbar

### Agent flow

1. User: “Build a landing page for …”
2. Agent tool: `createSpace` / `updateSpaceFiles` (new tools; re-enable pattern from `createDocument`)
3. Server streams file deltas → saves `space_version` snapshot
4. Client subscribes to latest version → reloads iframe preview

### API surface (conceptual)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/spaces` | Create space |
| `GET/PATCH /api/spaces/:id` | Metadata |
| `GET/PUT /api/spaces/:id/files` | File tree |
| `POST /api/spaces/:id/versions` | Snapshot (internal, on agent complete) |
| `GET /api/spaces/:id/preview` | Sandboxed HTML entry |
| `POST /api/spaces/:id/share` | Create share token |
| `GET /public/spaces/:token` | Public read-only preview (later) |

### Runtime layer

- **MVP:** Static site compiler on server — given `space_files`, produce one HTML response (inline CSS/JS or linked paths under `/api/spaces/:id/assets/*`)
- **Preview delivery:** `iframe` pointing to preview URL with `Content-Security-Policy` and `X-Frame-Options` only where needed

### Publishing foundation (no full deploy in MVP)

- `space_share_links` — read-only token URL
- `space_deployments` — `status: pending|live|failed`, `provider`, `url` nullable
- Button “Share preview” before “Deploy to Vercel”

---

## Proposed Data Model

All tables include `organization_id uuid not null references organizations(id)`.

### `spaces`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid | Tenant |
| created_by | uuid → app_users | |
| chat_thread_id | uuid nullable | Optional link to chat |
| title | text | |
| slug | text | Unique per org |
| status | text | `draft`, `published`, `archived` |
| preview_kind | text | `static_html` (MVP) |
| metadata | jsonb | theme, description, OG tags |
| created_at / updated_at | timestamptz | |

### `space_files`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| space_id | uuid | |
| path | text | e.g. `index.html`, `styles.css` |
| content | text nullable | Inline if small |
| storage_path | text nullable | Supabase Storage key if large |
| mime_type | text | |
| updated_at | timestamptz | |

Unique `(space_id, path)`.

### `space_versions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| space_id | uuid | |
| version_number | int | Monotonic |
| message_id | uuid nullable | Link to chat_messages |
| snapshot | jsonb | Manifest: `[{path, content_hash, storage_path}]` |
| created_by | uuid | |
| created_at | timestamptz | |

Immutable; preview reads a specific version or `latest`.

### `space_share_links`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| space_id | uuid | |
| token | text unique | Opaque |
| expires_at | timestamptz nullable | |
| created_at | timestamptz | |

### `space_deployments`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| space_id | uuid | |
| version_id | uuid | |
| provider | text | `vercel`, `coolify`, `static` |
| external_id | text nullable | |
| url | text nullable | |
| status | text | |
| metadata | jsonb | |
| created_at | timestamptz | |

### Storage layout (Supabase Storage)

```
spaces/{organization_id}/{space_id}/versions/{version_number}/...
```

---

## Security and Sandbox Model

### Cross-tenant access

- Every query: `requireOrgAccess(organization_id)` (existing `lib/tenant/auth.ts`)
- RLS on all Space tables: deny default; service role only after server validation (same as chat today)
- Share links: resolve token → space → verify `visibility` / `published` — no org cookie required on public route
- Master admin (`is_master_admin`): optional cross-org read later; not required for MVP

### Safe rendering of generated code

| Approach | Safety |
|----------|--------|
| Render HTML in parent React via `dangerouslySetInnerHTML` | **Unsafe** for agent content |
| `eval` / dynamic import of model JS | **Forbidden** |
| Sandboxed `iframe` + separate preview path | **Recommended** |
| Pyodide (current code artifact) | OK for Python snippets; **not** for web apps |

**Start with static HTML/CSS/vanilla JS only.** No React apps in iframe until deploy preview or WebContainer phase.

### iframe guidance

- Use `sandbox="allow-scripts"` — avoid `allow-same-origin` unless you use a dedicated preview subdomain
- Prefer preview on `preview.agentops.one` or path-isolated route that does **not** set session cookies
- CSP example: `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: https:;`

### Publishing protection

- Only org members with `role >= editor` can create share links or trigger deploy
- Public routes read-only; no MCP tools on public preview
- Rate-limit preview asset routes per org

---

## Deployment and Publishing Options

| Phase | Mechanism | Complexity |
|-------|-----------|------------|
| MVP | Share link → sandboxed preview URL | Low |
| 1.5 | Export ZIP of `space_files` | Low |
| 2 | Vercel deploy hook / API (static output) | Medium |
| 3 | GitHub repo + branch preview | High |
| 3+ | Coolify | High (ops) |

**Vercel compatibility:** This app already deploys to Vercel; generated **static** sites can deploy as separate Vercel projects or as static files under `*.vercel.app` via API. Do not co-mingle generated site routes with the main Next app’s server without isolation.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| XSS via generated HTML in preview | High | iframe + CSP + no cookies on preview |
| Dual DB (Drizzle documents vs Supabase spaces) | Medium | New features only on Supabase; migrate or deprecate Document |
| Artifact tools disconnected from chat | Medium | Wire Space tools into `streamText` + system prompt |
| Agent writes huge bundles | Medium | Size limits, Storage offload, reject binary spam |
| MCP chat latency + file generation | Medium | Stream file deltas; async version commit |
| User expects Lovable-level React apps | Product | Set expectations; roadmap WebContainer/deploy |

---

## Deferred Decisions

- Convex adoption
- Real-time collaborative editing
- In-browser npm / Vite (WebContainer)
- React/Next artifact kind in parent app
- Vercel/Coolify one-click deploy implementation
- Custom domains and TLS per Space
- GitHub two-way sync
- Migrating legacy `Document` table to Supabase
- Whether Spaces get a dedicated nav item vs mode inside chat

---

## Next Implementation Prompt

When ready to build, run a focused implementation task with instructions like:

> Implement AgentOps Spaces MVP per `docs/spaces-runtime-decision.md`:
> 1. Add Supabase migrations for `spaces`, `space_files`, `space_versions`, `space_share_links`, `space_deployments` with `organization_id` and RLS.
> 2. Add `lib/spaces/*` server modules and API routes under `app/(chat)/api/spaces/`.
> 3. Add sandboxed preview route and iframe-based UI at `/spaces/[id]` reusing artifact panel layout patterns.
> 4. Add AI tools `createSpace`, `updateSpaceFiles` wired into chat `streamText` with static HTML/CSS/JS only.
> 5. Do not add Convex. Do not implement Vercel deploy yet — share link only.
> 6. Enforce `requireOrgAccess` on all mutations; public read via share token only.

---

## Summary Table (Options)

| Option | Verdict |
|--------|---------|
| A Supabase-only (metadata only, no runtime) | Insufficient alone — needs preview layer |
| B Convex-only | Reject |
| C Hybrid Supabase + Convex | Defer |
| **D Supabase + sandbox runtime** | **Adopt** |
| E Switch to bolt.diy / other | Reject for MVP |
