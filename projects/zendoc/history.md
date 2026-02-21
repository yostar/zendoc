# Technical History & Workspace Spec

## Core Configuration (The "Spec")

- **Theme:** Cursor Light (High Contrast).
- **Layout:** Sidebar on the **Right**, Activity Bar **Hidden**.
- **Auto-Save:** Enabled via `afterDelay` (1000ms) to ensure instant disk writing.
- **Sync:** Work automatically publishes to GitHub (Repo: `zendoc`).

## Troubleshooting Log

- **Extension Conflict:** The "Markdown for Humans" visual editor caused "Assertion Failed" and "Unexpected Error" crashes when set as the global default for `.md` files.
- **The Fix:** Files now default to the **Standard Text Editor**. Visual mode is toggled manually via "Open With..." to maintain stability.
- **Cache Reset:** Resolved persistent UI errors by renaming core files (e.g., `Urban Gardening v2.md`) to force a fresh editor state.
- **Settings Audit:** Fixed broken auto-save functionality by cleaning `settings.json` syntax (removing trailing commas and conflicting `gitdoc` lines).

## Shortcuts

- **Sidebar Toggle:** `Cmd + B`
- **Command Palette:** `Cmd + Shift + P`