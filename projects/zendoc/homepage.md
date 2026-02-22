---
date: 2026-02-21
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
2. **[Install Zendoc](https://marketplace.visualstudio.com/items?itemName=YMSDynamics.yms-zendoc)** — Opens Cursor to the extension page. Click Install.

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
| 6 | Wizard runs: folder picker → creates workspace → GitHub sign-in (browser) → connects repo → installs extensions to Zendoc profile → opens workspace in Zendoc profile |

GitHub connection is part of the setup. No separate step.

---

## Design Principles

- **Homepage:** Only Cursor + extension. Nothing else.
- **Profile:** The wizard creates a dedicated Zendoc profile—no setup needed. Your existing Cursor setup stays untouched.
- **Extension:** VS Code extension with native UI. Handles workspace creation, GitHub connection, extension installation in one wizard flow.
- **GitHub is core:** Connecting to GitHub is part of the setup wizard, not optional. It's the value prop—your work backs up automatically.
- **Clicks only:** No typing, no Command Palette, no Chat commands required for core flow.

---

## Under the Hood

For the curious: what's actually going on.

**A plugin that turns Cursor into a writing platform.** Zendoc is a VS Code extension. It doesn't replace Cursor—it configures it. One wizard creates a workspace, connects GitHub, installs extensions, and tunes the AI. You get a dedicated "Zendoc" profile so your coding setup stays untouched.

**GitHub backup, automatic.** The wizard runs `gh auth login` and `gh repo create`. Your work lives in a private repo. GitDoc (one of the installed extensions) auto-commits and auto-pushes on save. Your history is always backed up.

**Extensions that get installed:**

| Extension | What it does |
|-----------|--------------|
| **GitDoc** | Auto-commits and auto-pushes to GitHub on save. No manual git. |
| **Markdown All in One** | Keyboard shortcuts, table of contents, and Markdown features. |
| **Markdown for Humans** | WYSIWYG editor. Use "Open With..." when you want a visual view. |

**The AI acts as a librarian, not a coder.** Cursor rules (`.cursor/rules/`) tell the agent to behave as a Senior Document Librarian and Content Strategist: clean hierarchies, YAML frontmatter, professional prose. No "developer speak."

**Project memory via AGENTS.md.** Each project has a hidden `AGENTS.md` file. Tell the agent things to remember—"add instruction: always use British spelling" or "edit instructions: this is a novel about X." The agent reads and updates these files. Memory is per-project and persists.

**The rest.** Auto-save (1 second delay), minimal UI (no line numbers, no minimap, sidebar on the right), dotfiles hidden. Everything tuned for writing.

---

## Deep Links (If Supported)

- **Install extension:** `vscode://marketplace.visualstudio.com/items?itemName=YMSDynamics.yms-zendoc` (opens in VS Code/Cursor)
- **Open Cursor:** `cursor://` (may open Cursor or prompt to install)

---

## Optional: Extended Copy

For a longer landing page, the above can be expanded with:

- **What is Zendoc?** — A writing environment built on Cursor. Minimal UI, auto-save, AI assistant, Markdown files you own.
- **Who is it for?** — Writers who want speed and simplicity without walled gardens.
- **Pricing:** — Free. Optional upgrades for AI usage and premium plugins.
