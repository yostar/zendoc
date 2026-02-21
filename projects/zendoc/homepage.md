---
date: 2025-02-21
tags: [website, onboarding, homepage]
status: draft
---

# Homepage & Website Copy

The website should hide complexity. Users see only two steps. Everything else is handled by the Zendoc extension.

---

## Homepage Instructions

**Headline:** *Distraction-free writing, powered by AI*

**Steps:**

1. **[Download Cursor](https://cursor.com)** — The app Zendoc runs inside.
2. **[Install Zendoc](https://marketplace.visualstudio.com/items?itemName=zendoc.zendoc)** — Opens Cursor to the extension page. Click Install.

**Subtext:** A notification will appear—click **Create workspace**. The wizard uses native dialogs (folder picker, etc.) to create your workspace and connect it to GitHub. Your work backs up automatically.

---

## Full User Flow (No Typing)

| Step | User action |
|------|-------------|
| 1 | Click "Download Cursor" on website |
| 2 | Install Cursor |
| 3 | Click "Install Zendoc" on website → Cursor opens to extension page |
| 4 | Click "Install" in Cursor |
| 5 | Click "Create workspace" in extension's notification |
| 6 | Wizard runs: folder picker → creates workspace → GitHub sign-in (browser) → connects repo → installs extensions → opens workspace |

GitHub connection is part of the setup. No separate step.

---

## Design Principles

- **Homepage:** Only Cursor + extension. Nothing else.
- **Profile:** Default profile is fine. New users don't need to create one.
- **Extension:** VS Code extension with native UI. Handles workspace creation, GitHub connection, extension installation in one wizard flow.
- **GitHub is core:** Connecting to GitHub is part of the setup wizard, not optional. It's the value prop—your work backs up automatically.
- **Clicks only:** No typing, no Command Palette, no Chat commands required for core flow.

---

## Deep Links (If Supported)

- **Install extension:** `vscode://marketplace.visualstudio.com/items?itemName=zendoc.zendoc` (opens in VS Code/Cursor)
- **Open Cursor:** `cursor://` (may open Cursor or prompt to install)

---

## Optional: Extended Copy

For a longer landing page, the above can be expanded with:

- **What is Zendoc?** — A writing environment built on Cursor. Minimal UI, auto-save, AI assistant, Markdown files you own.
- **Who is it for?** — Writers who want speed and simplicity without walled gardens.
- **Pricing:** — Free. Optional upgrades for AI usage and premium plugins.
