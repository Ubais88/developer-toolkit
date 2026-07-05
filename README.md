# Ubais Toolkit

Ubais Toolkit is a premium, high-performance web-based suite of developer utilities designed to streamline daily coding, debugging, and data manipulation workflows. Built with a sleek, customizable user interface supporting glassmorphism, fluid animations, and a unified theme system (including a pure OLED dark mode).

---

## 🚀 Features

### 1. JSON Tools & Formatting
- **Interactive Workspace**: Full-featured editor powered by Monaco Editor.
- **Data Statistics**: Live toolbar indicators tracking file size, key counts, depth, and validity.
- **Operations**: Instantly format, minify, validate, or view your JSON structure in a clear, interactive visual tree.

### 2. JSON Compare (Side-by-Side Diff)
- **Visual Comparison**: Side-by-side diff editor highlight deletions, additions, and modifications.
- **Merge Actions**: Inline buttons to quickly merge changes from Left-to-Right or Right-to-Left.

### 3. URL Modifier & Parser
- **Transformation Pipeline**: Find-and-replace rules for rewriting environment hosts (e.g., redirecting production endpoints to `localhost:5173`).
- **Magic Tokens**: Auto-generate unique, timestamp-based **UUIDv7** strings dynamically by embedding `[#token#]`, `[#ltid#]`, or `[#ltuid#]` tokens.
- **Editable Parameters**: Live table of query parameters. Double-click or type inside any cell to edit keys or values and instantly regenerate the URL.
- **Auto-Save History**: Automatically logs up to 10 unique transformations on a debounced delay, with quick-copy and restore options.

### 4. Regex Tester & Match Explainer
- **Live Pattern Testing**: Compile regular expressions in real-time as you type.
- **Flags Selector**: Easily toggle regex flags (`g` global, `i` case-insensitive, `m` multiline, `s` single-line).
- **Match Highlight overlay**: Highlights matching text structures in the workspace. Hovering over highlighted segments reveals capture group breakdowns.
- **Group Capture List**: Detailed lists showcasing matching strings, absolute indices, and extraction groups.

### 5. SQL Compare & Helper
- **Schema Mapping**: Compare database SQL statements or structures side-by-side.
- **SQL Helper**: Easily format, structure, and check keyword queries.

### 6. Comma Separator
- **Delimitation Engine**: Convert plain lists, columns, or spaced text into comma-separated arrays and vice-versa.
- **Clean Action Grid**: Double-quotes enclosing, bracket wrapping, whitespace trimming, and custom delimiter parameters.

### 7. Data Utilities
- **Data Utilities Tab**: Modern utility workspace for common encoding, decoding, hashing, and conversions.

### 8. Appearance Studio (Theme Editor)
- **Theme Selection**: Switch between preset styles including Cyber (pure OLED black), charcoal, slate, and light options.
- **Interactive Mockup**: Real-time mockup previews to customize border radii, glassmorphism filters, and accent color styles.
- **Universal Variable System**: CSS variable mapping ensures that theme choices propagate instantly across all tools.

---

## ⌨️ Global Shortcuts

Maximize your productivity with key-bindings:
- **`Ctrl + K`**: Cycle forward through active tools/tabs.
- **`Ctrl + B`**: Collapse/expand the navigation sidebar.

---

## 🛠️ Technology Stack

- **Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, CSS Custom Properties (Variables)
- **Editor Base**: Monaco Editor (`@monaco-editor/react`)
- **Icons**: Lucide React

---

## ⚙️ Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd developer-toolkit
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
Start the local development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Verification
Run TypeScript type-checks:
```bash
npm run typecheck
```

### Production Build
Compile and optimize the app for production:
```bash
npm run build
```
The output bundle will be generated inside the `dist/` directory.
