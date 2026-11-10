# Quill Notes — Simple

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/No%20Build-Step-2f7f79?style=for-the-badge" alt="No build step" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

<p align="center">
  <strong>A calm, fast, single-file notes app that lives entirely in your browser.</strong><br/>
  No accounts. No servers. No build step. Just open <code>index.html</code> and start writing.
</p>

---

## ✨ Why Quill Notes?

Most note apps want your email, your data, and your monthly fee. **Quill Notes** is the opposite:

- 🪶 **One file.** The entire app is a single `index.html` — HTML, CSS, and JavaScript together.
- ⚡ **Instant.** Opens in milliseconds. No bundler, no dependencies, no install.
- 🔒 **Private by default.** Everything is stored in your browser's `localStorage`. Nothing leaves your device.
- 🌙 **Adaptive.** Light and dark themes, with system preference support and a manual override.
- 📱 **Responsive.** A two-pane desktop layout that collapses into a single focused view on phones.

## 🎯 Features

| Feature | Description |
| --- | --- |
| 📝 **Rich-ish editor** | Title + body with a serif reading font (Newsreader) and generous line height |
| 🎨 **Color tags** | Tag notes with Sage, Sky, Amber, or Rose — or no color at all |
| 📌 **Pinning** | Pin important notes so they always stay on top |
| 🔍 **Instant search** | Filter by title or body as you type |
| 🗑️ **Undo delete** | Accidentally deleted a note? Undo within 6 seconds |
| 📊 **Word count** | Live word counter in the footer |
| 💾 **Auto-save** | Every keystroke is persisted automatically |
| 🌓 **Theme** | System-aware dark mode + manual light/dark toggle |
| ⌨️ **Keyboard friendly** | Focus rings, semantic buttons, accessible labels |

## 🚀 Getting Started

There is **nothing to install**.

### Option 1 — Just open it

```bash
# Clone the repo
git clone https://github.com/ahmed-rehmat-khan/Quil_Notes_Simple.git
cd Quil_Notes_Simple

# Open in your browser
# Windows
start index.html
# macOS
open index.html
# Linux
xdg-open index.html
```

### Option 2 — Serve locally (optional)

If you prefer a local server (useful for testing):

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`.

### Option 3 — GitHub Pages

This repo is GitHub Pages ready. Enable Pages in **Settings → Pages → Deploy from branch → main / root**, and your notes app will be live at:

```
https://ahmed-rehmat-khan.github.io/Quil_Notes_Simple/
```

## 🗂️ Project Structure

```
Quil_Notes_Simple/
├── index.html      # The entire app — markup, styles, and logic
├── README.md       # You are here
├── LICENSE         # MIT
└── .gitignore
```

## 🧠 How It Works

- **State** lives in a single `notes` array of objects `{ id, title, body, pinned, color, updated }`.
- **Persistence** uses `localStorage` under the key `quill-notes-v1`.
- **Rendering** is vanilla DOM manipulation — no framework, no virtual DOM.
- **First visit** seeds a welcome note so the app never feels empty.
- **Sorting** puts pinned notes first, then most recently updated.

## 🛠️ Tech Stack

- **HTML5** — semantic structure
- **CSS3** — custom properties, grid, flexbox, `env()` safe-area insets, `prefers-color-scheme`
- **Vanilla JavaScript (ES2020+)** — arrow functions, template literals, `localStorage`
- **Google Fonts** — Hanken Grotesk + Newsreader (loaded via CDN)

## 📐 Design Tokens

The whole palette is driven by CSS custom properties, so re-theming is a one-block change:

```css
:root {
  --bg: #e6ecec;        /* page background */
  --panel: #f6f9f8;     /* app surface */
  --ink: #17262b;       /* primary text */
  --muted: #5f7378;     /* secondary text */
  --line: #d0dada;      /* borders */
  --accent: #2f7f79;    /* primary action */
  --danger: #b8402f;    /* destructive */
}
```

## 🗺️ Roadmap

- [ ] Markdown preview mode
- [ ] Export notes as `.txt` / `.md`
- [ ] Import from a JSON backup
- [ ] Optional passphrase-based encryption
- [ ] PWA manifest + offline install
- [ ] Tags beyond the four color swatches

## 🤝 Contributing

Contributions are welcome! Because the app is a single file, contributing is unusually simple:

1. Fork the repo
2. Edit `index.html`
3. Open a pull request with a clear description

Please keep changes focused and avoid adding build tooling or dependencies — the zero-dependency nature of this project is a feature.

## 📄 License

Released under the [MIT License](./LICENSE). Do whatever you want with it — just keep the copyright notice.

## 👤 Author

**Ahmed** — [@ahmed-rehmat-khan](https://github.com/ahmed-rehmat-khan)

> Built with care for people who just want to write.

---

<p align="center">
  <sub>If Quill Notes helped you, consider giving the repo a ⭐ — it means a lot.</sub>
</p>
