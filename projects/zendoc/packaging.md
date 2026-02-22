---
date: 2025-02-21
tags: [packaging, installer, distribution]
status: draft
---

# Zendoc Packaging Spec

Everything required to build and package Zendoc for distribution. This document is the single source of truth for what the installer must deliver.

---

## 1. Installer Overview

**Goal:** Minimal friction. User installs Cursor + Zendoc extension. Everything else is handled by the extension via native UI—folder picker, input boxes, no typing required.

**Primary delivery:** VS Code extension (works in Cursor). The extension handles workspace creation, extension installation, and GitHub setup via a guided wizard with native dialogs.

**Profile:** Always use a dedicated "Zendoc" profile. The wizard installs extensions into the Zendoc profile and opens the workspace with `cursor /path --profile "Zendoc"`. If the profile doesn't exist, the CLI creates it. This keeps the user's default or existing profiles untouched—whether they're new to Cursor or have an existing setup.

---

## 2. Homepage & User Flow

**Homepage shows only:**
1. [Download Cursor]
2. [Install Zendoc] (link opens extension marketplace)

**That's it.** A notification appears—user clicks **Create workspace** to begin.

**Full flow (clicks only):**

| Step | User action |
|------|-------------|
| 1 | Click "Download Cursor" on website |
| 2 | Install Cursor |
| 3 | Click "Install Zendoc" on website → Cursor opens to extension page |
| 4 | Click "Install" in Cursor |
| 5 | Click "Create workspace" in extension's notification |
| 6 | Extension runs wizard: folder picker → creates workspace → runs gh auth (browser) → gh repo create → installs extensions to Zendoc profile → opens workspace in Zendoc profile |

GitHub setup is **part of the setup flow**, not optional. It's critical to the value prop: your work is backed up automatically.

See `homepage.md` for full website copy.

---

## 3. Extension Requirements (VS Code Extension)

The Zendoc extension is a **VS Code extension** (works in Cursor). It uses native VS Code APIs for UI.

**Commands:**
- `zendoc.createWorkspace` — Runs the full setup wizard. Single entry point.
- `zendoc.setupBackup` — Retry GitHub setup if user skipped or it failed.

**Activation:** On first run after install, show a notification: "Create your Zendoc workspace" with a button. User clicks → wizard runs.

**Native UI (VS Code API):**
- `window.showOpenDialog()` — Folder picker for workspace location
- `window.showInputBox()` — Repo name, or other inputs if needed
- `window.showInformationMessage()` — Status updates, notifications
- `vscode.workspace.fs` — Create folders, write files
- `child_process.exec()` — Run `gh auth login`, `gh repo create`, `cursor --install-extension --profile "Zendoc"`, `cursor /path --profile "Zendoc"`

**Setup wizard flow:**
1. Show folder picker → user selects location (e.g., ~/Documents).
2. Create workspace folder, copy template, run `git init`.
3. **Connect to GitHub:** Show message: "Don't have a GitHub account? You can create one when the browser opens—it's all in one flow." Then check if `gh` installed. If not, show install instruction. Run `gh auth login` → browser opens. Run `gh repo create [name] --private --source=. --push`.
4. Run `cursor --install-extension <id> --profile "Zendoc"` (or `code --install-extension <id> --profile "Zendoc"`) for GitDoc, Markdown All in One, Markdown for Humans.
5. Open workspace in Zendoc profile: run `cursor /path/to/workspace --profile "Zendoc"` (or `code`). This creates the Zendoc profile if it doesn't exist and associates the folder with it.
6. Show Welcome.md (at root). Confirm: "Your workspace is ready."

---

## 4. Required Extensions

These extensions **must** be installed into the Zendoc profile (Zendoc extension runs `cursor --install-extension <id> --profile "Zendoc"` for each when creating workspace):

| Extension | Publisher | Extension ID | Purpose |
|-----------|------------|--------------|---------|
| **GitDoc** | vsls-contrib | `vsls-contrib.gitdoc` | Auto-commit and auto-push on save. |
| **Markdown All in One** | yzhang | `yzhang.markdown-all-in-one` | Keyboard shortcuts, table of contents, Markdown features. |
| **Markdown for Humans** | concretio | `concretio.markdown-for-humans` | WYSIWYG Markdown editor. Use via "Open With..." — do not set as default (see Known Issues). |

