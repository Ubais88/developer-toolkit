import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { OnMount } from '@monaco-editor/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, BookOpen, ChevronDown, FileJson, ListTree, Route, Sparkles } from 'lucide-react';
import { Editor } from '../../components/editor/Editor';
import { Badge, Button, Card, CopyButton, Input, Panel, SegmentedControl, ToolHeader, Tooltip, cn } from '../../components/ui';
import { useSessionState } from '../../hooks/useSessionState';
import { BOOKSTORE_SAMPLE, CHEAT_SHEET, EXAMPLES, parseJson, runQuery, type ResultMode } from './query';

type EditorInstance = Parameters<OnMount>[0];

const DEBOUNCE_MS = 150;
const spring = { type: 'spring', stiffness: 450, damping: 34 } as const;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** A number that rolls vertically when it changes. */
function Count({ value }: { value: number }) {
  return (
    <span className="relative inline-flex overflow-hidden tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '-70%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '70%', opacity: 0 }}
          transition={spring}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function InlineError({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 text-xs text-destructive">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
      <p className="min-w-0 flex-1 break-words font-medium leading-relaxed">{children}</p>
      {action}
    </div>
  );
}

const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: spring,
};

export function JsonPathTool() {
  const [json, setJson] = useSessionState('jsonpath-json', BOOKSTORE_SAMPLE);
  const [query, setQuery] = useSessionState('jsonpath-query', EXAMPLES[0].path);
  const [mode, setMode] = useSessionState<ResultMode>('jsonpath-mode', 'value');
  const [showSyntax, setShowSyntax] = useSessionState('jsonpath-cheatsheet', false);

  const debouncedJson = useDebouncedValue(json, DEBOUNCE_MS);
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);

  const parsed = useMemo(() => (debouncedJson.trim() ? parseJson(debouncedJson) : null), [debouncedJson]);
  const result = useMemo(
    () => (parsed?.ok ? runQuery(parsed.data, debouncedQuery, mode) : null),
    [parsed, debouncedQuery, mode],
  );

  const jsonError = parsed && !parsed.ok ? parsed : null;
  const pathError = result && !result.ok ? result.message : null;
  const fresh = result?.ok ? JSON.stringify(result.matches, null, 2) : null;
  const freshCount = result?.ok ? result.matches.length : 0;

  // Keep the previous results visible (dimmed) while the input or path is broken.
  const [lastGood, setLastGood] = useState({ text: fresh ?? '', count: freshCount });
  if (fresh !== null && fresh !== lastGood.text) setLastGood({ text: fresh, count: freshCount });
  if (!json.trim() && lastGood.text) setLastGood({ text: '', count: 0 });

  const stale = fresh === null && !!lastGood.text;
  const output = fresh ?? lastGood.text;
  const count = fresh !== null ? freshCount : lastGood.count;

  const editorRef = useRef<EditorInstance | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const jumpToError = () => {
    const ed = editorRef.current;
    if (!ed || !jsonError?.line) return;
    const position = { lineNumber: jsonError.line, column: jsonError.column ?? 1 };
    ed.revealPositionInCenter(position);
    ed.setPosition(position);
    ed.focus();
  };

  const pickExample = (path: string) => {
    setQuery(path);
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 md:p-6 lg:overflow-hidden">
      <ToolHeader
        icon={<Route />}
        title="JSONPath Query"
        description="Query JSON documents with JSONPath expressions"
        actions={
          <>
            <Button
              variant={showSyntax ? 'subtle' : 'ghost'}
              size="sm"
              onClick={() => setShowSyntax(!showSyntax)}
              aria-expanded={showSyntax}
              aria-controls="jsonpath-cheatsheet"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Syntax
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', showSyntax && 'rotate-180')} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setJson(BOOKSTORE_SAMPLE)}>
              <Sparkles className="h-3.5 w-3.5" />
              Load sample
            </Button>
          </>
        }
      />

      <div className="flex shrink-0 flex-col gap-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <Input
              ref={inputRef}
              mono
              aria-label="JSONPath expression"
              spellCheck={false}
              autoComplete="off"
              invalid={!!pathError}
              value={query.startsWith('$') ? query.slice(1) : query}
              onChange={(e) => setQuery('$' + e.target.value.replace(/^\s*\$/, ''))}
              placeholder=".store.book[*].author"
              leading={<span className="font-mono text-sm font-semibold text-primary">$</span>}
              trailing={<CopyButton value={query} message="Path copied" />}
              className="h-[38px]"
            />
          </div>
          <SegmentedControl<ResultMode>
            size="md"
            aria-label="Result type"
            value={mode}
            onChange={setMode}
            className="self-start sm:self-auto"
            options={[
              { value: 'value', label: 'Values' },
              { value: 'path', label: 'Paths' },
            ]}
          />
        </div>

        <AnimatePresence initial={false}>
          {pathError && (
            <motion.div key="path-error" {...collapse} className="overflow-hidden">
              <InlineError>Invalid path: {pathError}</InlineError>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 items-center gap-2">
          <span className="label-caps hidden shrink-0 sm:inline">Examples</span>
          <div className="no-scrollbar -my-1 flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1">
            {EXAMPLES.map((ex) => {
              const active = ex.path === query;
              return (
                <Tooltip key={ex.path} content={ex.hint}>
                  <button
                    type="button"
                    onClick={() => pickExample(ex.path)}
                    aria-pressed={active}
                    className={cn(
                      'focus-ring inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 font-mono text-xs transition-colors duration-150 active:scale-[0.97]',
                      active
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-border-strong hover:bg-surface-2 hover:text-foreground',
                    )}
                  >
                    {ex.path}
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showSyntax && (
          <motion.div key="cheatsheet" id="jsonpath-cheatsheet" {...collapse} className="shrink-0 overflow-hidden">
            <Card className="p-3">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-5">
                {CHEAT_SHEET.map((row) => (
                  <div key={row.token} className="flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-1">
                    <dt className="shrink-0">
                      <code className="inline-flex h-5 min-w-7 items-center justify-center rounded border border-border bg-surface-2 px-1.5 font-mono text-2xs font-semibold text-primary">
                        {row.token}
                      </code>
                    </dt>
                    <dd className="truncate text-xs text-muted-foreground" title={row.desc}>
                      {row.desc}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <Panel title="JSON input" icon={<FileJson />} className="min-h-[320px]" bodyClassName="flex flex-col">
          <div className="relative min-h-0 flex-1">
            <Editor
              value={json}
              onChange={setJson}
              language="json"
              path="jsonpath-input.json"
              placeholder="Paste JSON to query…"
              onMount={(editor) => {
                editorRef.current = editor;
              }}
            />
          </div>
          <AnimatePresence initial={false}>
            {jsonError && (
              <motion.div key="json-error" {...collapse} className="shrink-0 overflow-hidden">
                <div className="border-t border-destructive/25 bg-destructive/10 px-3.5 py-2.5">
                  <InlineError
                    action={
                      jsonError.line !== undefined && (
                        <button
                          type="button"
                          onClick={jumpToError}
                          title="Jump to error"
                          className="focus-ring shrink-0 rounded border border-destructive/30 px-1.5 py-0.5 font-mono text-2xs transition-colors hover:bg-destructive/15"
                        >
                          Ln {jsonError.line}, Col {jsonError.column ?? 1}
                        </button>
                      )
                    }
                  >
                    Invalid JSON: {jsonError.message}
                  </InlineError>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>

        <Panel
          title="Results"
          icon={<ListTree />}
          className="min-h-[320px]"
          meta={
            output ? (
              <Badge tone={count === 0 ? 'warning' : 'primary'} className={cn('normal-case tracking-normal transition-opacity', stale && 'opacity-60')}>
                {count === 0 ? (
                  'No matches'
                ) : (
                  <>
                    <Count value={count} /> {count === 1 ? 'match' : 'matches'}
                  </>
                )}
              </Badge>
            ) : undefined
          }
          actions={<CopyButton value={output} message="Results copied" disabled={!output} />}
        >
          <div className={cn('h-full transition-opacity duration-200', stale && 'opacity-50')}>
            <Editor value={output} readOnly language="json" path="jsonpath-results.json" placeholder="Matches appear here" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
