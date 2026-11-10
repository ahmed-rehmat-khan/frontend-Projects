# 💸 Expense Tracker — Simple

A clean, single-file expense tracker that runs entirely in your browser. No backend, no build step, no dependencies — just open the HTML file and start tracking your money.

![License](https://img.shields.io/badge/license-MIT-green.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)

---

## ✨ Features

- **Live balance** — instantly see your current balance, income, and expenses.
- **Income vs. expense bar** — visual split of where your money goes.
- **Add transactions** — title, amount, category, and type (income/expense).
- **Smart filters** — view all, income-only, or expense-only history.
- **Persistent data** — saved to `localStorage`, survives page refreshes.
- **Dark / light mode** — follows your system preference, with manual override support.
- **Responsive & accessible** — mobile-friendly, keyboard-navigable, ARIA labels.
- **XSS-safe** — uses `textContent`, never `innerHTML`, for user input.
- **Zero dependencies** — single HTML file, works offline.

## 📸 Preview

> Open `Expense Tracker.html` in any modern browser to see it in action.

## 🚀 Getting Started

No installation required.

1. Clone the repository:
   ```bash
   git clone https://github.com/ahmed-rehmat-khan/Expense_Tracker_Simple.git
   ```
2. Open the file in your browser:
   ```bash
   cd Expense_Tracker_Simple
   # Double-click "Expense Tracker.html" or serve it
   ```
3. (Optional) Serve locally for a cleaner URL:
   ```bash
   npx serve .
   ```

## 🗂️ Project Structure

```
Expense_Tracker_Simple/
└── Expense Tracker.html   # The entire app (HTML + CSS + JS)
└── README.md
```

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Markup     | HTML5                               |
| Styling    | CSS3 (custom properties, dark mode) |
| Logic      | Vanilla JavaScript (ES6+)           |
| Storage    | Browser `localStorage`              |
| Fonts      | Google Fonts — Instrument Sans      |

## 🎨 Customization

- **Currency:** change `"Rs "` and `"en-PK"` in the `money()` helper to your locale.
- **Categories:** edit the `<option>` list in the category `<select>`.
- **Theme colors:** tweak the CSS variables in `:root`.

## 🔒 Privacy

All data stays on your device in `localStorage`. Nothing is sent to any server.

## 📄 License

Released under the [MIT License](LICENSE).

---

Made with ❤️ by [Ahmed Rehmat Khan](https://github.com/ahmed-rehmat-khan)