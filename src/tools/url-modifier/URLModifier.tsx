import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowDown,
  ClipboardPaste,
  Copy,
  CornerDownRight,
  Eraser,
  ExternalLink,
  Globe,
  Hash,
  History,
  Link as LinkIcon,
  ListTree,
  Pencil,
  Plus,
  RefreshCw,
  Route,
  Sparkles,
  Trash2,
  Workflow,
  X,
} from 'lucide-react';
import { usePaletteActions } from '../../app/paletteActions';
import { Badge, Button, Card, CardHeader, CopyButton, IconButton, ToolHeader, cn } from '../../components/ui';
import { useClipboard } from '../../hooks/useClipboard';
import { useSessionState } from '../../hooks/useSessionState';
import { useToast } from '../../context/ToastContext';
import {
  DEFAULT_RULES,
  MAGIC_TOKENS,
  parseUrl,
  tokensByTag,
  transformUrlDetailed,
  urlSegments,
  withSourceParams,
  type GeneratedToken,
  type HistoryItem,
  type Rule,
  type SegmentKind,
} from './urlLogic';

const listItem = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -12, transition: { duration: 0.12 } },
};

const SEGMENT_CLASS: Record<SegmentKind, string> = {
  protocol: 'text-muted-foreground',
  host: 'font-semibold text-primary',
  path: 'text-foreground',
  punct: 'text-muted-foreground/70',
  key: 'text-amber-700 dark:text-warning',
  value: 'text-foreground/90',
  token: 'rounded-sm bg-primary/15 text-primary ring-1 ring-inset ring-primary/25',
  hash: 'italic text-muted-foreground',
};

/** Grows a textarea with its content (and on width changes, which re-wrap long URLs). */
function useAutosize(ref: RefObject<HTMLTextAreaElement>, value: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, value]);
}

