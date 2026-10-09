import { useEffect, useMemo, useRef, useState } from 'react';
import type { OnMount } from '@monaco-editor/react';
import { AnimatePresence, motion } from 'framer-motion';
import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import {
  ArrowDownAZ,
  CheckCircle2,
  Copy,
  Download,
  FolderOpen,
  Maximize,
  Minimize,
  Minimize2,
  Network,
  Plus,
  Trash2,
  Wand2,
  Wrench,
  XCircle,
} from 'lucide-react';
import { usePaletteActions } from '../../app/paletteActions';
import { Editor } from '../../components/editor/Editor';
import { Button, EmptyState, IconButton, cn } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useClipboard } from '../../hooks/useClipboard';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatJSON, minifyJSON, repairJSON, validateJSON } from '../../utils/jsonUtils';
import { JSONTabs, type TabData } from './JSONTabs';

type MonacoEditor = Parameters<OnMount>[0];

const DEFAULT_TAB: TabData = { id: 'tab-1', name: 'Untitled-1.json', content: '', isPinned: false, isUnsaved: false };

const SAMPLE = JSON.stringify(
  {
    id: 'ord_2041',
    status: 'shipped',
    total: 129.5,
    customer: { name: 'Ada Lovelace', email: 'ada@example.com', vip: true },
    items: [
      { sku: 'KB-01', name: 'Mechanical keyboard', qty: 1, price: 99.5 },
      { sku: 'MS-02', name: 'Wireless mouse', qty: 1, price: 30 },
    ],
    shippedAt: '2026-10-07T09:24:00Z',
    notes: null,
  },
  null,
  2,
);

function analyse(value: unknown): { keys: number; depth: number } {
  if (value === null || typeof value !== 'object') return { keys: 0, depth: 0 };
  const children = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
  let keys = Array.isArray(value) ? 0 : children.length;
  let depth = 0;
  for (const child of children) {
    const r = analyse(child);
    keys += r.keys;
    depth = Math.max(depth, r.depth);
  }
  return { keys, depth: depth + 1 };
}

const sortKeysDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, sortKeysDeep(obj[k])]));
  }
  return value;
};

const formatBytes = (str: string) => {
  const bytes = new Blob([str]).size;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
};

