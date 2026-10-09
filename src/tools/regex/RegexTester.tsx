import { useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ListTree, Replace, SearchCode, Trash2 } from 'lucide-react';
import { Badge, CopyButton, EmptyState, IconButton, Input, Panel, Select, Tabs, Textarea, ToolHeader, Tooltip, cn } from '../../components/ui';
import { useSessionState } from '../../hooks/useSessionState';
import { captureGroupNames } from './groupNames';

interface MatchGroup {
  text: string | undefined;
  index: number;
  name?: string;
}

interface MatchResult {
  match: string;
  index: number;
  groups: MatchGroup[];
}

const FLAGS = [
  { flag: 'g', label: 'global', hint: 'Find all matches' },
  { flag: 'i', label: 'insensitive', hint: 'Case-insensitive' },
  { flag: 'm', label: 'multiline', hint: '^ and $ match at line breaks' },
  { flag: 's', label: 'dotAll', hint: '. matches newlines' },
  { flag: 'u', label: 'unicode', hint: 'Unicode code points & \\p{…}' },
] as const;

const COMMON_PATTERNS = [
  { value: '', label: 'Insert common pattern…' },
  { value: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+', label: 'Email address' },
  { value: 'https?:\\/\\/[^\\s/$.?#].[^\\s]*', label: 'URL' },
  { value: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', label: 'IPv4 address' },
  { value: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', label: 'UUID' },
  { value: '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})', label: 'ISO date (named groups)' },
  { value: '#(?:[0-9a-fA-F]{3}){1,2}\\b', label: 'Hex colour' },
  { value: '\\+?\\d[\\d\\s()-]{7,}\\d', label: 'Phone number' },
  { value: '^\\s*$', label: 'Blank line' },
  { value: '\\b(\\w+)\\s+\\1\\b', label: 'Repeated word' },
];

type Mode = 'matches' | 'replace';

export const RegexTester = () => {
  const [pattern, setPattern] = useSessionState('regex-pattern', '(\\w+)\\s(\\d+)');
  const [testText, setTestText] = useSessionState('regex-test-text', 'hello 123\nworld 456\ntest 789');
  const [flags, setFlags] = useSessionState('regex-flags', 'gm');
  const [replacement, setReplacement] = useSessionState('regex-replacement', '$2 → $1');
  const [mode, setMode] = useSessionState<Mode>('regex-mode', 'matches');

  const toggleFlag = (flag: string) =>
    setFlags((prev) => {
      const next = prev.includes(flag) ? prev.replace(flag, '') : prev + flag;
      return FLAGS.map((f) => f.flag).filter((f) => next.includes(f)).join('');
    });

  const { matches, error } = useMemo((): { matches: MatchResult[]; error: string | null } => {
    if (!pattern) return { matches: [], error: null };
    try {
      const regex = new RegExp(pattern, flags);
      const names = captureGroupNames(pattern);
      const results: MatchResult[] = [];
      const toResult = (m: RegExpExecArray): MatchResult => ({
        match: m[0],
        index: m.index,
        groups: m.slice(1).map((text, i) => ({ text, index: i + 1, name: names[i] })),
      });
      if (regex.global) {
        let m: RegExpExecArray | null;
        let guard = 0;
        while ((m = regex.exec(testText)) !== null && guard++ < 5000) {
          if (m[0] === '') regex.lastIndex++; // avoid infinite loops on empty matches
          results.push(toResult(m));
        }
      } else {
        const m = regex.exec(testText);
        if (m) results.push(toResult(m));
      }
      return { matches: results, error: null };
    } catch (err) {
      return { matches: [], error: err instanceof Error ? err.message : 'Invalid regular expression' };
    }
  }, [pattern, flags, testText]);

  const replaced = useMemo(() => {
    if (error || !pattern) return testText;
    try {
      return testText.replace(new RegExp(pattern, flags), replacement);
    } catch {
      return testText;
    }
  }, [error, pattern, flags, testText, replacement]);

  const highlighted = useMemo(() => {
    if (!matches.length) return null;
    const nodes: ReactNode[] = [];
    let last = 0;
    matches.forEach((m, i) => {
      if (m.index > last) nodes.push(testText.slice(last, m.index));
      const groupsLabel = m.groups.map((g) => `${g.name ?? `$${g.index}`}: ${g.text ?? '∅'}`).join('  ·  ');
      nodes.push(
        <Tooltip key={i} content={groupsLabel || `Match ${i + 1} @ ${m.index}`} side="top" delay={150}>
          <mark
            className={cn(
              'rounded-[3px] px-px text-foreground transition-colors',
              i % 2 === 0 ? 'bg-primary/25 ring-1 ring-primary/40' : 'bg-primary/15 ring-1 ring-primary/25',
            )}
          >
            {m.match || '​'}
          </mark>
        </Tooltip>,
      );
      last = m.index + m.match.length;
    });
    if (last < testText.length) nodes.push(testText.slice(last));
    return nodes;
  }, [matches, testText]);

  const fullRegex = `/${pattern}/${flags}`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <ToolHeader
        icon={<SearchCode />}
        title="Regex Tester"
        description="Live matching with capture groups, named groups and replace preview"
        actions={
          <Select
            size="sm"
            aria-label="Insert common pattern"
            value=""
            onChange={(e) => e.target.value && setPattern(e.target.value)}
            options={COMMON_PATTERNS}
            className="w-56"
          />
        }
      />

      {/* Pattern bar */}
      <div className="hairline rounded-lg border border-border bg-surface-1 p-3">
        <div
          className={cn(
            'flex items-center gap-1 rounded-md border bg-background px-3 font-mono transition-[border-color,box-shadow] focus-within:ring-[3px]',
            error ? 'border-destructive/60 focus-within:ring-destructive/15' : 'border-border focus-within:border-primary/60 focus-within:ring-primary/15',
          )}
        >
          <span className="select-none text-lg text-muted-foreground">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
            aria-label="Regular expression"
            placeholder="Enter a pattern, e.g. [a-z]+"
            className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <span className="select-none text-lg text-muted-foreground">/</span>
          <span className="min-w-[1.5rem] select-none text-[15px] font-semibold text-primary">{flags}</span>
          <CopyButton value={fullRegex} message="Regex copied" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {FLAGS.map(({ flag, label, hint }) => {
            const on = flags.includes(flag);
            return (
              <Tooltip key={flag} content={hint}>
                <button
                  onClick={() => toggleFlag(flag)}
                  aria-pressed={on}
                  className={cn(
                    'focus-ring inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-all active:scale-95',
                    on ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-border-strong hover:text-foreground',
                  )}
                >
                  <span className="font-mono font-semibold">{flag}</span>
                  {label}
                </button>
              </Tooltip>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={error ? 'err' : matches.length} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
                {error ? <Badge tone="danger">Invalid</Badge> : <Badge tone={matches.length ? 'success' : 'neutral'}>{matches.length} match{matches.length === 1 ? '' : 'es'}</Badge>}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="break-all font-mono">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        {/* Test text with highlight overlay */}
        <Panel
          title="Test string"
          meta={`${testText.length} chars`}
          className="min-h-[300px]"
          actions={
            <IconButton label="Clear" size="sm" onClick={() => setTestText('')} disabled={!testText}>
              <Trash2 />
            </IconButton>
          }
          bodyClassName="flex flex-col"
        >
          <Textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            mono
            aria-label="Test string"
            placeholder="Paste text to test your expression against…"
            className="min-h-[120px] flex-1 resize-none rounded-none border-0 border-b border-border-subtle bg-transparent text-13 focus:ring-0"
          />
          <div className="max-h-[45%] min-h-[96px] overflow-auto p-3.5">
            <div className="label-caps mb-2">Highlighted</div>
            <div className="whitespace-pre-wrap break-words font-mono text-13 leading-relaxed text-muted-foreground">
              {highlighted ?? (testText || <span className="italic">Nothing to highlight</span>)}
            </div>
          </div>
        </Panel>

        {/* Results */}
        <Panel className="min-h-[300px]" bodyClassName="flex flex-col">
          <div className="flex items-center justify-between border-b border-border-subtle px-2">
            <Tabs
              value={mode}
              onChange={setMode}
              items={[
                { value: 'matches', label: 'Matches', icon: <ListTree /> },
                { value: 'replace', label: 'Replace', icon: <Replace /> },
              ]}
            />
            {mode === 'replace' && <CopyButton value={replaced} message="Result copied" />}
          </div>

          {mode === 'matches' ? (
            matches.length ? (
              <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {matches.slice(0, 500).map((m, i) => (
                  <motion.li
                    key={`${m.index}-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 12) * 0.02 }}
                    className="rounded-lg border border-border bg-surface-2/60 p-3 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Badge tone="primary">#{i + 1}</Badge>
                        <code className="truncate font-mono text-13 font-medium text-foreground">{m.match || '(empty)'}</code>
                      </div>
                      <span className="shrink-0 font-mono text-2xs text-muted-foreground">@{m.index}</span>
                    </div>
                    {m.groups.length > 0 && (
                      <div className="mt-2 grid gap-1 border-t border-border-subtle pt-2">
                        {m.groups.map((g) => (
                          <div key={g.index} className="flex items-center gap-2 font-mono text-xs">
                            <span className="w-16 shrink-0 truncate text-muted-foreground">{g.name ?? `$${g.index}`}</span>
                            <span className="truncate rounded bg-primary/10 px-1.5 text-foreground">{g.text ?? 'undefined'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.li>
                ))}
              </ol>
            ) : (
              <EmptyState icon={<SearchCode />} title="No matches" hint="Adjust your pattern or flags to see matches here." />
            )
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
              <Input
                mono
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                aria-label="Replacement"
                placeholder="Replacement — use $1, $<name>, $&"
              />
              <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-background p-3 font-mono text-13 text-foreground">
                {replaced}
              </pre>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};
