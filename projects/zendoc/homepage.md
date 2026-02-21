---
date: 2025-02-21
tags: [website, onboarding, homepage]
status: draft
---

# Homepage & Website Copy

The website should hide complexity. Users see only two steps. Everything else is handled by the plugin.

---

## Homepage Instructions

**Headline:** *Distraction-free writing, powered by AI*

**Steps:**

1. **[Download Cursor](https://cursor.com)** — The app Zendoc runs inside.
2. **[Install Zendoc](https://cursor.com/marketplace)** — Opens Cursor to the plugin page. Click Install.

**Subtext:** A welcome message will appear—click **Create workspace**. The setup wizard creates your workspace and connects it to GitHub. Your work backs up automatically.

---

## Full User Flow (No Typing)

| Step | User action |
|------|-------------|
| 1 | Click "Download Cursor" on website |
| 2 | Install Cursor |
| 3 | Click "Install Zendoc" on website → Cursor opens to plugin page |
| 4 | Click "Install" in Cursor |
| 5 | Click "Create workspace" in plugin's welcome prompt |
| 6 | Setup wizard runs: creates workspace → prompts to sign in to GitHub (browser) → connects repo → done |

GitHub connection is part of the setup. No separate step.

---

## Design Principles

- **Homepage:** Only Cursor + plugin. Nothing else.
- **Profile:** Default profile is fine. New users don't need to create one.
- **Plugin:** Handles workspace creation, GitHub connection, and first-run guidance in one flow.
- **GitHub is core:** Connecting to GitHub is part of the setup wizard, not optional. It's the value prop—your work backs up automatically.
- **Clicks only:** No typing, no Command Palette, no Chat commands required for core flow.

---

## Deep Links (If Supported)

- **Install plugin:** `cursor://marketplace/install?publisher=zendoc&extension=zendoc` (verify Cursor's URL scheme)
- **Open Cursor:** `cursor://` (may open Cursor or prompt to install)

---

## Optional: Extended Copy

For a longer landing page, the above can be expanded with:

- **What is Zendoc?** — A writing environment built on Cursor. Minimal UI, auto-save, AI assistant, Markdown files you own.
- **Who is it for?** — Writers who want speed and simplicity without walled gardens.
- **Pricing:** — Free. Optional upgrades for AI usage and premium plugins.
