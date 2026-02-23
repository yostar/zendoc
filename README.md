# Zendoc

**Distraction-free writing, powered by AI.** A VS Code extension that turns Cursor into a writing platform with auto-backup to GitHub.

## What is this?

Zendoc is an open-source project that "tames" Cursor (or VS Code) for creative writing. It strips away the noise of a coding environment and creates a minimalist sanctuary for thoughts—while keeping the reliability of Git and the power of AI.

- **Your work is immortal:** Auto-save every second. Auto-push to GitHub. Your entire history is backed up.
- **Standardized freedom:** Plain Markdown files you own. No walled gardens.
- **Cursor for writing:** IDE-grade tooling, tuned for prose. AI that acts as a librarian, not a coder.

## This repository


| Path                            | Description                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `extension/`                    | The Zendoc VS Code extension (published to [Open VSX](https://open-vsx.org/extension/YMSDynamics/yms-zendoc))     |
| `extension/resources/template/` | The workspace template—Welcome.md, Cursor rules, project structure—that gets copied when users create a workspace |
| `index.html`                    | The landing page                                                                                                  |
| `projects/`                     | Project docs, vision, roadmap—the meta stuff                                                                      |


## Try it

1. Install [Cursor](https://cursor.com)
2. Install the [Zendoc extension](https://open-vsx.org/extension/YMSDynamics/yms-zendoc) 
3. Run **Create Zendoc workspace** 
4. Connect GitHub when prompted, enable GitDoc, and you're writing

## Develop

```bash
cd extension
npm install
npm run compile
```

Press F5 to debug in Extension Development Host.

## Publish

```bash
cd extension
npx ovsx publish -p YOUR_OPEN_VSX_TOKEN
```

## License

MIT