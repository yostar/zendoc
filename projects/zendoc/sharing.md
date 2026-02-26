# Sharing: Live Preview for Private Files

**Goal:** Share a single file (or folder) from a private repo via a unique URL. No moving files. Live preview—updates when the user saves. User can revoke access by removing the share.

---

## Core Idea

A **Zendoc sharing service** (server) that:

1. Keeps track of which private files each user wants to share
2. Assigns a unique URL key per shared file (e.g. `zendoc.org/s/abc123`)
3. When someone visits the URL, fetches the file and serves it (rendered for Markdown)
4. When the user removes the share, the key is deleted—file no longer accessible

**Constraint:** The service needs auth to read the user's private repo. The user opts in.

---

## Auth: Zendoc Bot as Read-Only Collaborator

**Chosen approach:** One `ZendocBot` GitHub user as read-only collaborator on user repos. The Zendoc service uses the bot's token to fetch files via the GitHub API.

**Trade-off:** The repo is no longer "only you"—Zendoc has read access. User explicitly opts in.

### Opt-in Flow (Extension — Implemented)

1. User connects repo to GitHub (GitHub setup panel)
2. After success: "Grant Zendoc sharing access" button appears
3. User clicks → extension checks if `ZendocBot` is collaborator (no `gh`; uses `git credential fill` + GitHub API)
4. If not collaborator: opens `github.com/{owner}/{repo}/settings/access`, shows instructions to add `ZendocBot` with Read access
5. User adds bot manually → GitHub sends invitation to bot
6. User clicks "Check again" to re-verify

### Invitation Acceptance (Service — TODO)

When a user adds `ZendocBot` as collaborator, GitHub creates an **invitation** that the invitee (the bot) must accept. Without automation, the user sees "waiting for ZendocBot to accept."

**Automation (service-side):** The Zendoc backend holds the bot's token. It must accept invitations on behalf of the bot:

- **`GET /user/repository_invitations`** — list pending invitations (auth: bot token)
- **`PATCH /user/repository_invitations/:invitation_id`** — accept (no body)

**Implementation options:**

1. **Periodic job** (recommended): Cron/worker every 1–5 min lists and accepts all pending invitations. Within minutes of user adding the bot, it's accepted. User can "Check again" and succeed.
2. **On-demand API** (optional): Extension calls `POST /api/accept-invitations` when check fails; backend accepts immediately so next "Check again" succeeds right away.

**Bot token scope:** `repo` (or at least `repo:invite`) to list and accept invitations.

### Revocation

- User removes share → key deleted from DB → URL 404
- User disables sharing for repo → remove ZendocBot from repo → service can no longer fetch; existing keys would fail (or we prune them)

---

## Data Model (Service-Side)

| Table / Concept | Purpose |
|-----------------|---------|
| `shares` | `id`, `repo_full_name`, `file_path`, `share_key`, `user_id`, `created_at` |
| `share_key` | Unique, unguessable (e.g. UUID or nanoid) |
| `repo_access` | Track which repos have ZendocBot as collaborator (for cleanup/validation) |

---

## User Flow

1. **Enable sharing** (one-time per repo): Click "Grant Zendoc sharing access" → add `ZendocBot` as collaborator with Read access → service auto-accepts within minutes → "Check again" to confirm.
2. **Share a file**: Right-click file → "Share" → extension calls service API → service creates share, returns URL → user copies link.
3. **View shared file**: Recipient opens URL → service fetches file from GitHub, renders Markdown → displays.
4. **Revoke**: User removes share (UI in extension or web) → key deleted → URL stops working.
5. **Disable sharing**: Remove ZendocBot from repo → all shares for that repo invalidated.

---

## What Stays Private

- Repo remains private
- Only files the user explicitly shares are accessible via the key
- Keys are unguessable; no listing of shares
- ZendocBot has read-only access—cannot push or modify

---

## Open Questions

- **Rate limits:** GitHub API rate limits for the bot. Caching? Per-key cache with TTL?
- **File size / type:** Limit to Markdown? Support other formats?
- **Expiration:** Optional expiry for shares? (e.g. 7 days, 30 days)
- **Analytics:** Track views? User might want to know if someone opened the link.

---

## Infrastructure

**Platform: Vercel + Neon Postgres**

- **Vercel:** Next.js app at `app.zendoc.org` — API routes + share viewer UI (full React/Next.js for rich markdown display)
- **Neon:** Postgres database (free tier: 512MB, 190 compute hours/month)
- **Domain:** `app.zendoc.org` on Vercel; main site stays on GitHub Pages at `zendoc.org`

---

## Implementation Phases

1. **Opt-in flow (extension)** — Done: "Grant Zendoc sharing access" in GitHub setup panel; checks collaborator status without `gh`; opens settings page with instructions
2. **Invitation acceptance (service)** — TODO: Periodic job to auto-accept bot invitations; optional on-demand API
3. **Service MVP:** Next.js on Vercel — API routes for create/delete shares; `/s/[key]` page fetches from GitHub, renders Markdown; Neon for `shares` table
4. **Extension:** "Share file" command → call API, copy URL
5. **Web UI (optional):** Manage shares at zendoc.org/dashboard
