import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, BookOpen, CalendarClock, History, ListOrdered, Sparkles, Terminal, Zap } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CopyButton,
  EmptyState,
  Input,
  Select,
  ToolHeader,
  cn,
} from '../../components/ui';
import { useSessionState } from '../../hooks/useSessionState';
import { formatRelative } from '../../lib/time';
import { dtf, formatOffset, localTimeZone, tzOffsetMinutes } from '../timestamp/timeUtils';
import { useNow } from '../timestamp/useNow';
import { FIELD_DEFS, analyzeCron, nextRuns, tokenAtCaret, tokenize, type CronAnalysis, type FieldInfo } from './cronUtils';

const PRESETS: { label: string; expr: string }[] = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every 5 min', expr: '*/5 * * * *' },
  { label: 'Every 15 min', expr: '*/15 * * * *' },
  { label: 'Hourly', expr: '0 * * * *' },
  { label: 'Daily at midnight', expr: '0 0 * * *' },
  { label: 'Daily 9am', expr: '0 9 * * *' },
  { label: 'Weekdays 9am', expr: '0 9 * * 1-5' },
  { label: 'Weekly (Sun)', expr: '0 0 * * 0' },
  { label: 'Monthly (1st)', expr: '0 0 1 * *' },
  { label: 'Yearly', expr: '0 0 1 1 *' },
];

const COMMON_ZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const spring = { type: 'spring', stiffness: 460, damping: 36 } as const;
const enter = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

type OkAnalysis = Extract<CronAnalysis, { ok: true }>;