**Add to `.vscode/extensions.json`** for workspace recommendations:
```json
{
  "recommendations": [
    "vsls-contrib.gitdoc",
    "yzhang.markdown-all-in-one",
    "concretio.markdown-for-humans"
  ]
}
```

---

## 5. GitHub via Command Line

All GitHub operations use the command line:

- **Repo creation:** `gh repo create zendoc --private --source=. --push`
- **Authentication:** `gh auth login` (opens browser, one-time)
- **Ongoing sync:** GitDoc handles commit + push automatically

**User prerequisites:**
- Git (usually pre-installed on macOS)
- GitHub CLI (`gh`) — install via `brew install gh` or include in installer
- GitHub account

**Onboarding flow:** GitHub setup is part of `zendoc.createWorkspace`. The wizard runs `gh auth login` and `gh repo create` before opening the workspace.

---

## 6. Workspace Template Structure

The installer creates a workspace with this structure:

```
zendoc/
├── Welcome.md          ← Workspace README / first-run onboarding
├── assets/
│   └── zendoc-logo.png
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   └── .cursor/
│       └── rules/
│           ├── librarian.mdc
│           ├── instructions.mdc
│           └── project-context.mdc
├── AGENTS.md
├── projects/
│   ├── zendoc/
│   │   ├── AGENTS.md
│   │   ├── vision.md
│   │   ├── roadmap.md
│   │   ├── business_model.md
│   │   ├── history.md
│   │   └── packaging.md
│   └── [starter-project]/
│       └── AGENTS.md
└── .gitignore
```

**Starter project:** Include a minimal starter (e.g., `projects/starter/` or `projects/coach/`) so the user has a place to begin.

**Template bundling:** The workspace template is bundled inside the extension at `extension/resources/template/`. The extension copies it to the user's chosen location.

**Extension location:** `extension/` at repo root. Run `npm run compile` to build, F5 to debug.

**Brand assets:** Logo and icons live in `assets/` at repo root. Used by the extension (marketplace icon), homepage, and docs.

---

## 7. Configuration Files

### `.vscode/settings.json`

| Setting | Value | Purpose |
|---------|-------|---------|
| `files.exclude` | `{"**/.*": true, "**/.*/**": true}` | Hide dotfiles |
| `explorer.confirmDelete` | `true` | Confirm before delete (reduces accidental deletion) |
| `files.enableTrash` | `true` | Send deleted files to trash, not permanent delete |
| `files.autoSave` | `afterDelay` | Auto-save |
| `files.autoSaveDelay` | `1000` | 1 second |
| `workbench.colorTheme` | `Cursor Light` | Theme |
| `workbench.activityBar.location` | `hidden` | Hide activity bar |
| `workbench.sideBar.location` | `right` | Sidebar on right |
| `editor.fontSize` | `14` | Readable font |
| `editor.lineHeight` | `1.4` | Line spacing |
| `editor.wordWrap` | `on` | Wrap lines |
| `editor.lineNumbers` | `off` | Minimal UI |
| `editor.minimap.enabled` | `false` | No minimap |
| `editor.glyphMargin` | `false` | Clean margins |
| `editor.folding` | `false` | No folding |
| `editor.occurrencesHighlight` | `off` | Less distraction |
| `editor.selectionHighlight` | `false` | |
| `editor.renderLineHighlight` | `none` | |
| `editor.guides.indentation` | `false` | |
| `editor.cursorStyle` | `line-thin` | |
| `workbench.layoutControl.enabled` | `false` | |
| `explorer.compactFolders` | `false` | |
| `editor.renderWhitespace` | `none` | |
| `editor.guides.bracketPairs` | `false` | |

### GitDoc workspace settings (optional, for workspace-scoped config)

```json
"gitdoc.autoCommitDelay": 30000,
"gitdoc.autoPush": true,
"gitdoc.enabled": true
```

