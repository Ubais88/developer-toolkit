import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  CornerDownLeft,
  Home,
  Keyboard,
  Link2,
  Monitor,
  Moon,
  PaintBucket,
  PanelLeft,
  Search,
  Star,
  Sun,
  Wrench,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Kbd, cn } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { useClipboard } from '../hooks/useClipboard';
import { useFavorites, useRecents } from '../hooks/usePrefs';
import { ACCENTS, ACCENT_ORDER } from '../theme/tokens';
import { CATEGORY_BY_ID } from '../tools/categories';
import { TOOLS, TOOLS_BY_ID, getToolByPath, type ToolDef } from '../tools/registry';
import { useCurrentPaletteActions } from './paletteActions';
import { paletteFilter } from './paletteFilter';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onToggleSidebar: () => void;
  onOpenShortcuts: () => void;
}

type Page = 'accent';

export function CommandPalette({ open, onClose, onToggleSidebar, onOpenShortcuts }: CommandPaletteProps) {
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
    } else if (returnFocus.current) {
      returnFocus.current.focus?.();
      returnFocus.current = null;
    }
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 36 }}
            className="relative w-full max-w-[640px]"
          >
            {/* Accent glow */}
            <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-b from-primary/40 via-primary/5 to-transparent opacity-70 blur-[1px]" />
            <PaletteBody onClose={onClose} onToggleSidebar={onToggleSidebar} onOpenShortcuts={onOpenShortcuts} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function PaletteBody({ onClose, onToggleSidebar, onOpenShortcuts }: Omit<CommandPaletteProps, 'open'>) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setMode, mode, primaryColor, setPrimaryColor } = useTheme();
  const { recents } = useRecents();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { copy } = useClipboard();
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState<Page[]>([]);
  const page = pages[pages.length - 1];
  const currentTool = getToolByPath(pathname);
  const toolActions = useCurrentPaletteActions();

  const recentTools = useMemo(
    () => recents.map((r) => TOOLS_BY_ID[r.id]).filter((t): t is ToolDef => !!t && t.path !== pathname).slice(0, 4),
    [recents, pathname],
  );

  // value → preload, so highlighting an item warms its chunk
  const preloadByValue = useMemo(() => {
    const map = new Map<string, () => Promise<unknown>>();
    for (const t of TOOLS) {
      map.set(t.name.toLowerCase(), t.preload);
      map.set(`recent ${t.name}`.toLowerCase(), t.preload);
      t.subTools?.forEach((s) => map.set(`${s.name} ${t.name}`.toLowerCase(), t.preload));
    }
    return map;
  }, []);

  const run = (fn: () => void) => {
    fn();
    onClose();
  };
  const go = (path: string) => run(() => navigate(path));

  const pushPage = (p: Page) => {
    setPages((prev) => [...prev, p]);
    setSearch('');
  };

  const toolEntry = (tool: ToolDef, opts: { id: string; value: string; keywords?: string[]; recent?: boolean }): Entry => ({
    id: opts.id,
    value: opts.value,
    keywords: opts.keywords,
    onSelect: () => go(tool.path),
    icon: <tool.icon />,
    title: (
      <span className="flex items-center gap-1.5">
        {tool.name}
        {isFavorite(tool.id) && <Star className="h-3 w-3 fill-warning text-warning" />}
        {tool.badge === 'new' && <span className="rounded bg-primary/10 px-1 text-[10px] font-semibold uppercase text-primary">new</span>}
      </span>
    ),
    subtitle: tool.description,
    trailing: (
      <span className="hidden items-center gap-1 text-2xs text-muted-foreground sm:flex">
        {opts.recent && <Clock className="h-3 w-3" />}
        {CATEGORY_BY_ID[tool.category].label}
      </span>
    ),
  });

  const sections: Section[] =
    page === 'accent'
      ? [
          {
            heading: 'Accent colour',
            entries: ACCENT_ORDER.map((c) => ({
              id: c,
              value: `accent ${ACCENTS[c].label}`,
              onSelect: () => run(() => setPrimaryColor(c)),
              icon: <span className="h-3.5 w-3.5 rounded-full ring-2 ring-white/10" style={{ background: `hsl(${ACCENTS[c].hsl})` }} />,
              title: ACCENTS[c].label,
              trailing: primaryColor === c ? <Check className="h-4 w-4 text-primary" /> : undefined,
            })),
          },
        ]
      : [
          {
            heading: currentTool?.name ?? 'Current tool',
            entries: toolActions.map((action) => ({
              id: `action-${action.id}`,
              value: `${action.title} ${currentTool?.name ?? ''}`,
              keywords: action.keywords,
              onSelect: () => run(action.run),
              icon: <action.icon />,
              title: action.title,
              shortcut: action.shortcut,
            })),
          },
          {
            heading: 'Recent',
            entries: search ? [] : recentTools.map((tool) => toolEntry(tool, { id: `recent-${tool.id}`, value: `recent ${tool.name}`, recent: true })),
          },
          {
            heading: 'Tools',
            entries: TOOLS.map((tool) =>
              toolEntry(tool, { id: tool.id, value: tool.name, keywords: [...tool.keywords, CATEGORY_BY_ID[tool.category].label, tool.description] }),
            ),
          },
          {
            heading: 'Data Utilities',
            entries: !search
              ? []
              : TOOLS.flatMap((tool) =>
                  (tool.subTools ?? []).map((sub) => ({
                    id: `${tool.id}-${sub.id}`,
                    value: `${sub.name} ${tool.name}`,
                    keywords: sub.keywords,
                    onSelect: () => go(`${tool.path}?tool=${sub.id}`),
                    icon: <Wrench />,
                    title: sub.name,
                    subtitle: sub.description,
                    trailing: <span className="text-2xs text-muted-foreground">{tool.name}</span>,
                  })),
                ),
          },
          {
            heading: 'Actions',
            entries: [
              ...(pathname !== '/' ? [{ id: 'home', value: 'Go home', keywords: ['dashboard'], onSelect: () => go('/'), icon: <Home />, title: 'Go to dashboard' }] : []),
              ...(currentTool && currentTool.category !== 'settings'
                ? [
                    {
                      id: 'favorite',
                      value: 'Toggle favorite',
                      keywords: ['star', 'pin', 'favourite'],
                      onSelect: () => run(() => toggleFavorite(currentTool.id)),
                      icon: <Star />,
                      title: isFavorite(currentTool.id) ? `Remove ${currentTool.name} from favorites` : `Add ${currentTool.name} to favorites`,
                    },
                  ]
                : []),
              { id: 'sidebar', value: 'Toggle sidebar', keywords: ['collapse', 'expand', 'navigation'], onSelect: () => run(onToggleSidebar), icon: <PanelLeft />, title: 'Toggle sidebar', shortcut: 'mod+b' },
              ...(mode !== 'dark' ? [{ id: 'dark', value: 'Dark theme', keywords: ['theme', 'mode', 'night'], onSelect: () => run(() => setMode('dark')), icon: <Moon />, title: 'Switch to dark theme' }] : []),
              ...(mode !== 'light' ? [{ id: 'light', value: 'Light theme', keywords: ['theme', 'mode', 'day'], onSelect: () => run(() => setMode('light')), icon: <Sun />, title: 'Switch to light theme' }] : []),
              ...(mode !== 'system' ? [{ id: 'system', value: 'System theme', keywords: ['theme', 'mode', 'auto', 'os'], onSelect: () => run(() => setMode('system')), icon: <Monitor />, title: 'Use system theme' }] : []),
              {
                id: 'accent',
                value: 'Change accent colour',
                keywords: ['color', 'theme', 'primary', 'accent'],
                onSelect: () => pushPage('accent'),
                icon: <PaintBucket />,
                title: 'Change accent colour…',
                trailing: <ChevronRight className="h-4 w-4 text-muted-foreground" />,
              },
              { id: 'copy-url', value: 'Copy page URL', keywords: ['link', 'share', 'url'], onSelect: () => run(() => void copy(window.location.href, 'Link copied')), icon: <Link2 />, title: 'Copy link to this page' },
              { id: 'shortcuts', value: 'Keyboard shortcuts', keywords: ['help', 'keys', 'hotkeys'], onSelect: () => run(onOpenShortcuts), icon: <Keyboard />, title: 'Keyboard shortcuts', shortcut: '?' },
            ],
          },
        ];

  const visibleSections = rankSections(sections, search);

  return (
    <Command
      label="Command palette"
      loop
      shouldFilter={false}
      onValueChange={(v) => void preloadByValue.get(v.toLowerCase())?.()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (pages.length) setPages((prev) => prev.slice(0, -1));
          else onClose();
        }
        if (e.key === 'Backspace' && !search && pages.length) {
          e.preventDefault();
          setPages((prev) => prev.slice(0, -1));
        }
      }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-popover/95 text-popover-foreground shadow-popover backdrop-blur-xl',
        '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-muted-foreground',
      )}
    >
      {/* Input */}
      <div className="flex items-center gap-2.5 border-b border-border-subtle px-4">
        {page ? (
          <button
            onClick={() => setPages((prev) => prev.slice(0, -1))}
            className="focus-ring -ml-1 flex items-center gap-1 rounded bg-surface-3 px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Accent
          </button>
        ) : (
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <Command.Input
          autoFocus
          value={search}
          onValueChange={setSearch}
          placeholder={page === 'accent' ? 'Pick an accent colour…' : 'Search tools and actions…'}
          className="h-13 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <Kbd combo="esc" size="sm" />
      </div>

      <Command.List className="max-h-[min(420px,55vh)] scroll-py-2 overflow-y-auto overscroll-contain px-2 pb-2 transition-[height] duration-150">
        <Command.Empty className="flex flex-col items-center gap-2 py-12 text-center text-13 text-muted-foreground">
          <Search className="h-5 w-5 opacity-50" />
          No results for “{search}”
        </Command.Empty>

        {visibleSections.map((section) => (
          <Command.Group key={section.heading} heading={section.heading}>
            {section.entries.map(({ id, ...entry }) => (
              <PaletteItem key={id} {...entry} />
            ))}
          </Command.Group>
        ))}
      </Command.List>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border-subtle bg-surface-1/60 px-4 py-2 text-2xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Kbd combo="arrowup" size="sm" />
            <Kbd combo="arrowdown" size="sm" />
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <CornerDownLeft className="h-3 w-3" />
            Open
          </span>
          {page && (
            <span className="flex items-center gap-1.5">
              <Kbd combo="backspace" size="sm" />
              Back
            </span>
          )}
        </div>
        <span className="hidden sm:inline">{TOOLS.length} tools</span>
      </div>
    </Command>
  );
}

