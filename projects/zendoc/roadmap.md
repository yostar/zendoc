This roadmap focuses on the "Productization" phase—transitioning from a set of manual tweaks to a "One-Click" experience that a non-technical writer can install and use immediately.

---

# Roadmap: The Zendoc Distribution Plan

## Phase 1: The "Zen-Engine" (Package & Port)

The goal is to turn our manual `settings.json` and folder structure into a repeatable template.

- **The Blueprint:** Create a "Master Template" repository on GitHub that includes the optimized `.cursor/rules/`, the `projects/` folder structure, and the `.vscode/settings.json`.
- **The "Clean-Room" Audit:** Script a process to strip all personal paths (e.g., `/Users/YourName/...`) from the configuration so it works on any machine instantly.
- **The Extension Bundle:** Identify the absolute minimum extensions (like "Markdown for Humans") and package them into a "Recommended Workspace Extensions" list that prompts for installation on first open.

## Phase 2: The "Zero-Knowledge" Onboarding

Non-technical users shouldn't have to touch a terminal or a JSON file. **Clicks only—no typing.**

- **Homepage:** Two steps only—Download Cursor, Install Zendoc. See `homepage.md` for copy.
- **Extension-first:** Build a VS Code extension (works in Cursor). Native UI: folder picker, input boxes, notifications. No chat required.
- **Setup wizard:** On first activation, show "Create workspace" notification. User clicks → wizard runs with native dialogs. Creates workspace, runs `gh auth` + `gh repo create`, installs extensions via `cursor --install-extension`, opens workspace.
- **Command links:** Welcome.md uses `command:` links (e.g., `[Set up cloud backup](command:zendoc.setupBackup)`) for retry if GitHub setup was skipped.

## Phase 3

*To be defined.*

## Phase 4

*To be defined.*