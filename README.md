# Ubais Toolkit

A fast, keyboard-first suite of developer utilities with a Raycast/Linear-style interface: dark-first, accent-themed, with spring animations. Everything runs locally in your browser.

---

## ✨ Highlights

- **Home dashboard**: search every tool, keep favorites and recently used tools, and filter by category.
- **Command palette (`Ctrl/⌘ + K`)**: fuzzy-search tools, Data Utilities sub-tools and actions (theme, accent colour, sidebar, favorites, copy link) from anywhere, including inside editors. The open tool adds its own commands at the top: Format / Minify / Sort keys in the JSON Editor, Swap / Next change in Text Diff, and so on.
- **Favorites and recents**: star any tool from the sidebar, the top bar or a dashboard card. They sync across browser tabs.
- **Themes**: Light / Dark / System, 12 accent colours, 8 presets, corner radius, and translucent chrome. The Monaco editors follow the theme.
- **Responsive**: collapsible sidebar on desktop and a slide-in drawer on mobile.
- **Fast**: each tool is lazy-loaded, so the dashboard never downloads Monaco.

## 🧰 Tools

| Category | Tools |
| --- | --- |
| **JSON** | JSON Editor (tabs, format / minify / sort keys / repair, tree view, open & download files) · JSON Compare (diff with per-change merge) · JSON → TypeScript · JSON ↔ YAML · JSONPath Query |
| **Text** | Text Diff · Regex Tester (named groups, replace preview, common patterns) · Comma Separator |
| **Encoding & Security** | Base64 & Images (Unicode-safe, data URIs) · JWT Debugger (claims, expiry, HMAC verify) |
| **Web** | URL Modifier (rewrite rules, magic UUIDv7 tokens, editable params, history) · Color Converter (HEX/RGB/HSL/OKLCH, WCAG contrast) · QR Code |
| **Time** | Timestamp & Timezones (live clock) · Cron Explainer (next run times) |
| **Database** | SQL Helper (format, keyword case, IN clauses) · SQL Compare (with line diff) |
| **Utilities** | Data Utilities: UUID v4/v7, hashes, lorem ipsum, URL/HTML encoding, CSV ↔ JSON, Excel ↔ bytes, escaping, case converter, epoch converter. Each one can be deep-linked, e.g. `/data?tool=uuid` |

## ⌨️ Shortcuts

| Keys | Action |
| --- | --- |
| `Ctrl/⌘ + K` | Command palette |
| `Ctrl/⌘ + B` | Toggle sidebar |
| `?` | Keyboard shortcuts cheat sheet |
| `g` then `h` | Go to dashboard |
| `/` | Focus dashboard search |
| `Alt + Shift + F / M / S / V / R` | JSON Editor: format / minify / sort keys / validate / repair |
| `Alt + Shift + C / D / X / T` | JSON Editor: copy / download / clear / tree view |
| `Ctrl + T / W / S`, `F2` | JSON Editor tabs: new / close / save / rename |

## 🛠️ Tech stack

React 18 · TypeScript · Vite · Tailwind CSS (HSL design tokens) · framer-motion · cmdk · Monaco Editor · React Router · lucide-react.
Tool-specific libraries are loaded only with their tool: `yaml`, `jsonpath-plus`, `cronstrue` + `cron-parser`, `qrcode`, `jsonrepair`.

### Project layout

```
src/
  app/          Shell: sidebar, top bar, command palette, mobile nav, routes
  pages/        Dashboard
  tools/        One folder per tool + registry.ts (the single source of truth)
  components/   ui/ (design-system primitives) and editor/ (Monaco wrappers & theme)
  context/      Theme and toast providers
  hooks/ lib/ theme/ utils/
```

To add a tool: create `src/tools/<id>/MyTool.tsx` and add one entry to `src/tools/registry.ts`. The route, sidebar item, dashboard card and palette entry are all generated from it.

## ⚙️ Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run lint
npm run build      # outputs to dist/
```

Deployed on Vercel. `vercel.json` rewrites every route to `index.html` so deep links work on refresh.