export const JSONTools = () => {
  const toast = useToast();
  const { copy } = useClipboard();
  const { resolvedMode } = useTheme();

  const [tabs, setTabs] = useLocalStorage<TabData[]>('json-tools-tabs', [DEFAULT_TAB]);
  const [activeTabId, setActiveTabId] = useLocalStorage<string>('json-tools-active-tab', 'tab-1');
  const [isTreeView, setIsTreeView] = useState(false);
  const [treeExpanded, setTreeExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<MonacoEditor | null>(null);

  // Never leave the editor without a tab
  useEffect(() => {
    if (!tabs || tabs.length === 0) {
      const tab = { ...DEFAULT_TAB, id: `tab-${Date.now()}` };
      setTabs([tab]);
      setActiveTabId(tab.id);
    } else if (!tabs.find((t) => t.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId, setTabs, setActiveTabId]);

  useEffect(() => setCursorPos({ line: 1, column: 1 }), [activeTabId]);

  const activeTab = tabs?.find((t) => t.id === activeTabId) || tabs?.[0] || DEFAULT_TAB;
  const input = activeTab.content;

  const stats = useMemo(() => {
    if (!input.trim()) return { valid: true, empty: true, error: null as string | null, line: undefined as number | undefined, keys: 0, depth: 0, parsed: undefined as unknown };
    const v = validateJSON(input);
    if (!v.valid) return { valid: false, empty: false, error: v.error ?? 'Invalid JSON', line: v.line, keys: 0, depth: 0, parsed: undefined };
    const parsed = JSON.parse(input) as unknown;
    return { valid: true, empty: false, error: null, line: undefined, ...analyse(parsed), parsed };
  }, [input]);

  const setInput = (content: string) =>
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, content, isUnsaved: true } : t)));

  // ── Tabs ────────────────────────────────────────────────────────────────
  const handleNewTab = (content = '', name?: string) => {
    const id = `tab-${Date.now()}`;
    setTabs((prev) => [...prev, { id, name: name ?? `Untitled-${prev.length + 1}.json`, content, isPinned: false, isUnsaved: false }]);
    setActiveTabId(id);
  };

  const handleCloseTab = (id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length > 0 && id === activeTabId) {
        const index = prev.findIndex((t) => t.id === id);
        setActiveTabId(next[index === prev.length - 1 ? index - 1 : index].id);
      }
      return next;
    });
  };

  const handleCloseOthers = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id === id || t.isPinned));
    setActiveTabId(id);
  };

  const handleDuplicateTab = (id: string) => {
    const source = tabs.find((t) => t.id === id);
    if (!source) return;
    const newId = `tab-${Date.now()}`;
    setTabs((prev) => [...prev, { ...source, id: newId, name: `${source.name} (Copy)` }]);
    setActiveTabId(newId);
  };

  const saveTab = () => {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, isUnsaved: false } : t)));
    toast.success('Saved');
  };

  // ── Actions ─────────────────────────────────────────────────────────────
  const transform = (fn: (s: string) => string, success: string, failure = 'Invalid JSON') => {
    if (!input.trim()) return toast.info('The editor is empty');
    try {
      setInput(fn(input));
      toast.success(success);
    } catch {
      toast.error(failure);
    }
  };

  const handleFormat = () => transform(formatJSON, 'JSON formatted');
  const handleMinify = () => transform(minifyJSON, 'JSON minified');
  const handleSortKeys = () => transform((s) => JSON.stringify(sortKeysDeep(JSON.parse(s)), null, 2), 'Keys sorted');
  const handleRepair = () => transform(repairJSON, 'JSON auto-repaired', 'Could not auto-repair this JSON');

  const handleValidate = () => {
    const result = validateJSON(input);
    if (result.valid) toast.success('Valid JSON');
    else {
      toast.error(`Invalid JSON${result.line ? ` on line ${result.line}` : ''}`);
      jumpToError();
    }
  };

  const handleCopy = () => void copy(input, 'JSON copied');

  const handleDownload = () => {
    if (!input) return toast.info('The editor is empty');
    const url = URL.createObjectURL(new Blob([input], { type: 'application/json' }));
    const name = activeTab.name.endsWith('.json') ? activeTab.name : `${activeTab.name}.json`;
    Object.assign(document.createElement('a'), { href: url, download: name }).click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${name}`);
  };

  const handleClear = () => {
    setInput('');
    toast.info('Editor cleared');
  };

  const handleOpenFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    handleNewTab(text, file.name);
    toast.success(`Opened ${file.name}`);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => toast.error('Fullscreen is not available'));
    } else {
      void document.exitFullscreen();
    }
  };

  const jumpToError = () => {
    const editor = editorRef.current;
    if (!editor || !stats.line) return;
    setIsTreeView(false);
    editor.revealLineInCenter(stats.line);
    editor.setPosition({ lineNumber: stats.line, column: 1 });
    editor.focus();
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Keyboard shortcuts (unchanged from the previous version)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 't') {
          e.preventDefault();
          handleNewTab();
          return;
        }
        if (key === 'w') {
          e.preventDefault();
          handleCloseTab(activeTabId);
          return;
        }
        if (key === 's') {
          e.preventDefault();
          saveTab();
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          const i = tabs.findIndex((t) => t.id === activeTabId);
          if (i === -1) return;
          setActiveTabId(tabs[(i + (e.shiftKey ? -1 : 1) + tabs.length) % tabs.length].id);
          return;
        }
      }
      if (e.altKey && e.shiftKey) {
        const actions: Record<string, () => void> = {
          f: handleFormat,
          m: handleMinify,
          v: handleValidate,
          r: handleRepair,
          s: handleSortKeys,
          c: handleCopy,
          d: handleDownload,
          x: handleClear,
          t: () => setIsTreeView((v) => !v),
          enter: toggleFullscreen,
        };
        const action = actions[e.key.toLowerCase()];
        if (action) {
          e.preventDefault();
          action();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, tabs, activeTabId]);

  usePaletteActions([
    { id: 'format', title: 'Format JSON', icon: Wand2, keywords: ['prettify', 'beautify', 'indent'], shortcut: 'alt+shift+f', run: handleFormat },
    { id: 'minify', title: 'Minify JSON', icon: Minimize2, keywords: ['compact', 'compress'], shortcut: 'alt+shift+m', run: handleMinify },
    { id: 'sort', title: 'Sort keys', icon: ArrowDownAZ, keywords: ['alphabetical', 'order'], shortcut: 'alt+shift+s', run: handleSortKeys },
    { id: 'validate', title: 'Validate JSON', icon: CheckCircle2, keywords: ['check', 'lint'], shortcut: 'alt+shift+v', run: handleValidate },
    { id: 'repair', title: 'Auto-repair JSON', icon: Wrench, keywords: ['fix', 'broken'], shortcut: 'alt+shift+r', run: handleRepair },
    { id: 'copy', title: 'Copy JSON', icon: Copy, keywords: ['clipboard'], shortcut: 'alt+shift+c', run: handleCopy },
    { id: 'tree', title: isTreeView ? 'Show code editor' : 'Show tree view', icon: Network, keywords: ['tree', 'explore', 'code'], shortcut: 'alt+shift+t', run: () => setIsTreeView((v) => !v) },
    { id: 'new-tab', title: 'New tab', icon: Plus, keywords: ['tab', 'blank'], run: () => handleNewTab() },
    { id: 'open', title: 'Open file…', icon: FolderOpen, keywords: ['upload', 'load', 'import'], run: () => fileRef.current?.click() },
    { id: 'download', title: 'Download JSON', icon: Download, keywords: ['save', 'export'], shortcut: 'alt+shift+d', run: handleDownload },
    { id: 'fullscreen', title: isFullscreen ? 'Exit fullscreen' : 'Fullscreen', icon: isFullscreen ? Minimize : Maximize, keywords: ['zen', 'focus'], shortcut: 'alt+shift+enter', run: toggleFullscreen },
    { id: 'clear', title: 'Clear editor', icon: Trash2, keywords: ['empty', 'reset', 'delete'], shortcut: 'alt+shift+x', run: handleClear },
  ]);

  const toolbar = (
    <div className="flex items-center gap-0.5">
      <IconButton label="Format" shortcut="alt+shift+f" size="sm" onClick={handleFormat}>
        <Wand2 />
      </IconButton>
      <IconButton label="Minify" shortcut="alt+shift+m" size="sm" onClick={handleMinify}>
        <Minimize2 />
      </IconButton>
      <IconButton label="Sort keys" shortcut="alt+shift+s" size="sm" onClick={handleSortKeys}>
        <ArrowDownAZ />
      </IconButton>
      <IconButton label="Validate" shortcut="alt+shift+v" size="sm" onClick={handleValidate}>
        <CheckCircle2 />
      </IconButton>
      <IconButton label="Auto-repair" shortcut="alt+shift+r" size="sm" onClick={handleRepair}>
        <Wrench />
      </IconButton>
      <span className="mx-1 h-4 w-px bg-border" />
      <IconButton label="Copy" shortcut="alt+shift+c" size="sm" onClick={handleCopy}>
        <Copy />
      </IconButton>
      <IconButton label="Open file" size="sm" className="hidden sm:inline-flex" onClick={() => fileRef.current?.click()}>
        <FolderOpen />
      </IconButton>
      <IconButton label="Download" shortcut="alt+shift+d" size="sm" className="hidden sm:inline-flex" onClick={handleDownload}>
        <Download />
      </IconButton>
      <IconButton label="Clear" shortcut="alt+shift+x" size="sm" className="hover:text-destructive" onClick={handleClear}>
        <Trash2 />
      </IconButton>
      <span className="mx-1 h-4 w-px bg-border" />
      <IconButton label="Tree view" shortcut="alt+shift+t" size="sm" active={isTreeView} onClick={() => setIsTreeView((v) => !v)}>
        <Network />
      </IconButton>
      <IconButton label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} shortcut="alt+shift+enter" size="sm" onClick={toggleFullscreen}>
        {isFullscreen ? <Minimize /> : <Maximize />}
      </IconButton>
      <input ref={fileRef} type="file" accept=".json,application/json,.txt" className="hidden" onChange={(e) => void handleOpenFile(e.target.files?.[0])} />
    </div>
  );

  const treeStyles = resolvedMode === 'dark' ? darkStyles : defaultStyles;

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col overflow-hidden bg-background">
      <JSONTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabsReorder={setTabs}
        onTabSelect={setActiveTabId}
        onTabClose={handleCloseTab}
        onTabCloseOthers={handleCloseOthers}
        onTabDuplicate={handleDuplicateTab}
        onTabPinToggle={(id) => setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, isPinned: !t.isPinned } : t)))}
        onTabRename={(id, name) => setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))}
        onNewTab={() => handleNewTab()}
        rightElement={toolbar}
      />

      <div className="relative min-h-0 flex-1 bg-surface-1">
        {isTreeView ? (
          <div className="h-full overflow-auto p-4">
            {stats.parsed !== null && typeof stats.parsed === 'object' ? (
              <>
                <div className="mb-3 flex gap-2">
                  <Button size="xs" variant="secondary" onClick={() => setTreeExpanded((v) => !v)}>
                    {treeExpanded ? 'Collapse all' : 'Expand all'}
                  </Button>
                </div>
                <JsonView
                  key={String(treeExpanded)}
                  data={stats.parsed as object}
                  shouldExpandNode={treeExpanded ? allExpanded : (level) => level < 2}
                  style={{ ...treeStyles, container: 'json-tree-theme' }}
                />
              </>
            ) : (
              <EmptyState
                icon={<Network />}
                title={stats.empty ? 'Nothing to show yet' : 'Tree view needs valid JSON'}
                hint={stats.empty ? 'Paste some JSON into the editor.' : stats.error}
              />
            )}
          </div>
        ) : (
          <>
            <Editor
              path={activeTab.id}
              value={input}
              onChange={setInput}
              language="json"
              placeholder="Paste or type JSON…"
              onCursorChange={(line, column) => setCursorPos({ line, column })}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
            />
            <AnimatePresence>
              {stats.empty && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center"
                >
                  <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-popover/90 p-1.5 pl-3 text-xs text-muted-foreground shadow-popover backdrop-blur">
                    Empty tab —
                    <Button size="xs" variant="subtle" onClick={() => setInput(SAMPLE)}>
                      Load sample
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => fileRef.current?.click()}>
                      Open file
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Status bar */}
      <div className="flex h-7 shrink-0 select-none items-center justify-between gap-3 border-t border-border-subtle bg-background px-3 text-2xs text-muted-foreground">
        <span className="truncate">{activeTab.name}</span>
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <span className="hidden md:inline">{isTreeView ? 'JSON · Tree' : 'JSON'}</span>
          <span className="hidden md:inline">UTF-8</span>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.column}
          </span>
          <span className="hidden sm:inline">{formatBytes(input)}</span>
          {stats.valid && !stats.empty && (
            <span className="hidden sm:inline">
              {stats.keys} keys · depth {stats.depth}
            </span>
          )}
          {stats.empty ? null : stats.valid ? (
            <span className="flex items-center gap-1 text-success">
              <CheckCircle2 className="h-3 w-3" />
              Valid
            </span>
          ) : (
            <button
              onClick={jumpToError}
              title={stats.error ?? undefined}
              className={cn('flex items-center gap-1 rounded px-1 font-medium text-destructive transition-colors hover:bg-destructive/10')}
            >
              <XCircle className="h-3 w-3" />
              Invalid{stats.line ? ` · line ${stats.line}` : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
