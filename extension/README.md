# Zendoc Extension

VS Code extension that turns Cursor into a distraction-free writing platform with auto-backup to GitHub.

## Development

```bash
npm install
npm run compile
```

## Run / Debug

1. Open this folder in VS Code or Cursor
2. Press F5 or Run > Start Debugging
3. A new Extension Development Host window opens with the extension loaded

## Commands

- **Create Zendoc workspace** — Full setup wizard: folder picker, GitHub auth, extensions, opens workspace in Zendoc profile
- **Set up cloud backup (GitHub)** — Retry GitHub setup if skipped or failed

## Packaging

```bash
npm install -g @vscode/vsce
vsce package
```

Produces `zendoc-0.1.0.vsix` for installation or marketplace upload.
