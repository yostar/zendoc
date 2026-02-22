# Zendoc

Distraction-free writing, powered by AI. Turns Cursor into a writing platform with auto-backup to GitHub.

## Quick Start

1. **Install** — Click Install in Cursor/VS Code
2. **Create workspace** — A welcome panel appears, or run **Create Zendoc workspace** (Cmd+Shift+Z)
3. **Connect GitHub** — Paste your repo URL and click Connect
4. **Enable backup** — Click "Enable Automatic Backup" so changes commit as you write

That's it. Your work backs up to GitHub automatically.

## Commands

| Command | Description |
|---------|-------------|
| **Create Zendoc workspace** | Full setup wizard: folder picker, GitHub connection, extensions |
| **Show Zendoc welcome** | Open the welcome panel |
| **Set up cloud backup (GitHub)** | Retry GitHub setup if skipped or failed |

## What Gets Installed

When you create a workspace, Zendoc installs:

- **GitDoc** — Auto-commits and auto-pushes to GitHub on save
- **Markdown All in One** — Keyboard shortcuts, table of contents
- **Markdown for Humans** — WYSIWYG editor (use "Open With..." for visual view)

## Requirements

- [Cursor](https://cursor.com) or VS Code
- Git (usually pre-installed)
- GitHub account (create one when the browser opens)

## Development

```bash
npm install
npm run compile
```

Press F5 to debug in Extension Development Host.

## Packaging

```bash
npm install -g @vscode/vsce
vsce package
```

Produces `zendoc-0.1.0.vsix` for installation or marketplace upload.
