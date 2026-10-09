import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  History,
  Link as LinkIcon,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  Workflow,
  X,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, CopyButton, IconButton, Textarea, ToolHeader, cn } from '../../components/ui';
import { useClipboard } from '../../hooks/useClipboard';
import { useSessionState } from '../../hooks/useSessionState';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_RULES, MAGIC_TOKENS, parseUrl, transformUrl, withParams, type HistoryItem, type Rule } from './urlLogic';

const listItem = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -12, transition: { duration: 0.12 } },
};

export const URLModifier = () => {
  const toast = useToast();
  const { copy } = useClipboard();
  const [inputUrl, setInputUrl] = useSessionState('url-mod-input', '');
  const [outputUrl, setOutputUrl] = useSessionState('url-mod-output', '');
  const [rules, setRules] = useSessionState<Rule[]>('url-mod-rules', DEFAULT_RULES);
  const [history, setHistory] = useSessionState<HistoryItem[]>('url-mod-history', []);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback(() => {
    if (!inputUrl.trim()) {
      setOutputUrl('');
      setError(null);
      return;
    }
    try {
      setOutputUrl(transformUrl(inputUrl, rules));
      setError(null);
    } catch {
      setError('Invalid URL — check the protocol and domain.');
      setOutputUrl('');
    }
  }, [inputUrl, rules, setOutputUrl]);

  useEffect(process, [process]);

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

  const updateParams = (params: { key: string; val: string }[]) => {
    try {
      const next = withParams(outputUrl, params);
      setOutputUrl(next);
      // Keep the source in sync so the query edits survive further rule changes
      try {
        const src = new URL(inputUrl);
        src.search = new URL(next).search;
        setInputUrl(src.toString());
      } catch {
        setInputUrl(next);
      }
    } catch {
      /* output isn't a valid URL — ignore */
    }
  };

  const updateRule = <K extends keyof Rule>(id: string, key: K, value: Rule[K]) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const activeRules = rules.filter((r) => r.active && r.find).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:p-6">
        <ToolHeader
          icon={<LinkIcon />}
          title="URL Modifier"
          description="Rewrite hosts with rules, edit query params and generate token IDs"
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {/* ── Left: source + rules ───────────────────────────── */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader
                icon={<LinkIcon />}
                title="Original URL"
                description="Paste replaces the whole field"
                actions={
                  <IconButton label="Clear" size="sm" onClick={() => setInputUrl('')} disabled={!inputUrl}>
                    <Trash2 />
                  </IconButton>
                }
              />
              <div className="p-4">
                <Textarea
                  mono
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    setInputUrl(e.clipboardData.getData('text'));
                  }}
                  aria-label="Original URL"
                  placeholder="https://api.example.com/v1/items?token=[#token#]"
                  className="min-h-[112px] text-13"
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<Workflow />}
                title="Rewrite rules"
                description={`${activeRules} active · applied top to bottom`}
                actions={
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={() => setRules((prev) => [...prev, { id: Date.now().toString(), find: '', replace: '', active: true }])}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add rule
                  </Button>
                }
              />
              <ul className="space-y-1 p-2">
                <AnimatePresence initial={false}>
                  {rules.map((rule) => (
                    <motion.li
                      key={rule.id}
                      layout
                      {...listItem}
                      className="group flex items-center gap-2 rounded-md px-2 py-1 transition-colors focus-within:bg-surface-2 hover:bg-surface-2"
                    >
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
                          'h-8 min-w-0 flex-1 rounded bg-transparent px-1.5 font-mono text-xs outline-none placeholder:text-muted-foreground/60 focus:bg-background',
                          rule.active ? 'text-foreground' : 'text-muted-foreground line-through',
                        )}
                      />
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <input
                        value={rule.replace}
                        onChange={(e) => updateRule(rule.id, 'replace', e.target.value)}
                        placeholder="Replace with…"
                        aria-label="Replace with"
                        spellCheck={false}
                        className={cn(
                          'h-8 min-w-0 flex-1 rounded bg-transparent px-1.5 font-mono text-xs outline-none placeholder:text-muted-foreground/60 focus:bg-background',
                          rule.active ? 'text-primary' : 'text-muted-foreground line-through',
                        )}
                      />
                      <IconButton
                        label="Remove rule"
                        size="sm"
                        className="opacity-0 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                        onClick={() => setRules((prev) => prev.filter((r) => r.id !== rule.id))}
                      >
                        <X />
                      </IconButton>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {rules.length === 0 && <li className="px-2 py-3 text-center text-xs text-muted-foreground">No rules — the URL passes through unchanged.</li>}
              </ul>
              <div className="flex items-start gap-2.5 border-t border-border-subtle px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  <span className="font-medium text-foreground">Magic tokens:</span>{' '}
                  {MAGIC_TOKENS.map((t, i) => (
                    <span key={t}>
                      <code className="rounded bg-primary/10 px-1 font-mono text-primary">{t}</code>
                      {i < MAGIC_TOKENS.length - 1 ? ', ' : ''}
                    </span>
                  ))}{' '}
                  are replaced with fresh UUIDv7 values.
                </span>
              </div>
            </Card>
          </div>

          {/* ── Right: output + parsed + history ──────────────── */}
          <div className="flex flex-col gap-4">
            <Card
              className={cn(
                'relative overflow-hidden transition-colors duration-300',
                error ? 'border-destructive/40' : outputUrl && 'border-primary/40 shadow-glow-sm',
              )}
            >
              {outputUrl && !error && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
              <CardHeader
                icon={error ? <AlertCircle /> : <Sparkles />}
                title={error ? 'Parsing error' : 'Generated URL'}
                description={
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        error ? 'bg-destructive' : outputUrl ? 'animate-pulse-dot bg-success' : 'bg-muted-foreground/50',
                      )}
                    />
                    {error ? 'Fix the source URL' : outputUrl ? 'Live · editable' : 'Waiting for input'}
                  </span>
                }
                actions={
                  outputUrl &&
                  !error && (
                    <>
                      <IconButton label="Regenerate tokens" size="sm" onClick={process}>
                        <RefreshCw />
                      </IconButton>
                      <IconButton
                        label="Open in new tab"
                        size="sm"
                        onClick={() => {
                          addToHistory(inputUrl, outputUrl);
                          window.open(outputUrl, '_blank', 'noopener');
                        }}
                      >
                        <ExternalLink />
                      </IconButton>
                      <Button
                        size="xs"
                        onClick={() => {
                          void copy(outputUrl, 'Modified URL copied');
                          addToHistory(inputUrl, outputUrl);
                        }}
                      >
                        Copy URL
                      </Button>
                    </>
                  )
                }
              />
              <div className="p-4">
                {error ? (
                  <p className="flex items-center gap-2 text-13 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                ) : outputUrl ? (
                  <textarea
                    value={outputUrl}
                    onChange={(e) => setOutputUrl(e.target.value)}
                    spellCheck={false}
                    aria-label="Generated URL"
                    rows={Math.min(6, Math.max(1, Math.ceil(outputUrl.length / 60)))}
                    className="w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground outline-none"
                  />
                ) : (
                  <p className="font-mono text-13 italic text-muted-foreground">Waiting for a URL…</p>
                )}
              </div>
            </Card>

            <AnimatePresence initial={false}>
              {parsed && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="hairline min-w-0 rounded-lg border border-border bg-surface-1 p-3.5">
                      <div className="label-caps mb-1.5">Protocol & host</div>
                      <div className="truncate font-mono text-13">
                        <span className="text-muted-foreground">{parsed.protocol}//</span>
                        {parsed.host}
                      </div>
                    </div>
                    <div className="hairline min-w-0 rounded-lg border border-border bg-surface-1 p-3.5">
                      <div className="label-caps mb-1.5">Path</div>
                      <div className="truncate font-mono text-13 text-success">
                        {parsed.path || '/'}
                        {parsed.hash && <span className="text-muted-foreground">{parsed.hash}</span>}
                      </div>
                    </div>
                  </div>

                  <Card className="overflow-hidden">
                    <CardHeader
                      title="Query parameters"
                      description={`${parsed.params.length} param${parsed.params.length === 1 ? '' : 's'}`}
                      actions={
                        <Button size="xs" variant="ghost" onClick={() => updateParams([...parsed.params, { key: 'param', val: '' }])}>
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </Button>
                      }
                    />
                    {parsed.params.length ? (
                      <div className="max-h-56 divide-y divide-border-subtle overflow-y-auto">
                        {parsed.params.map((p, i) => (
                          <div key={i} className="group flex items-center transition-colors focus-within:bg-surface-2 hover:bg-surface-2/60">
                            <input
                              value={p.key}
                              onChange={(e) => updateParams(parsed.params.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}
                              aria-label="Parameter name"
                              spellCheck={false}
                              className="w-1/3 min-w-0 border-r border-border-subtle bg-transparent px-4 py-2 font-mono text-xs text-primary outline-none"
                            />
                            <input
                              value={p.val}
                              onChange={(e) => updateParams(parsed.params.map((x, j) => (j === i ? { ...x, val: e.target.value } : x)))}
                              aria-label="Parameter value"
                              spellCheck={false}
                              className="min-w-0 flex-1 bg-transparent px-4 py-2 font-mono text-xs text-foreground outline-none"
                            />
                            <IconButton
                              label="Remove parameter"
                              size="sm"
                              className="mr-1 opacity-0 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                              onClick={() => updateParams(parsed.params.filter((_, j) => j !== i))}
                            >
                              <X />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-4 text-center text-xs text-muted-foreground">No query parameters.</p>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <Card>
              <CardHeader
                icon={<History />}
                title="History"
                description="Saved automatically after a short pause"
                actions={
                  history.length > 0 && (
                    <Button size="xs" variant="ghost" className="hover:text-destructive" onClick={() => setHistory([])}>
                      Clear
                    </Button>
                  )
                }
              />
              {history.length ? (
                <ul className="max-h-80 space-y-1.5 overflow-y-auto p-2">
                  <AnimatePresence initial={false}>
                    {history.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        {...listItem}
                        className="group flex items-center gap-3 rounded-md border border-transparent px-2.5 py-2 transition-colors hover:border-border hover:bg-surface-2"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="truncate font-mono text-2xs text-muted-foreground">{item.original}</div>
                          <div className="truncate font-mono text-xs font-medium text-foreground">{item.modified}</div>
                        </div>
                        <Badge className="hidden font-mono sm:inline-flex">{item.timestamp}</Badge>
                        <div className="flex shrink-0 items-center opacity-60 transition-opacity group-hover:opacity-100">
                          <CopyButton value={item.modified} message="Copied from history" />
                          <IconButton
                            label="Restore to editor"
                            size="sm"
                            onClick={() => {
                              setInputUrl(item.original);
                              toast.info('Restored to editor');
                            }}
                          >
                            <RotateCcw />
                          </IconButton>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              ) : (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">Transformed URLs will appear here.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
