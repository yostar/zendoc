---
date: 2025-02-21
tags: [packaging, installer, distribution]
status: draft
---

# Zendoc Packaging Spec

Everything required to build and package Zendoc for distribution. This document is the single source of truth for what the installer must deliver.

---

## 1. Installer Overview

**Goal:** One install for non-technical users. No GitHub Desktop. No manual config.

**Delivery options (in order of ambition):**
- **Option A:** Cursor plugin (marketplace) + "Create Zendoc" command
- **Option B:** Standalone installer app that creates profile, installs extensions, creates workspace
- **Option C:** Zen-Kit zip (template) with setup script

---

## 2. Zendoc Profile

The installer must create a **Cursor profile** named "Zendoc" (or "Zendoc Profile").

- **Purpose:** Isolates Zendoc extensions and settings from the user's other work.
- **Scope:** All Zendoc extensions are installed only in this profile.
- **Behavior:** When the user opens Cursor in Zendoc mode, they use this profile. GitDoc and other extensions run only here.

**Implementation note:** Cursor/VS Code profiles are created via the UI. The installer may need to guide the user through profile creation or use a script/API if available.

---

## 3. Required Extensions

These extensions **must** be installed in the Zendoc profile:

| Extension | Publisher | Extension ID | Purpose |
|-----------|------------|--------------|---------|
| **GitDoc** | vsls-contrib | `vsls-contrib.gitdoc` | Auto-commit and auto-push on save. Replaces manual GitHub Desktop. |
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

## 4. No GitHub Desktop

**GitHub Desktop is not required.** All GitHub operations use the command line:

- **Repo creation:** `gh repo create zendoc --private --source=. --push`
- **Authentication:** `gh auth login` (opens browser, one-time)
- **Ongoing sync:** GitDoc handles commit + push automatically

**User prerequisites:**
- Git (usually pre-installed on macOS)
- GitHub CLI (`gh`) — install via `brew install gh` or include in installer
- GitHub account

**Onboarding flow:** When user runs "Set up cloud backup," the agent runs `gh auth login` (if needed), then `gh repo create`.

---

## 5. Workspace Template Structure

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

## 6. Configuration Files

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

## 7. Cursor Rules

Include these rules in `.vscode/.cursor/rules/`:

| File | Purpose |
|------|---------|
| `librarian.mdc` | Document structure, metadata, organization |
| `instructions.mdc` | Add/edit/show instructions commands for AGENTS.md |
| `project-context.mdc` | Load project-specific AGENTS.md when in projects/ |

---

## 8. AGENTS.md Structure

- **Root `AGENTS.md`:** Workspace-level instructions. Tells agent to read project AGENTS.md when in a project folder.
- **`projects/zendoc/AGENTS.md`:** Zendoc prototype context (for development). Has "Your Instructions" section for user content.
- **`projects/[starter]/AGENTS.md`:** Template for user's first project.

---

## 9. Core Documents to Include

| File | Purpose |
|------|---------|
| `projects/zendoc/Welcome.md` | First-run onboarding, shortcuts, instructions |
| `projects/zendoc/vision.md` | Product vision |
| `projects/zendoc/roadmap.md` | Roadmap |
| `projects/zendoc/business_model.md` | Business model |
| `projects/zendoc/history.md` | Technical spec, troubleshooting |
| `projects/zendoc/packaging.md` | This file |

---

## 10. GitHub Setup Flow (No Desktop)

When user runs "Set up cloud backup" or equivalent:

1. Check if `gh` is installed. If not: `brew install gh` (or prompt user).
2. Run `gh auth login` — opens browser for one-time sign-in.
3. Run `git init` (if not already).
4. Run `gh repo create zendoc --private --source=. --push`.
5. Confirm: "Your work is now backed up to GitHub."

---

## 11. Clean-Room Audit

Before packaging, strip all personal paths and machine-specific config:

- No `/Users/YourName/...` paths
- No personal repo URLs
- No API keys or tokens
- Settings must work on any machine

---

## 12. Known Issues & Caveats

| Issue | Mitigation |
|-------|------------|
| **Markdown for Humans** caused crashes when set as default for `.md` | Keep default as Standard Text Editor. User opens WYSIWYG via "Open With..." |
| **Dotfile toggle** (Cmd+Shift+A) doesn't work with `**/.*` pattern | Toggle Excluded Files extension has limitations. Dotfiles stay hidden; no reliable toggle. |
| **GitDoc** was removed from workspace settings due to conflicts | Configure at profile level or ensure workspace settings don't conflict with auto-save. |

---

## 13. Checklist for Packaging

- [ ] Create Zendoc profile
- [ ] Install GitDoc, Markdown All in One, Markdown for Humans
- [ ] Create workspace folder structure
- [ ] Copy all config files (settings, extensions, rules)
- [ ] Copy core documents (Welcome, vision, roadmap, etc.)
- [ ] Include starter project with AGENTS.md
- [ ] Initialize Git in template
- [ ] Add .gitignore
- [ ] Strip personal paths (clean-room audit)
- [ ] Document "Set up cloud backup" flow (gh auth + gh repo create)
- [ ] Test on fresh machine / fresh profile
