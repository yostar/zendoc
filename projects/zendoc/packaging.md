---
date: 2025-02-21
tags: [packaging, installer, distribution]
status: draft
---

# Zendoc Packaging Spec

Everything required to build and package Zendoc for distribution. This document is the single source of truth for what the installer must deliver.

---

## 1. Installer Overview

**Goal:** Minimal friction. User installs Cursor + plugin. Everything else is handled by the plugin via clicks—no typing, no Command Palette, no manual config.

**Primary delivery:** Cursor plugin (marketplace). The plugin handles workspace creation, extension installation, and GitHub setup via a guided flow.

**Profile:** Default profile is fine. New users get the default profile when they install Cursor. No need to create a separate Zendoc profile.

---

## 2. Homepage & User Flow

**Homepage shows only:**
1. [Download Cursor]
2. [Install Zendoc] (link opens Cursor marketplace to plugin page)

**That's it.** A welcome message appears in Cursor—user clicks **Create workspace** to begin.

**Full flow (clicks only):**

| Step | User action |
|------|-------------|
| 1 | Click "Download Cursor" on website |
| 2 | Install Cursor |
| 3 | Click "Install Zendoc" on website → Cursor opens to plugin page |
| 4 | Click "Install" in Cursor |
| 5 | Click "Create workspace" in plugin's welcome prompt |
| 6 | Plugin runs setup wizard: creates workspace → connects to GitHub (gh auth, gh repo create) → done |

GitHub setup is **part of the setup flow**, not optional. It's critical to the value prop: your work is backed up automatically.

See `homepage.md` for full website copy.

---

## 3. Plugin Requirements

The Zendoc plugin must implement:

**Commands:**
- `zendoc.createWorkspace` — Runs the full setup wizard: creates workspace, connects to GitHub, opens workspace. This is the single entry point.

**Activation behavior:** On first run after install, show a prominent "Create your workspace" prompt (notification, panel, or modal). User clicks → setup wizard runs.

**Setup wizard flow (single flow):**
1. Create workspace folder, copy template, initialize Git.
2. **Connect to GitHub** (integrated, not optional):
   - Check if `gh` is installed. If not, prompt with install instruction (or offer to run `brew install gh`).
   - Run `gh auth login` → browser opens → user signs in to GitHub.
   - Run `gh repo create [name] --private --source=. --push`.
3. Open workspace. Show Welcome.md.
4. Confirm: "Your workspace is ready. Your work backs up to GitHub automatically."

**Fallback:** If user skips or GitHub setup fails, offer `zendoc.setupBackup` command for retry. Welcome.md can link to it.

---

## 4. Required Extensions

These extensions **must** be installed (plugin installs them when creating workspace):

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
│   │   ├── Welcome.md
│   │   ├── AGENTS.md
│   │   ├── vision.md
│   │   ├── roadmap.md
│   │   ├── business_model.md
│   │   ├── history.md
│   │   └── packaging.md
│   └── [starter-project]/
│       └── AGENTS.md
├── Ideas/
├── Logs/
└── .gitignore
```

**Starter project:** Include a minimal starter (e.g., `projects/starter/` or `projects/coach/`) so the user has a place to begin.

---

## 7. Configuration Files

### `.vscode/settings.json`

| Setting | Value | Purpose |
|---------|-------|---------|
| `files.exclude` | `{"**/.*": true, "**/.*/**": true}` | Hide dotfiles |
| `files.autoSave` | `afterDelay` | Auto-save |
| `files.autoSaveDelay` | `1000` | 1 second |
| `workbench.colorTheme` | `Cursor Light` | Theme |
| `workbench.activityBar.location` | `hidden` | Hide activity bar |
| `workbench.sideBar.location` | `right` | Sidebar on right |
| `editor.fontSize` | `17` | Readable font |
| `editor.lineHeight` | `1.7` | Line spacing |
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
| `projects/zendoc/Welcome.md` | First-run onboarding, shortcuts, instructions |
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
2. Check if `gh` is installed. If not: prompt user to run `brew install gh` or provide install link.
3. Run `gh auth login` — opens browser for one-time sign-in.
4. Run `gh repo create [name] --private --source=. --push`.
5. If successful: "Your work backs up to GitHub automatically."
6. If user skips or fails: workspace still works locally. Offer `zendoc.setupBackup` for retry later.

---

## 12. Clean-Room Audit

Before packaging, strip all personal paths and machine-specific config:

- No `/Users/YourName/...` paths
- No personal repo URLs
- No API keys or tokens
- Settings must work on any machine

---

## 13. Known Issues & Caveats

| Issue | Mitigation |
|-------|------------|
| **Markdown for Humans** caused crashes when set as default for `.md` | Keep default as Standard Text Editor. User opens WYSIWYG via "Open With..." |
| **Dotfile toggle** (Cmd+Shift+A) doesn't work with `**/.*` pattern | Toggle Excluded Files extension has limitations. Dotfiles stay hidden; no reliable toggle. |
| **GitDoc** was removed from workspace settings due to conflicts | Configure at profile level or ensure workspace settings don't conflict with auto-save. |

---

## 14. Checklist for Packaging

- [ ] Plugin implements `zendoc.createWorkspace` (includes GitHub setup) and `zendoc.setupBackup` (retry/skip flow)
- [ ] Plugin shows "Create workspace" prompt on first activation
- [ ] Install GitDoc, Markdown All in One, Markdown for Humans (when workspace created)
- [ ] Create workspace folder structure
- [ ] Copy all config files (settings, extensions, rules)
- [ ] Copy core documents (Welcome, vision, roadmap, etc.)
- [ ] Include starter project with AGENTS.md
- [ ] Initialize Git in template
- [ ] Add .gitignore
- [ ] Strip personal paths (clean-room audit)
- [ ] Document "Set up cloud backup" flow (gh auth + gh repo create)
- [ ] Test on fresh machine / fresh profile
