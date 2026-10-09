import { lazy, type ComponentType } from 'react';
import {
  Binary,
  Braces,
  CalendarClock,
  Clock,
  Database,
  FileCode,
  FileDiff,
  FileJson,
  FileType2,
  GitCompare,
  KeyRound,
  Link as LinkIcon,
  Palette,
  Pipette,
  QrCode,
  Route,
  SearchCode,
  Split,
  Wrench,
} from 'lucide-react';
import type { ToolCategory, ToolDef } from './types';
import { CATEGORIES } from './categories';
import { DATA_SUBTOOLS } from './data-utilities/subTools';

/** Lazy-load a named export and expose a `preload()` that warms the same chunk. */
function lazyTool<M>(loader: () => Promise<M>, pick: (m: M) => ComponentType) {
  return {
    component: lazy(() => loader().then((m) => ({ default: pick(m) }))),
    preload: loader,
  };
}

export const TOOLS: ToolDef[] = [
  // ── JSON ────────────────────────────────────────────────────────────────
  {
    id: 'json-editor',
    name: 'JSON Editor',
    description: 'Format, validate, repair and explore JSON in tabs',
    category: 'json',
    icon: FileJson,
    path: '/json',
    keywords: ['format', 'prettify', 'beautify', 'minify', 'validate', 'repair', 'tree', 'lint'],
    ...lazyTool(() => import('./json-editor/JSONTools'), (m) => m.JSONTools),
  },
  {
    id: 'json-compare',
    name: 'JSON Compare',
    description: 'Side-by-side JSON diff with per-change merge',
    category: 'json',
    icon: GitCompare,
    path: '/compare',
    keywords: ['diff', 'merge', 'difference', 'compare objects'],
    ...lazyTool(() => import('./json-compare/JSONCompare'), (m) => m.JSONCompare),
  },
  {
    id: 'json-to-ts',
    name: 'JSON → TypeScript',
    description: 'Generate TypeScript interfaces from a JSON sample',
    category: 'json',
    icon: FileType2,
    path: '/json-to-ts',
    keywords: ['typescript', 'interface', 'types', 'ts', 'type generator', 'schema'],
    badge: 'new',
    ...lazyTool(() => import('./json-to-ts/JsonToTs'), (m) => m.JsonToTs),
  },
  {
    id: 'json-yaml',
    name: 'JSON ↔ YAML',
    description: 'Convert between JSON and YAML both ways',
    category: 'json',
    icon: Braces,
    path: '/yaml',
    keywords: ['yaml', 'yml', 'convert', 'kubernetes', 'config'],
    badge: 'new',
    ...lazyTool(() => import('./json-yaml/JsonYaml'), (m) => m.JsonYaml),
  },
  {
    id: 'jsonpath',
    name: 'JSONPath Query',
    description: 'Query JSON with JSONPath expressions and filters',
    category: 'json',
    icon: Route,
    path: '/jsonpath',
    keywords: ['query', 'filter', 'jq', 'select', 'path', 'search json'],
    badge: 'new',
    ...lazyTool(() => import('./jsonpath/JsonPathTool'), (m) => m.JsonPathTool),
  },

  // ── Text ────────────────────────────────────────────────────────────────
  {
    id: 'text-diff',
    name: 'Text Diff',
    description: 'Compare any two texts with inline or split view',
    category: 'text',
    icon: FileDiff,
    path: '/diff',
    keywords: ['diff', 'compare', 'difference', 'changes', 'patch'],
    badge: 'new',
    ...lazyTool(() => import('./text-diff/TextDiff'), (m) => m.TextDiff),
  },
  {
    id: 'regex',
    name: 'Regex Tester',
    description: 'Live regex matching with capture groups',
    category: 'text',
    icon: SearchCode,
    path: '/regex',
    keywords: ['regular expression', 'regexp', 'match', 'pattern', 'groups'],
    ...lazyTool(() => import('./regex/RegexTester'), (m) => m.RegexTester),
  },
  {
    id: 'comma',
    name: 'Comma Separator',
    description: 'Turn lists into quoted, delimited values',
    category: 'text',
    icon: Split,
    path: '/comma',
    keywords: ['csv', 'list', 'join', 'quote', 'delimiter', 'in clause'],
    ...lazyTool(() => import('./comma/CommaSeparator'), (m) => m.CommaSeparator),
  },

  // ── Encoding & Security ────────────────────────────────────────────────
  {
    id: 'base64',
    name: 'Base64 & Images',
    description: 'Unicode-safe Base64 and image ↔ data URI',
    category: 'encoding',
    icon: Binary,
    path: '/base64',
    keywords: ['b64', 'encode', 'decode', 'data uri', 'image', 'base64url'],
    badge: 'new',
    ...lazyTool(() => import('./base64/Base64Tool'), (m) => m.Base64Tool),
  },
  {
    id: 'jwt',
    name: 'JWT Debugger',
    description: 'Decode tokens, inspect claims and expiry, verify HMAC',
    category: 'encoding',
    icon: KeyRound,
    path: '/jwt',
    keywords: ['token', 'jwt', 'bearer', 'auth', 'claims', 'oauth', 'hs256'],
    badge: 'new',
    ...lazyTool(() => import('./jwt/JwtDebugger'), (m) => m.JwtDebugger),
  },

  // ── Web ─────────────────────────────────────────────────────────────────
  {
    id: 'url-modifier',
    name: 'URL Modifier',
    description: 'Rewrite hosts, edit query params, generate tokens',
    category: 'web',
    icon: LinkIcon,
    path: '/url-modifier',
    keywords: ['url', 'query', 'params', 'rewrite', 'localhost', 'host'],
    ...lazyTool(() => import('./url-modifier/URLModifier'), (m) => m.URLModifier),
  },
  {
    id: 'color',
    name: 'Color Converter',
    description: 'HEX, RGB, HSL, OKLCH with contrast checks',
    category: 'web',
    icon: Pipette,
    path: '/color',
    keywords: ['hex', 'rgb', 'hsl', 'oklch', 'contrast', 'wcag', 'palette', 'picker'],
    badge: 'new',
    ...lazyTool(() => import('./color/ColorTool'), (m) => m.ColorTool),
  },
  {
    id: 'qr',
    name: 'QR Code',
    description: 'Generate QR codes for text, URLs and Wi-Fi',
    category: 'web',
    icon: QrCode,
    path: '/qr',
    keywords: ['qr', 'barcode', 'wifi', 'generate', 'scan'],
    badge: 'new',
    ...lazyTool(() => import('./qr/QrTool'), (m) => m.QrTool),
  },

  // ── Time ────────────────────────────────────────────────────────────────
  {
    id: 'timestamp',
    name: 'Timestamp & Timezones',
    description: 'Epoch ↔ dates with a live clock across timezones',
    category: 'time',
    icon: Clock,
    path: '/time',
    keywords: ['epoch', 'unix', 'date', 'iso', 'utc', 'timezone', 'now', 'time'],
    badge: 'new',
    ...lazyTool(() => import('./timestamp/TimestampTool'), (m) => m.TimestampTool),
  },
  {
    id: 'cron',
    name: 'Cron Explainer',
    description: 'Human-readable cron with upcoming run times',
    category: 'time',
    icon: CalendarClock,
    path: '/cron',
    keywords: ['cron', 'crontab', 'schedule', 'job', 'next run'],
    badge: 'new',
    ...lazyTool(() => import('./cron/CronTool'), (m) => m.CronTool),
  },

  // ── Database ────────────────────────────────────────────────────────────
  {
    id: 'sql-helper',
    name: 'SQL Helper',
    description: 'Format SQL, change keyword case, build IN clauses',
    category: 'database',
    icon: FileCode,
    path: '/sql-helper',
    keywords: ['sql', 'format', 'in clause', 'query', 'beautify', 'comments'],
    ...lazyTool(() => import('./sql-helper/SQLHelper'), (m) => m.SQLHelper),
  },
  {
    id: 'sql-compare',
    name: 'SQL Compare',
    description: 'Check two SQL queries for differences',
    category: 'database',
    icon: Database,
    path: '/sql-compare',
    keywords: ['sql', 'diff', 'compare', 'query'],
    ...lazyTool(() => import('./sql-compare/SQLCompare'), (m) => m.SQLCompare),
  },

  // ── Utilities ───────────────────────────────────────────────────────────
  {
    id: 'data',
    name: 'Data Utilities',
    description: 'UUIDs, hashes, encoders, converters and text helpers',
    category: 'utilities',
    icon: Wrench,
    path: '/data',
    keywords: ['uuid', 'hash', 'lorem', 'csv', 'excel', 'case', 'escape', 'html entities'],
    subTools: DATA_SUBTOOLS,
    ...lazyTool(() => import('./data-utilities/DataUtilities'), (m) => m.DataUtilities),
  },

  // ── Settings ────────────────────────────────────────────────────────────
  {
    id: 'appearance',
    name: 'Appearance',
    description: 'Theme, accent colour, radius and presets',
    category: 'settings',
    icon: Palette,
    path: '/theme',
    keywords: ['theme', 'dark mode', 'light mode', 'accent', 'color', 'settings', 'preferences'],
    hideFromSidebar: true,
    ...lazyTool(() => import('./appearance/Appearance'), (m) => m.Appearance),
  },
];

export const TOOLS_BY_ID: Record<string, ToolDef> = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

export function getToolByPath(pathname: string): ToolDef | undefined {
  return TOOLS.find((t) => t.path === pathname);
}

export function toolsByCategory(filter: (t: ToolDef) => boolean = () => true) {
  return CATEGORIES.map((category) => ({
    category,
    tools: TOOLS.filter((t) => t.category === category.id && filter(t)),
  })).filter((g) => g.tools.length > 0);
}

export type { ToolCategory, ToolDef };