---

## 8. Cursor Rules

Include these rules in `.vscode/.cursor/rules/`:

| File | Purpose |
|------|---------|
| `librarian.mdc` | Document structure, metadata, organization |
| `instructions.mdc` | Add/edit/show instructions commands for AGENTS.md |
| `project-context.mdc` | Load project-specific AGENTS.md when in projects/ |

---

## 9. AGENTS.md Structure

- **Root `AGENTS.md`:** Workspace-level instructions. Tells agent to read project AGENTS.md when in a project folder.
- **`projects/zendoc/AGENTS.md`:** Zendoc prototype context (for development). Has "Your Instructions" section for user content.
- **`projects/[starter]/AGENTS.md`:** Template for user's first project.

---

## 10. Core Documents to Include

| File | Purpose |
|------|---------|
| `Welcome.md` | Workspace README / first-run onboarding, shortcuts, instructions (at root) |
| `projects/zendoc/vision.md` | Product vision |
| `projects/zendoc/roadmap.md` | Roadmap |
| `projects/zendoc/business_model.md` | Business model |
| `projects/zendoc/history.md` | Technical spec, troubleshooting |
| `projects/zendoc/packaging.md` | This file |
| `projects/zendoc/homepage.md` | Website copy and homepage instructions |

---

## 11. GitHub Setup Flow (Inside Setup Wizard)

GitHub setup runs as part of `zendoc.createWorkspace`, not as a separate step:

1. After creating workspace folder and copying template, run `git init`.
2. Before Connect GitHub: Show brief message that users without a GitHub account can create one in the same flow (no separate step).
3. Check if `gh` is installed. If not: prompt user to run `brew install gh` or provide install link.
4. Run `gh auth login` — opens browser for one-time sign-in.
5. Run `gh repo create [name] --private --source=. --push`.
6. If successful: "Your work backs up to GitHub automatically."
7. If user skips or fails: workspace still works locally. Offer `zendoc.setupBackup` for retry later.

---

## 12. Extension Publishing

- **Marketplace:** Publish to VS Code Marketplace. Cursor uses the same marketplace, so the extension will appear in Cursor's Extensions panel.
- **Extension ID:** `zendoc.zendoc` (or `publisher.extension` once publisher is registered).

---

## 13. Clean-Room Audit

Before packaging, strip all personal paths and machine-specific config:

- No `/Users/YourName/...` paths
- No personal repo URLs
- No API keys or tokens
- Settings must work on any machine

---

## 14. Known Issues & Caveats

| Issue | Mitigation |
|-------|------------|
| **Markdown for Humans** caused crashes when set as default for `.md` | Keep default as Standard Text Editor. User opens WYSIWYG via "Open With..." |
| **Dotfile toggle** (Cmd+Shift+A) doesn't work with `**/.*` pattern | Toggle Excluded Files extension has limitations. Dotfiles stay hidden; no reliable toggle. |
| **GitDoc** was removed from workspace settings due to conflicts | Configure at profile level or ensure workspace settings don't conflict with auto-save. |

---

## 15. Checklist for Packaging

- [ ] Extension implements `zendoc.createWorkspace` and `zendoc.setupBackup` commands
- [ ] Extension shows "Create workspace" notification on first activation
- [ ] Extension uses native UI (folder picker, input box) and runs shell commands (gh, cursor --install-extension --profile "Zendoc")
- [ ] Install GitDoc, Markdown All in One, Markdown for Humans (when workspace created)
- [ ] Create workspace folder structure
- [ ] Copy all config files (settings, extensions, rules)
- [ ] Copy core documents (Welcome, vision, roadmap, etc.)
- [ ] Include starter project with AGENTS.md
- [ ] Initialize Git in template
- [ ] Add .gitignore
- [ ] Strip personal paths (clean-room audit)
- [ ] Document "Set up cloud backup" flow (gh auth + gh repo create)
- [ ] Extension uses dedicated Zendoc profile (install extensions with `--profile "Zendoc"`, open workspace with `cursor /path --profile "Zendoc"`)
- [ ] Test on fresh machine / fresh profile