interface PaletteItemProps {
  value: string;
  keywords?: string[];
  onSelect: () => void;
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  shortcut?: string;
}

function PaletteItem({ value, keywords, onSelect, icon, title, subtitle, trailing, shortcut }: PaletteItemProps) {
  return (
    <Command.Item
      value={value}
      keywords={keywords}
      onSelect={onSelect}
      className={cn(
        'group relative flex cursor-pointer select-none items-center gap-3 rounded-lg px-2.5 py-2 text-13 outline-none transition-colors duration-75',
        'data-[selected=true]:bg-surface-3 data-[disabled=true]:opacity-50',
      )}
    >
      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-muted-foreground transition-colors group-data-[selected=true]:border-primary/30 group-data-[selected=true]:text-primary [&_svg]:h-3.5 [&_svg]:w-3.5">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-foreground">{title}</span>
        {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
      {trailing}
      {shortcut && <Kbd combo={shortcut} size="sm" />}
    </Command.Item>
  );
}

type Entry = PaletteItemProps & { id: string };

interface Section {
  heading: string;
  entries: Entry[];
}

/**
 * Filters and orders entries in React instead of letting cmdk reorder DOM nodes: cmdk sorts before newly
 * matching items have mounted (so replacing the whole query mis-orders them) and never reorders groups.
 */
function rankSections(sections: Section[], search: string): Section[] {
  if (!search.trim()) return sections.filter((s) => s.entries.length > 0);
  return sections
    .map((section) => {
      const scored = section.entries
        .map((entry) => ({ entry, score: paletteFilter(entry.value, search, entry.keywords) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      return { heading: section.heading, entries: scored.map((x) => x.entry), best: scored[0]?.score ?? 0 };
    })
    .filter((s) => s.entries.length > 0)
    .sort((a, b) => b.best - a.best);
}