export const URLModifier = () => {
  const toast = useToast();
  const { copy } = useClipboard();
  const [inputUrl, setInputUrl] = useSessionState('url-mod-input', '');
  const [outputUrl, setOutputUrl] = useSessionState('url-mod-output', '');
  const [rules, setRules] = useSessionState<Rule[]>('url-mod-rules', DEFAULT_RULES);
  const [history, setHistory] = useSessionState<HistoryItem[]>('url-mod-history', []);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, number>>({});
  const [tokens, setTokens] = useState<GeneratedToken[]>([]);
  const [editingRaw, setEditingRaw] = useState(false);

  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const rawRef = useRef<HTMLTextAreaElement>(null);
  useAutosize(sourceRef, inputUrl);
  useAutosize(rawRef, editingRaw ? outputUrl : '');

  // Token IDs stay put unless the source URL itself changes or the user asks for fresh ones,
  // so toggling a rule or editing a query param doesn't swap out IDs that may already be copied.
  const tokensRef = useRef<GeneratedToken[]>([]);
  const lastInputRef = useRef<string | null>(null);
  const keepTokensRef = useRef(false);

  const process = useCallback(
    (fresh = false) => {
      if (!inputUrl.trim()) {
        setOutputUrl('');
        setError(null);
        setMatches({});
        setTokens([]);
        return;
      }
      try {
        const keep = !fresh && (keepTokensRef.current || lastInputRef.current === inputUrl);
        keepTokensRef.current = false;
        lastInputRef.current = inputUrl;
        const result = transformUrlDetailed(inputUrl, rules, keep ? tokensByTag(tokensRef.current) : undefined);
        tokensRef.current = result.tokens;
        setOutputUrl(result.url);
        setMatches(result.matches);
        setTokens(result.tokens);
        setError(null);
      } catch {
        setError('This doesn’t look like a valid URL — check the protocol and domain.');
        setOutputUrl('');
        setMatches({});
        setTokens([]);
      }
    },
    [inputUrl, rules, setOutputUrl],
  );

  useEffect(() => process(), [process]);
  const regenerate = () => process(true);

  const addToHistory = useCallback(
    (original: string, modified: string) => {
      if (!original || !modified) return;
      setHistory((prev) => {
        if (prev[0]?.original === original && prev[0]?.modified === modified) return prev;
        const item: HistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          original,
          modified,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        return [item, ...prev.filter((h) => h.original !== original)].slice(0, 10);
      });
    },
    [setHistory],
  );

  // Auto-save to history after a short pause
  useEffect(() => {
    if (!inputUrl || !outputUrl || error) return;
    const t = setTimeout(() => addToHistory(inputUrl, outputUrl), 1200);
    return () => clearTimeout(t);
  }, [inputUrl, outputUrl, error, addToHistory]);

  const parsed = useMemo(() => (outputUrl ? parseUrl(outputUrl) : null), [outputUrl]);
  const tokenIds = useMemo(() => tokens.map((t) => t.id), [tokens]);
  const segments = useMemo(() => urlSegments(outputUrl, tokenIds), [outputUrl, tokenIds]);

  // Param edits are written back to the source (keeping its magic tokens); the result follows from it
  const updateParams = (params: { key: string; val: string }[]) => {
    keepTokensRef.current = true;
    setInputUrl(withSourceParams(inputUrl, params, tokens));
  };

  const updateRule = <K extends keyof Rule>(id: string, key: K, value: Rule[K]) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const addRule = () => setRules((prev) => [...prev, { id: Date.now().toString(), find: '', replace: '', active: true }]);

  const copyOutput = () => {
    if (!outputUrl) return;
    void copy(outputUrl, 'Modified URL copied');
    addToHistory(inputUrl, outputUrl);
  };

  const openOutput = () => {
    if (!outputUrl) return;
    addToHistory(inputUrl, outputUrl);
    window.open(outputUrl, '_blank', 'noopener');
  };

  const pasteSource = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) return toast.info('The clipboard is empty');
      setInputUrl(text);
      setEditingRaw(false);
    } catch {
      toast.error('Clipboard access was blocked — paste with Ctrl+V instead');
    }
  };

  const clearSource = () => {
    setInputUrl('');
    setEditingRaw(false);
    sourceRef.current?.focus();
  };

  const activeRules = rules.filter((r) => r.active && r.find);
  const appliedRules = activeRules.filter((r) => (matches[r.id] ?? 0) > 0);
  const hasResult = !!outputUrl && !error;

  usePaletteActions([
    ...(hasResult
      ? [
          { id: 'copy', title: 'Copy modified URL', icon: Copy, keywords: ['clipboard', 'output'], run: copyOutput },
          { id: 'open', title: 'Open modified URL in new tab', icon: ExternalLink, keywords: ['browser', 'launch', 'visit'], run: openOutput },
          ...(tokens.length ? [{ id: 'regen', title: 'Regenerate token IDs', icon: RefreshCw, keywords: ['uuid', 'refresh', 'new'], run: regenerate }] : []),
          { id: 'raw', title: editingRaw ? 'Show highlighted URL' : 'Edit modified URL as text', icon: Pencil, keywords: ['raw', 'edit'], run: () => setEditingRaw((v) => !v) },
        ]
      : []),
    { id: 'paste', title: 'Paste URL from clipboard', icon: ClipboardPaste, keywords: ['source', 'input'], run: () => void pasteSource() },
    { id: 'add-rule', title: 'Add rewrite rule', icon: Plus, keywords: ['find', 'replace', 'host'], run: addRule },
    ...(inputUrl ? [{ id: 'clear', title: 'Clear source URL', icon: Eraser, keywords: ['empty', 'reset'], run: clearSource }] : []),
  ]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:p-6">
        <ToolHeader icon={<LinkIcon />} title="URL Modifier" description="Rewrite hosts, fill in token IDs and tweak query parameters" />

        {/* ── Source → Result ──────────────────────────────────── */}
        <Card
          className={cn(
            'relative overflow-hidden transition-[border-color,box-shadow] duration-300',
            error ? 'border-destructive/40' : hasResult && 'border-primary/30 shadow-glow-sm',
          )}
        >
          <AnimatePresence>
            {hasResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
              />
            )}
          </AnimatePresence>

          <section className="p-4 md:p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="url-source" className="label-caps">
                Source URL
              </label>
              <div className="flex items-center gap-0.5">
                <Button size="xs" variant="ghost" onClick={() => void pasteSource()}>
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Paste
                </Button>
                <IconButton label="Clear" size="sm" onClick={clearSource} disabled={!inputUrl}>
                  <Eraser />
                </IconButton>
              </div>
            </div>
            <textarea
              id="url-source"
              ref={sourceRef}
              rows={1}
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onPaste={(e) => {
                // Pasting replaces the whole field — the usual workflow is "paste a fresh URL"
                e.preventDefault();
                setInputUrl(e.clipboardData.getData('text').trim());
              }}
              spellCheck={false}
              placeholder="Paste a URL — e.g. https://dc.biobrain.io/app/items?token=[#token#]"
              className={cn(
                'block min-h-[52px] w-full resize-none overflow-hidden break-all rounded-lg border bg-background px-3.5 py-3 font-mono text-13 leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60',
                'focus:border-primary/50 focus:ring-2 focus:ring-primary/15',
                error ? 'border-destructive/50' : 'border-border',
              )}
            />
          </section>

          {/* Pipeline: what happened between source and result */}
          <div className="flex items-center gap-3 border-y border-border-subtle bg-surface-2/50 px-4 py-2.5 md:px-5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface-1 text-muted-foreground">
              <ArrowDown className="h-3.5 w-3.5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-xs">
              <AnimatePresence mode="popLayout" initial={false}>
                {!inputUrl.trim() ? (
                  <motion.span key="idle" {...listItem} className="text-muted-foreground">
                    Paste a URL to rewrite it
                  </motion.span>
                ) : error ? (
                  <motion.span key="error" {...listItem} className="text-destructive">
                    Can’t rewrite an invalid URL
                  </motion.span>
                ) : (
                  <>
                    {appliedRules.map((r) => (
                      <motion.span
                        key={r.id}
                        layout
                        {...listItem}
                        className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 font-mono text-success"
                      >
                        <span className="truncate">{hostLabel(r.find)}</span>
                        <span aria-hidden>→</span>
                        <span className="truncate">{hostLabel(r.replace) || '∅'}</span>
                        {matches[r.id] > 1 && <span className="opacity-70">×{matches[r.id]}</span>}
                      </motion.span>
                    ))}
                    {tokens.length > 0 && (
                      <motion.span
                        key="tokens"
                        layout
                        {...listItem}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-primary"
                      >
                        <Sparkles className="h-3 w-3" />
                        {tokens.length} token ID{tokens.length === 1 ? '' : 's'} generated
                      </motion.span>
                    )}
                    {appliedRules.length === 0 && tokens.length === 0 && (
                      <motion.span key="none" {...listItem} className="text-muted-foreground">
                        No rules matched — the URL passes through unchanged
                      </motion.span>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <section className="p-4 md:p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="label-caps flex items-center gap-2">
                Result
                <span className="inline-flex items-center gap-1.5 font-sans text-2xs font-medium normal-case tracking-normal text-muted-foreground">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      error ? 'bg-destructive' : hasResult ? 'animate-pulse-dot bg-success' : 'bg-muted-foreground/50',
                    )}
                  />
                  {error ? 'Error' : hasResult ? 'Live' : 'Waiting'}
                </span>
              </span>
              {hasResult && (
                <div className="flex items-center gap-0.5">
                  {tokens.length > 0 && (
                    <IconButton label="Regenerate token IDs" size="sm" onClick={regenerate}>
                      <RefreshCw />
                    </IconButton>
                  )}
                  <IconButton label={editingRaw ? 'Show highlighted' : 'Edit as text'} size="sm" active={editingRaw} onClick={() => setEditingRaw((v) => !v)}>
                    <Pencil />
                  </IconButton>
                </div>
              )}
            </div>

            {error ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-13 text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : !hasResult ? (
              <div className="rounded-lg border border-dashed border-border px-3.5 py-3 font-mono text-13 text-muted-foreground/70">
                The rewritten URL will appear here
              </div>
            ) : editingRaw ? (
              <textarea
                ref={rawRef}
                rows={1}
                value={outputUrl}
                onChange={(e) => setOutputUrl(e.target.value)}
                spellCheck={false}
                aria-label="Modified URL"
                autoFocus
                className="block w-full resize-none overflow-hidden break-all rounded-lg border border-primary/40 bg-background px-3.5 py-3 font-mono text-13 leading-relaxed text-foreground outline-none ring-2 ring-primary/15"
              />
            ) : (
              <div
                className="cursor-text select-all break-all rounded-lg border border-border-subtle bg-background/60 px-3.5 py-3 font-mono text-13 leading-relaxed"
                onDoubleClick={() => setEditingRaw(true)}
                title="Double-click to edit"
              >
                {segments.map((seg, i) =>
                  seg.kind === 'token' ? (
                    <motion.span
                      key={`${i}-${seg.text}`}
                      initial={{ opacity: 0, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 0.35 }}
                      className={SEGMENT_CLASS.token}
                    >
                      {seg.text}
                    </motion.span>
                  ) : (
                    <span key={i} className={SEGMENT_CLASS[seg.kind]}>
                      {seg.text}
                    </span>
                  ),
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button onClick={copyOutput} disabled={!hasResult}>
                <Copy className="h-4 w-4" />
                Copy URL
              </Button>
              <Button variant="secondary" onClick={openOutput} disabled={!hasResult}>
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </Button>
              {hasResult && (
                <span className="ml-auto hidden text-xs tabular-nums text-muted-foreground sm:inline">
                  {outputUrl.length} chars · {parsed?.params.length ?? 0} param{parsed?.params.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </section>
        </Card>

        {/* ── Details ─────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card className="overflow-hidden">
              <CardHeader
                icon={<ListTree />}
                title="Query parameters"
                description={parsed ? `${parsed.params.length} param${parsed.params.length === 1 ? '' : 's'} · edits update the URL` : 'Available once there’s a valid result'}
                actions={
                  parsed && (
                    <Button size="xs" variant="subtle" onClick={() => updateParams([...parsed.params, { key: 'param', val: '' }])}>
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  )
                }
              />
              {parsed && parsed.params.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  <div className="sticky top-0 z-[1] grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_64px] border-b border-border-subtle bg-surface-1 px-4 py-1.5 text-2xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    <span>Key</span>
                    <span className="pl-3">Value</span>
                  </div>
                  <ul className="divide-y divide-border-subtle">
                    {parsed.params.map((p, i) => (
                      <li
                        key={i}
                        className="group grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_64px] items-center px-4 transition-colors focus-within:bg-surface-2 hover:bg-surface-2/60"
                      >
                        <input
                          value={p.key}
                          onChange={(e) => updateParams(parsed.params.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}
                          aria-label="Parameter name"
                          spellCheck={false}
                          className="min-w-0 bg-transparent py-2.5 pr-3 font-mono text-xs font-medium text-amber-700 outline-none dark:text-warning"
                        />
                        <input
                          value={p.val}
                          onChange={(e) => updateParams(parsed.params.map((x, j) => (j === i ? { ...x, val: e.target.value } : x)))}
                          aria-label={`Value of ${p.key}`}
                          spellCheck={false}
                          placeholder="(empty)"
                          className={cn(
                            'min-w-0 border-l border-border-subtle bg-transparent py-2.5 pl-3 font-mono text-xs outline-none placeholder:text-muted-foreground/50',
                            tokenIds.includes(p.val) ? 'text-primary' : 'text-foreground',
                          )}
                        />
                        <div className="flex justify-end opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <CopyButton value={p.val} message={`Copied ${p.key}`} />
                          <IconButton
                            label="Remove parameter"
                            size="sm"
                            className="hover:text-destructive"
                            onClick={() => updateParams(parsed.params.filter((_, j) => j !== i))}
                          >
                            <X />
                          </IconButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  {parsed ? 'This URL has no query parameters.' : 'Paste a URL above to inspect its parameters.'}
                </p>
              )}
            </Card>

            <AnimatePresence initial={false}>
              {parsed && (
                <motion.div
                  {...listItem}
                  className={cn(
                    'grid gap-3',
                    parsed.hash ? 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,0.8fr)]' : 'sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]',
                  )}
                >
                  <PartTile icon={<Globe />} label="Origin" value={`${parsed.protocol}//${parsed.host}`} />
                  <PartTile icon={<Route />} label="Path" value={parsed.path || '/'} />
                  {parsed.hash && <PartTile icon={<Hash />} label="Fragment" value={parsed.hash} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <Card>
              <CardHeader
                icon={<Workflow />}
                title="Rewrite rules"
                description={`${activeRules.length} active · ${appliedRules.length} matched · top to bottom`}
                actions={
                  <Button size="xs" variant="subtle" onClick={addRule}>
                    <Plus className="h-3.5 w-3.5" />
                    Add rule
                  </Button>
                }
              />
              <ul className="space-y-1 p-2">
                <AnimatePresence initial={false}>
                  {rules.map((rule) => {
                    const count = matches[rule.id] ?? 0;
                    const status = !rule.active || !rule.find ? 'off' : count > 0 ? 'matched' : 'idle';
                    return (
                      <motion.li
                        key={rule.id}
                        layout
                        {...listItem}
                        className={cn(
                          'group relative rounded-lg border px-2.5 py-2 transition-colors',
                          status === 'matched' ? 'border-success/25 bg-success/[0.04]' : 'border-transparent hover:bg-surface-2',
                          'focus-within:border-border focus-within:bg-surface-2',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            role="switch"
                            aria-checked={rule.active}
                            aria-label={rule.active ? 'Disable rule' : 'Enable rule'}
                            onClick={() => updateRule(rule.id, 'active', !rule.active)}
                            className={cn(
                              'focus-ring relative h-4 w-7 shrink-0 rounded-full transition-colors',
                              rule.active ? 'bg-primary' : 'bg-surface-3 ring-1 ring-inset ring-border-strong',
                            )}
                          >
                            <motion.span
                              layout
                              transition={{ type: 'spring', stiffness: 700, damping: 35 }}
                              className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white shadow', rule.active ? 'right-0.5' : 'left-0.5')}
                            />
                          </button>
                          <input
                            value={rule.find}
                            onChange={(e) => updateRule(rule.id, 'find', e.target.value)}
                            placeholder="Find…"
                            aria-label="Find"
                            spellCheck={false}
                            className={cn(
                              'h-7 min-w-0 flex-1 rounded bg-transparent px-1.5 font-mono text-xs outline-none placeholder:text-muted-foreground/60 focus:bg-background',
                              rule.active ? 'text-foreground' : 'text-muted-foreground line-through',
                            )}
                          />
                          {status === 'matched' && (
                            <Badge tone="success" className="h-[18px] px-1.5">
                              {count > 1 ? `${count}×` : 'matched'}
                            </Badge>
                          )}
                          <IconButton
                            label="Remove rule"
                            size="sm"
                            className="-my-1 opacity-0 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                            onClick={() => setRules((prev) => prev.filter((r) => r.id !== rule.id))}
                          >
                            <X />
                          </IconButton>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 pl-[2.1rem]">
                          <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                          <input
                            value={rule.replace}
                            onChange={(e) => updateRule(rule.id, 'replace', e.target.value)}
                            placeholder="Replace with…"
                            aria-label="Replace with"
                            spellCheck={false}
                            className={cn(
                              'h-7 min-w-0 flex-1 rounded bg-transparent px-1.5 font-mono text-xs outline-none placeholder:text-muted-foreground/60 focus:bg-background',
                              rule.active ? 'text-primary' : 'text-muted-foreground line-through',
                            )}
                          />
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
                {rules.length === 0 && <li className="px-2 py-4 text-center text-xs text-muted-foreground">No rules — URLs pass through unchanged.</li>}
              </ul>
              <div className="border-t border-border-subtle px-4 py-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Magic tokens
                  <span className="font-normal text-muted-foreground">— each becomes a fresh UUIDv7</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MAGIC_TOKENS.map((t) => (
                    <button
                      key={t}
                      onClick={() => void copy(t, `${t} copied`)}
                      title="Copy token"
                      className="focus-ring rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary transition-colors hover:bg-primary/20"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<History />}
                title="History"
                description="Last 10 · saved after a short pause"
                actions={
                  history.length > 0 && (
                    <IconButton label="Clear history" size="sm" className="hover:text-destructive" onClick={() => setHistory([])}>
                      <Trash2 />
                    </IconButton>
                  )
                }
              />
              {history.length ? (
                <ul className="max-h-80 space-y-0.5 overflow-y-auto p-2">
                  <AnimatePresence initial={false}>
                    {history.map((item) => (
                      <motion.li key={item.id} layout {...listItem} className="group relative flex items-center gap-1 rounded-md transition-colors hover:bg-surface-2">
                        <button
                          onClick={() => {
                            setInputUrl(item.original);
                            setEditingRaw(false);
                            toast.info('Restored to editor');
                          }}
                          title="Restore this URL"
                          className="focus-ring min-w-0 flex-1 rounded-md px-2.5 py-2 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="truncate font-mono text-xs font-medium text-foreground">{item.modified}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="truncate font-mono text-2xs text-muted-foreground">{item.original}</span>
                            <span className="ml-auto shrink-0 font-mono text-2xs tabular-nums text-muted-foreground/70">{item.timestamp}</span>
                          </div>
                        </button>
                        <CopyButton value={item.modified} message="Copied from history" className="mr-1 opacity-60 group-hover:opacity-100" />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              ) : (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">Rewritten URLs will appear here.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

/** "https://dc.biobrain.io/x" → "dc.biobrain.io/x" for compact rule chips. */
function hostLabel(value: string): string {
  return value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
}

function PartTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="hairline group min-w-0 rounded-lg border border-border bg-surface-1 px-3.5 py-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="label-caps flex items-center gap-1.5 [&_svg]:h-3 [&_svg]:w-3">
          {icon}
          {label}
        </span>
        {value && <CopyButton value={value} message={`${label} copied`} className="-my-1.5 -mr-1.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" />}
      </div>
      <div className="break-all font-mono text-13 leading-relaxed text-foreground">{value}</div>
    </div>
  );
}
