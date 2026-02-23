# Vision: The Zendoc Manifesto

## 1. The Origin: From Friction to Focus

Zendoc was born from a paradox: the most powerful tools for digital creation (IDEs like Cursor/VS Code) are often the most hostile to the creative writing process. The project began as an attempt to "lobotomize" a developer's tool—stripping away the noise of a coding environment to create a minimalist sanctuary for thoughts.

During the initial build, we faced a "Technical Fragility" phase. Attempts to force aesthetic hacks—like hiding file extensions and using experimental visual editors—led to persistent "Assertion Failed" crashes. This was a turning point: we realized that true "Zen" isn't just a skin; it’s the absolute confidence that the technology is invisible and the data is indestructible.

## 2. The Morph: Stability as a Feature

The vision evolved from an aesthetic pursuit into a structural one. We moved away from "fragile hacks" toward a robust, "Atomic" foundation:

- **Stability First:** We abandoned experimental renderers in favor of the standard text editor to ensure the app never crashes.
- **Invisible Labor:** We automated the save-and-sync process using `afterDelay` saving and automatic publish to GitHub. The mental burden of "managing files" was replaced by a background "time machine".
- **The Focused Canvas:** By moving the sidebar to the right and hiding the activity bar, we neutralized the "IDE feel," creating a centered, distraction-free writing space.

## 3. The "Why": The Uncanny Valley of Productivity

Zendoc exists because there is a "Missing Middle" in the current market for power-writers:


| **The "Pretty" Apps** (Notion, Bear)                                         | **The "Power" Tools** (Cursor, Obsidian)                                   | **The Zendoc Vision**                                                          |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Walled Gardens:** Proprietary databases and slow, cloud-dependent syncing. | **High Noise:** Distracting UI, badges, and pop-ups designed for coding.   | **Industrial Grade:** The speed and reliability of an IDE without the clutter. |
| **Fragile History:** Limited or proprietary version control.                 | **High Friction:** Requires technical setup and constant "tool-tinkering". | **Immutable Memory:** Professional-grade Git versioning for every thought.     |


## 4. The Core Pillars

- **The Reliability of Git:** Bringing the absolute data integrity of professional software development to the casual writer.
- **Zero-Latency Thought:** A "zero-lag" experience where the software moves at the speed of the brain, not the speed of a cloud sync.
- **Standardized Freedom:** No proprietary formats. You own your raw Markdown files. If Zendoc disappears, your data remains as plain text on your drive.
- **The "Notebook" Vibe:** A professional engine successfully "tamed" to feel like a high-end physical notebook.

## 5. Open Source & Community First

Zendoc will be open source. The strategy is to build a strong community before monetization—as long as there are no ongoing costs, which there should not be. The core product is free; revenue comes later from optional upgrades (AI usage, premium plugins).

## **6. Zendoc vs. Obsidian: Choosing Your Workspace**

While both tools use **Markdown** as their foundation, they are designed for different workflows. Here is a neutral breakdown of how they compare.

### **The Architecture**

- **Obsidian:** A dedicated environment built for **Personal Knowledge Management (PKM)**. Its core strength is the "Graph View" and the ability to create a "Second Brain" by linking thousands of small notes.
- **Zendoc:** Built on a **Professional IDE (Integrated Development Environment)**. It treats writing like a software project, prioritizing the speed, stability, and "industrial" feel of a code editor (Cursor/VS Code).

### **Version Control & Sync**

- **Obsidian:** Offers a proprietary paid sync service. Users can also use third-party community plugins to connect to Git or other cloud services.
- **Zendoc:** Uses a **Docs-as-Code** model. Git integration is native to the engine, allowing for automated, background versioning and syncing to GitHub without needing additional paid services or complex plugin setups.

### **Feature Management**

- **Obsidian:** Uses a modular **Plugin System**. Users can customize almost every aspect of the app by installing community-made plugins for calendars, kanban boards, and AI.
- **Zendoc:** Uses a **Pre-configured Zen** approach. It is "opinionated" software—the settings for auto-save, right-aligned sidebars, and minimalist UI are baked in to provide a sanctuary-like experience out of the box.

### **AI Integration**

- **Obsidian:** AI capabilities are added through various community plugins, which require individual setup and API configuration.
- **Zendoc:** Leverages the native AI engine of **Cursor**. This provides a deeply integrated AI assistant that understands the context of your entire project folder natively.

---


| Feature            | **Obsidian**                                                     | **Zendoc**                                                               |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Primary Focus**  | Personal Knowledge Management (PKM) and idea linking.            | High-performance writing and deep work flow.                             |
| **Core Engine**    | Custom-built Electron application.                               | Industrial IDE (Cursor / VS Code).                                       |
| **Philosophy**     | **Modular:** Build your own tool via a massive plugin ecosystem. | **Opinionated:** Pre-configured "Zen" state to eliminate setup friction. |
| **File Format**    | Local-First Markdown (`.md`).                                    | Local-First Markdown (`.md`).                                            |
| **Sync & History** | Proprietary paid service or community-maintained Git plugins.    | Native **Docs-as-Code** model with automated background Git syncing.     |
| **Interface**      | Highly customizable; default left-aligned sidebar.               | Minimalist; right-aligned sidebar to keep text centered.                 |
| **AI Integration** | Added via third-party community plugins.                         | Built on Cursor’s native, project-aware AI engine.                       |


### **A Note for Markdown Users**

Because both tools use the open `.md` standard, your files are never "locked" into one app. You can open your Zendoc folder in Obsidian to see your graph, or open your Obsidian vault in Zendoc when you want to experience a high-performance, minimalist writing "Mode."