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

## Auth: How the Service Accesses Private Files

The service must fetch file content from GitHub. For a private repo, it needs credentials.

### Option: Zendoc Bot as Read-Only Collaborator

- On **opt-in** (user enables sharing for a repo): add a **Zendoc GitHub user** as a collaborator with **read-only** access
- The Zendoc service uses this bot's token to fetch files via the GitHub API
- **Trade-off:** The repo is no longer "only you"—Zendoc has read access. User explicitly opts in.

### Flow

1. User runs "Enable sharing" (or similar) in Zendoc
2. Extension/CLI triggers: add `zendoc-bot` (or similar) as collaborator to the repo
3. User authorizes (GitHub OAuth or manual add)
4. Zendoc service stores: `repo_id` + bot has access
5. When user "shares" a file: service creates `(repo, file_path) -> share_key` in DB
6. When someone visits `zendoc.org/s/{key}`: service looks up key, fetches file from repo via API, renders, serves

### Revocation

- User removes share → key deleted from DB → URL 404
- User disables sharing for repo → remove Zendoc bot as collaborator → service can no longer fetch; existing keys would fail (or we prune them)

---

## Data Model (Service-Side)

| Table / Concept | Purpose |
|-----------------|---------|
| `shares` | `id`, `repo_full_name`, `file_path`, `share_key`, `user_id`, `created_at` |
| `share_key` | Unique, unguessable (e.g. UUID or nanoid) |
| `repo_access` | Track which repos have Zendoc bot as collaborator (for cleanup/validation) |

---

## User Flow

1. **Enable sharing** (one-time per repo): Add Zendoc bot as read-only collaborator. User opts in.
2. **Share a file**: Right-click file → "Share" → extension calls service API → service creates share, returns URL → user copies link.
3. **View shared file**: Recipient opens URL → service fetches file from GitHub, renders Markdown → displays.
4. **Revoke**: User removes share (UI in extension or web) → key deleted → URL stops working.
5. **Disable sharing**: Remove Zendoc bot from repo → all shares for that repo invalidated.

---

## What Stays Private

- Repo remains private
- Only files the user explicitly shares are accessible via the key
- Keys are unguessable; no listing of shares
- Zendoc bot has read-only access—cannot push or modify

---

## Open Questions

- **Per-user vs per-repo bot:** One Zendoc bot for all users, or per-user tokens? Per-repo collaborator is simpler; one bot, many repos.
- **Rate limits:** GitHub API rate limits for the bot. Caching? Per-key cache with TTL?
- **File size / type:** Limit to Markdown? Support other formats?
- **Expiration:** Optional expiry for shares? (e.g. 7 days, 30 days)
- **Analytics:** Track views? User might want to know if someone opened the link.

---

## Implementation Phases

1. **Service MVP:** API to create/delete shares, endpoint to serve file by key
2. **Extension:** "Share file" command → call API, copy URL
3. **Opt-in flow:** Guide user to add Zendoc bot as collaborator (or OAuth app with repo scope)
4. **Web UI (optional):** Manage shares at zendoc.org/dashboard
