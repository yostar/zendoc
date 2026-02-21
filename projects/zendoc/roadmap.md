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
- **Plugin-first:** The Zendoc plugin handles everything. On first activation, show "Create workspace" prompt. User clicks → workspace created.
- **Command links:** Welcome.md uses `command:` links (e.g., `[Set up cloud backup](command:zendoc.setupBackup)`) so users click instead of type.
- **GitHub in setup:** GitHub connection is part of the create-workspace flow, not optional. Wizard runs `gh auth login` and `gh repo create` before opening the workspace.

## Phase 3: The Distribution Layer

How the "Package" reaches the world.

- **The Zendoc Installer:** A simple landing page where users can download the "Zen-Kit" (the zip of the template).
- **The "Pro" Preset:** A pre-configured `settings.json` toggle for different writing styles (e.g., "Scriptwriter Mode," "Academic Mode," "Journalist Mode").
- **Automated Updates:** A mechanism to push "Workspace Updates" (like the new history file logic we created) to existing users without breaking their custom files.

## Phase 4: Beyond the Desktop

- **Mobile Sync Bridge:** Documentation on how to use "Working Copy" (iOS) or "GitJournal" (Android) to edit these same Markdown files on the go while maintaining the GitHub sync.
- **The "Export" Engine:** A one-click "Publish" button that converts the minimalist Markdown into a beautifully formatted PDF or a clean HTML blog post.