export function CronTool() {
  const [expr, setExpr] = useSessionState('cron-expr', '*/15 9-17 * * 1-5');
  const [tz, setTz] = useSessionState('cron-tz', localTimeZone);
  const [caret, setCaret] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analysis = useMemo(() => analyzeCron(expr), [expr]);
  const [lastGood, setLastGood] = useState<OkAnalysis | null>(analysis.ok ? analysis : null);
  useEffect(() => {
    if (analysis.ok) setLastGood(analysis);
  }, [analysis]);
  const shown = analysis.ok ? analysis : lastGood;
  const stale = !analysis.ok;

  const tokens = useMemo(() => tokenize(expr), [expr]);
  const activeToken = tokenAtCaret(tokens, caret);

  const syncCaret = () => {
    const el = inputRef.current;
    setCaret(el && document.activeElement === el ? el.selectionStart : null);
  };

  const selectField = (tokenIndex: number) => {
    const t = tokens[tokenIndex];
    const el = inputRef.current;
    if (!t || !el) return;
    el.focus();
    el.setSelectionRange(t.start, t.end);
    setCaret(t.start);
  };

  const zoneOptions = useMemo(() => {
    const zones = Array.from(new Set([localTimeZone, ...COMMON_ZONES, tz]));
    return zones.map((z) => ({ value: z, label: z === localTimeZone ? `Local · ${z}` : z }));
  }, [tz]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <ToolHeader
          icon={<CalendarClock />}
          title="Cron Explainer"
          description="Read any cron schedule in plain English and preview when it fires next"
          actions={<CopyButton value={expr.trim()} label="Copy expression" variant="secondary" message="Cron expression copied" />}
        />

        <motion.div {...enter} transition={spring}>
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 p-4 md:p-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="cron-expr" className="label-caps">
                    Cron expression
                  </label>
                  <span className="text-2xs text-muted-foreground">
                    {analysis.ok && analysis.hasSeconds ? '6 fields · with seconds' : '5 fields · or 6 with seconds'}
                  </span>
                </div>
                <Input
                  id="cron-expr"
                  ref={inputRef}
                  mono
                  leading={<Terminal />}
                  invalid={!analysis.ok}
                  value={expr}
                  onChange={(e) => {
                    setExpr(e.target.value);
                    setCaret(e.target.selectionStart);
                  }}
                  onSelect={syncCaret}
                  onKeyUp={syncCaret}
                  onClick={syncCaret}
                  onFocus={syncCaret}
                  onBlur={() => setCaret(null)}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  aria-describedby="cron-status"
                  placeholder="*/15 9-17 * * 1-5"
                  className="h-12 rounded-lg pl-10 text-lg tracking-wide md:text-xl"
                />
              </div>

              <div id="cron-status" aria-live="polite">
                <AnimatePresence mode="popLayout" initial={false}>
                  {!analysis.ok && (
                    <motion.p
                      key="err"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16 }}
                      className="mb-3 flex items-start gap-1.5 text-xs text-destructive"
                    >
                      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                      <span>{analysis.error}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
                <DescriptionBanner analysis={shown} stale={stale} tz={tz} />
              </div>

              <FieldBreakdown
                fields={analysis.fields}
                activeToken={activeToken}
                onSelect={selectField}
                macro={analysis.ok ? analysis.macro : undefined}
              />

              <div className="flex flex-col gap-2">
                <span className="label-caps">Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => {
                    const active = expr.trim().replace(/\s+/g, ' ') === p.expr;
                    return (
                      <Button
                        key={p.expr}
                        variant={active ? 'subtle' : 'outline'}
                        size="xs"
                        aria-pressed={active}
                        title={p.expr}
                        onClick={() => {
                          setExpr(p.expr);
                          setCaret(null);
                        }}
                        className={cn('rounded-full', active && 'ring-1 ring-primary/30')}
                      >
                        {p.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-5">
          <motion.div {...enter} transition={{ ...spring, delay: 0.05 }} className="min-w-0 lg:col-span-3">
            <Card className="h-full">
              <CardHeader
                title="Next runs"
                description={`Upcoming executions in ${tz === localTimeZone ? 'your local time' : tz}`}
                icon={<ListOrdered />}
                actions={
                  <Select
                    size="sm"
                    aria-label="Timezone for next runs"
                    value={tz}
                    onChange={(e) => setTz(e.target.value)}
                    options={zoneOptions}
                    className="max-w-[11rem] sm:max-w-[14rem]"
                  />
                }
              />
              <NextRuns analysis={shown} stale={stale} tz={tz} />
            </Card>
          </motion.div>

          <motion.div {...enter} transition={{ ...spring, delay: 0.1 }} className="min-w-0 lg:col-span-2">
            <CheatSheet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── Description ─────────────────────────────────────────────────────────

function DescriptionBanner({ analysis, stale, tz }: { analysis: OkAnalysis | null; stale: boolean; tz: string }) {
  const now = useNow(analysis?.hasSeconds ? 1000 : 5000, !!analysis);
  const next = useMemo(
    () => (analysis ? nextRuns(analysis.expression, tz, now, 1).runs[0] : undefined),
    [analysis, tz, now],
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.12] via-primary/[0.05] to-transparent px-4 py-4 transition-opacity duration-200 md:px-5',
        stale && 'opacity-50 saturate-50',
      )}
    >
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={analysis?.description ?? 'none'}
              initial={{ opacity: 0, y: 6, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(3px)', transition: { duration: 0.12 } }}
              transition={spring}
              className="text-base font-semibold leading-snug tracking-tight text-foreground md:text-lg"
            >
              {analysis?.description ?? 'Type a cron expression to see what it means'}
            </motion.p>
          </AnimatePresence>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {stale && analysis && <Badge tone="warning">Showing last valid expression</Badge>}
            {analysis?.macro && (
              <Badge tone="primary">
                {analysis.macro} = {analysis.expression}
              </Badge>
            )}
            {next !== undefined && !stale && (
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Next run <span className="font-medium text-foreground">{formatRelative(next, now)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Field breakdown ─────────────────────────────────────────────────────

function FieldBreakdown({
  fields,
  activeToken,
  onSelect,
  macro,
}: {
  fields: FieldInfo[];
  activeToken: number;
  onSelect: (tokenIndex: number) => void;
  macro?: string;
}) {
  if (!fields.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="label-caps">Fields</span>
        <span className="hidden text-2xs text-muted-foreground sm:inline">
          {macro ? `${macro} expands to the fields below` : 'Move the caret in the expression to highlight a field'}
        </span>
      </div>
      <div
        className={cn(
          'grid grid-cols-2 gap-2 sm:grid-cols-3',
          fields.length === 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-5',
        )}
      >
        {fields.map((f, i) => {
          const active = f.tokenIndex !== -1 && f.tokenIndex === activeToken;
          const def = FIELD_DEFS[f.kind];
          return (
            <motion.button
              key={`${f.kind}-${i}`}
              type="button"
              layout
              onClick={() => f.tokenIndex !== -1 && onSelect(f.tokenIndex)}
              aria-label={`${def.label}: ${f.value} — ${f.meaning}${f.valid ? '' : ' (invalid)'}`}
              className={cn(
                'focus-ring relative flex min-w-0 flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-[border-color,background-color,box-shadow] duration-150',
                !f.valid
                  ? 'border-destructive/40 bg-destructive/10'
                  : active
                    ? 'border-primary/50 bg-primary/10 shadow-glow-sm'
                    : 'border-border-subtle bg-surface-2/50 hover:border-border-strong hover:bg-surface-2',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className={cn('label-caps truncate', active && 'text-primary')}>{def.label}</span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">{def.range.split(' · ')[0]}</span>
              </span>
              <span
                className={cn(
                  'truncate font-mono text-base font-semibold tabular-nums',
                  !f.valid ? 'text-destructive' : active ? 'text-primary' : 'text-foreground',
                )}
              >
                {f.value}
              </span>
              <span className={cn('truncate text-2xs', !f.valid ? 'text-destructive' : 'text-muted-foreground')}>
                {f.valid ? f.meaning : `Out of range (${def.range.split(' · ')[0]})`}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Next runs ───────────────────────────────────────────────────────────

function NextRuns({ analysis, stale, tz }: { analysis: OkAnalysis | null; stale: boolean; tz: string }) {
  const now = useNow(1000, !!analysis);
  // Re-anchor the list on a coarse bucket so runs roll off as they slip into the past.
  const step = analysis?.hasSeconds ? 1000 : 5000;
  const from = Math.floor(now / step) * step;
  const result = useMemo(() => (analysis ? nextRuns(analysis.expression, tz, from, 10) : null), [analysis, tz, from]);

  if (!analysis || !result) {
    return <EmptyState icon={<History />} title="No schedule yet" hint="Enter a valid cron expression to preview its run times." className="py-12" />;
  }
  if (result.error || result.runs.length === 0) {
    return (
      <EmptyState
        icon={<AlertCircle />}
        title="No upcoming runs"
        hint={result.error ?? 'This schedule never fires.'}
        className="py-12"
      />
    );
  }

  const dateFmt = dtf(tz, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeFmt = dtf(tz, {
    hour: '2-digit',
    minute: '2-digit',
    ...(analysis.hasSeconds ? { second: '2-digit' } : {}),
    hourCycle: 'h23',
  });

  return (
    <ol className={cn('flex flex-col gap-1 p-2 transition-opacity duration-200', stale && 'opacity-50')}>
      <AnimatePresence initial={false} mode="popLayout">
        {result.runs.map((run, i) => {
          const first = i === 0;
          return (
            <motion.li
              key={`${analysis.expression}|${tz}|${run}`}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { ...spring, delay: Math.min(i, 9) * 0.02 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-1.5',
                first ? 'border border-primary/30 bg-primary/10 shadow-glow-sm' : 'border border-transparent hover:bg-surface-2',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-2xs tabular-nums',
                  first ? 'bg-primary text-primary-foreground' : 'bg-surface-2 text-muted-foreground',
                )}
              >
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-baseline sm:gap-3">
                <span className={cn('font-mono text-13 font-medium tabular-nums', first ? 'text-foreground' : 'text-foreground/90')}>
                  {timeFmt.format(run)}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {dateFmt.format(run)}
                  <span className="hidden font-mono text-2xs text-muted-foreground/70 md:inline">
                    {' '}
                    · {formatOffset(tzOffsetMinutes(run, tz))}
                  </span>
                </span>
              </div>
              <span className={cn('shrink-0 text-xs tabular-nums', first ? 'font-medium text-primary' : 'text-muted-foreground')}>
                {formatRelative(run, now)}
              </span>
              <CopyButton value={new Date(run).toISOString()} message="Run time copied (ISO 8601)" aria-label={`Copy run ${i + 1}`} className="hidden sm:inline-flex" />
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}

// ── Cheat sheet ─────────────────────────────────────────────────────────

const SYNTAX: { token: string; meaning: string; example: string }[] = [
  { token: '*', meaning: 'Any value', example: '* * * * *' },
  { token: ',', meaning: 'List of values', example: '0 9,17 * * *' },
  { token: '-', meaning: 'Range of values', example: '0 9 * * 1-5' },
  { token: '/', meaning: 'Step values', example: '*/10 * * * *' },
  { token: 'L', meaning: 'Last day / last weekday', example: '0 0 L * *' },
  { token: '#', meaning: 'Nth weekday of month', example: '0 9 * * 1#2' },
  { token: '?', meaning: 'No specific value (day fields)', example: '0 9 ? * MON' },
];

const ORDER: (keyof typeof FIELD_DEFS)[] = ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];

function CheatSheet() {
  return (
    <Card className="h-full">
      <CardHeader title="Cheat sheet" description="Syntax supported by this explainer" icon={<BookOpen />} />
      <div className="flex flex-col gap-4 p-4">
        <div className="overflow-hidden rounded-lg border border-border-subtle">
          <div className="grid grid-cols-6 border-b border-border-subtle bg-surface-2/60 font-mono text-[10px] text-muted-foreground">
            {['sec', 'min', 'hour', 'dom', 'mon', 'dow'].map((h, i) => (
              <span key={h} className={cn('px-1 py-1.5 text-center', i === 0 && 'opacity-60')}>
                {h}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-6 font-mono text-sm font-semibold text-foreground">
            {['0', '*/15', '9-17', '*', '*', '1-5'].map((v, i) => (
              <span key={i} className={cn('px-1 py-2 text-center', i === 0 && 'text-muted-foreground')}>
                {v}
              </span>
            ))}
          </div>
          <p className="border-t border-border-subtle px-3 py-1.5 text-2xs text-muted-foreground">
            The seconds field is optional — 5 fields start at minutes.
          </p>
        </div>

        <dl className="flex flex-col divide-y divide-border-subtle">
          {SYNTAX.map((s) => (
            <div key={s.token} className="flex items-center gap-3 py-1.5">
              <dt className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 font-mono text-13 font-semibold text-primary">
                {s.token}
              </dt>
              <dd className="min-w-0 flex-1 text-xs text-foreground">{s.meaning}</dd>
              <dd className="shrink-0 font-mono text-2xs text-muted-foreground">{s.example}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-1.5">
          <span className="label-caps">Allowed values</span>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {ORDER.map((k) => (
              <div key={k} className="flex items-baseline justify-between gap-2">
                <dt className="text-muted-foreground">{FIELD_DEFS[k].label}</dt>
                <dd className="font-mono text-2xs text-foreground">{FIELD_DEFS[k].range}</dd>
              </div>
            ))}
          </dl>
          <p className="text-2xs text-muted-foreground">
            Day of week: 0 and 7 are both Sunday. Names are case-insensitive.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="label-caps">Shortcuts</span>
          <div className="flex flex-wrap gap-1">
            {['@yearly', '@monthly', '@weekly', '@daily', '@hourly'].map((m) => (
              <code key={m} className="rounded border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-2xs text-foreground">
                {m}
              </code>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
