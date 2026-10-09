import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRightLeft, CalendarDays, Clock, CornerDownLeft, Pause, Play, Sunrise, X } from 'lucide-react';
import { Badge, Button, Card, CardHeader, CopyButton, IconButton, Input, ToolHeader, cn } from '../../components/ui';
import { useSessionState } from '../../hooks/useSessionState';
import { formatRelative } from '../../lib/time';
import { CopyTile, RollingDigits } from './parts';
import { TimezonesCard } from './TimezonesCard';
import { useNow } from './useNow';
import {
  KIND_LABEL,
  dayOfYear,
  dtf,
  formatAs,
  formatOffset,
  isLeapYear,
  isoWeek,
  localTimeZone,
  parseTimeInput,
  startOfLocalDay,
  startOfLocalWeek,
  tzOffsetMinutes,
} from './timeUtils';

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const enter = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

const localDateTime = (ms: number) =>
  dtf(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(ms);

export function TimestampTool() {
  const [paused, setPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState(0);
  const tick = useNow(1000);
  const clock = paused ? pausedAt : tick;

  const [input, setInput] = useSessionState('time-input', '');
  const parsed = useMemo(() => parseTimeInput(input, clock), [input, clock]);
  const live = parsed === null || (parsed.ok && parsed.kind === 'now');
  const value = parsed?.ok ? parsed.ms : clock;
  const lastKind = parsed?.ok && parsed.kind !== 'now' ? parsed.kind : undefined;

  const togglePause = () => {
    if (!paused) setPausedAt(Date.now());
    setPaused((p) => !p);
  };

  /** Quick actions keep the input in whatever format the user was already typing in. */
  const apply = (fn: (ms: number) => number) => setInput(formatAs(fn(parsed?.ok ? parsed.ms : Date.now()), lastKind));

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <ToolHeader
          icon={<Clock />}
          title="Timestamp & Timezones"
          description="Convert between epoch, ISO 8601 and human dates — then compare across the world"
        />

        <motion.div {...enter} transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
          <NowCard
            now={clock}
            paused={paused}
            onTogglePause={togglePause}
            onUse={() => setInput(String(Math.floor(clock / 1000)))}
          />
        </motion.div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-5">
          <motion.div
            {...enter}
            transition={{ type: 'spring', stiffness: 420, damping: 34, delay: 0.04 }}
            className="min-w-0 lg:col-span-3"
          >
            <Card className="h-full min-w-0">
              <CardHeader
                title="Converter"
                description="Paste a timestamp or date — the format is detected automatically"
                icon={<ArrowRightLeft />}
                actions={
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={parsed === null ? 'live' : parsed.ok ? parsed.kind : 'err'}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                    >
                      {parsed === null ? (
                        <Badge tone="success">Live</Badge>
                      ) : parsed.ok ? (
                        <Badge tone="primary">{KIND_LABEL[parsed.kind]}</Badge>
                      ) : (
                        <Badge tone="danger">Invalid</Badge>
                      )}
                    </motion.span>
                  </AnimatePresence>
                }
              />
              <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="time-input" className="label-caps">
                    Timestamp or date
                  </label>
                  <Input
                    id="time-input"
                    mono
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="1700000000 · 2024-01-01T12:00:00Z · now"
                    spellCheck={false}
                    autoComplete="off"
                    invalid={parsed?.ok === false}
                    leading={<CornerDownLeft />}
                    className="h-10 text-sm"
                    trailing={
                      input ? (
                        <IconButton label="Clear input" size="sm" onClick={() => setInput('')}>
                          <X />
                        </IconButton>
                      ) : undefined
                    }
                  />
                  <AnimatePresence initial={false}>
                    {parsed?.ok === false && (
                      <motion.p
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-center gap-1.5 overflow-hidden text-xs text-destructive"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {parsed.error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  {parsed === null && (
                    <p className="text-xs text-muted-foreground">
                      Seconds, milliseconds, micro- and nanoseconds, ISO 8601, RFC 2822 or <span className="font-mono">now</span>.
                      Empty shows the live time.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Quick adjustments">
                  <Button variant="secondary" size="xs" onClick={() => setInput(formatAs(Date.now(), lastKind))}>
                    <Clock className="h-3.5 w-3.5" /> Now
                  </Button>
                  <Button variant="secondary" size="xs" onClick={() => apply(startOfLocalDay)}>
                    <Sunrise className="h-3.5 w-3.5" /> Start of today
                  </Button>
                  <Button variant="secondary" size="xs" onClick={() => apply(startOfLocalWeek)}>
                    <CalendarDays className="h-3.5 w-3.5" /> Start of week
                  </Button>
                  <span className="mx-0.5 hidden h-4 w-px bg-border sm:block" aria-hidden />
                  <div className="inline-flex overflow-hidden rounded-md border border-border">
                    {(
                      [
                        ['−1d', -DAY, 'Subtract one day'],
                        ['−1h', -HOUR, 'Subtract one hour'],
                        ['+1h', HOUR, 'Add one hour'],
                        ['+1d', DAY, 'Add one day'],
                      ] as const
                    ).map(([label, delta, aria], i) => (
                      <button
                        key={label}
                        type="button"
                        aria-label={aria}
                        onClick={() => apply((ms) => ms + delta)}
                        className={cn(
                          'focus-ring h-7 bg-surface-2 px-2.5 font-mono text-xs font-medium text-foreground transition-colors hover:bg-surface-3 active:bg-surface-3',
                          i > 0 && 'border-l border-border',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <ConverterOutputs ms={value} now={tick} dimmed={parsed?.ok === false} />
              </div>
            </Card>
          </motion.div>

          <motion.div
            {...enter}
            transition={{ type: 'spring', stiffness: 420, damping: 34, delay: 0.08 }}
            className="min-w-0 lg:col-span-2"
          >
            <TimezonesCard ms={value} live={live} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────

function NowCard({
  now,
  paused,
  onTogglePause,
  onUse,
}: {
  now: number;
  paused: boolean;
  onTogglePause: () => void;
  onUse: () => void;
}) {
  const seconds = String(Math.floor(now / 1000));
  const fresh = () => (paused ? now : Date.now());

  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-0 h-56 w-2/3 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative flex flex-col gap-5 p-4 md:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn('h-2 w-2 rounded-full', paused ? 'bg-warning' : 'animate-pulse-dot bg-success')}
              aria-hidden
            />
            <span className="label-caps">{paused ? 'Paused' : 'Live'} · Unix seconds</span>
          </div>
          <CopyNumber value={seconds} copyValue={() => String(Math.floor(fresh() / 1000))} />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="xs" onClick={onTogglePause} aria-pressed={paused}>
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {paused ? 'Resume' : 'Pause'}
            </Button>
            <Button variant="ghost" size="xs" onClick={onUse}>
              <ArrowRightLeft className="h-3.5 w-3.5" /> Use in converter
            </Button>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,1fr)] lg:w-[60%]">
          <CopyTile label="Milliseconds" value={String(now)} copyValue={() => String(fresh())} />
          <CopyTile
            label="ISO 8601"
            value={new Date(now).toISOString()}
            copyValue={() => new Date(fresh()).toISOString()}
            className="order-last col-span-2 sm:order-none sm:col-span-1"
          />
          <CopyTile
            label="Local"
            value={dtf(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now)}
            copyValue={() => localDateTime(fresh())}
            hint={`${dtf(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(now)} · ${localTimeZone}`}
          />
        </div>
      </div>
    </Card>
  );
}

function CopyNumber({ value, copyValue }: { value: string; copyValue: () => string }) {
  return (
    <div className="group my-2 flex items-center gap-2">
      <RollingDigits
        value={value}
        className="text-[2.5rem] font-semibold leading-none tracking-tight text-foreground sm:text-5xl"
      />
      <CopyButton
        value={copyValue}
        message="Unix timestamp copied"
        aria-label="Copy Unix seconds"
        className="opacity-60 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      />
    </div>
  );
}

// ── Converter outputs ───────────────────────────────────────────────────

function ConverterOutputs({ ms, now, dimmed }: { ms: number; now: number; dimmed: boolean }) {
  const date = new Date(ms);
  const week = isoWeek(date);
  const year = date.getFullYear();
  const offset = formatOffset(tzOffsetMinutes(ms, localTimeZone));
  const relative = formatRelative(ms, now);
  const doy = dayOfYear(date);
  const leap = isLeapYear(year);

  const rows: { label: string; value: string; hint?: string }[] = [
    { label: 'Unix seconds', value: String(Math.floor(ms / 1000)) },
    { label: 'Unix ms', value: String(ms) },
    { label: 'ISO 8601', value: date.toISOString(), hint: 'UTC' },
    { label: 'RFC 2822', value: date.toUTCString() },
    { label: 'Local', value: `${localDateTime(ms)} ${offset}`, hint: localTimeZone },
    { label: 'Relative', value: relative },
  ];

  return (
    <div className={cn('flex flex-col gap-3 transition-opacity duration-200', dimmed && 'pointer-events-none opacity-40')}>
      <dl className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle bg-surface-2/40">
        {rows.map((r) => (
          <OutputRow key={r.label} label={r.label} hint={r.hint} value={r.value} />
        ))}
      </dl>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <CopyTile
          label="Day of week"
          value={dtf(undefined, { weekday: 'long' }).format(ms)}
          valueClassName="font-sans font-medium"
        />
        <CopyTile label="ISO week" value={`W${String(week.week).padStart(2, '0')}`} hint={`of ${week.year}`} />
        <CopyTile label="Day of year" value={String(doy)} hint={`of ${leap ? 366 : 365}`} />
        <CopyTile
          label="Leap year"
          value={leap ? 'Yes' : 'No'}
          hint={String(year)}
          valueClassName={cn('font-sans font-medium', leap ? 'text-success' : 'text-muted-foreground')}
        />
      </div>
    </div>
  );
}

function OutputRow({ label, value, hint }: { label: string; value: string; hint?: ReactNode }) {
  return (
    <div className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-2">
      <dt className="w-20 shrink-0 sm:w-28">
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
        {hint && <span className="block truncate text-2xs text-muted-foreground/70">{hint}</span>}
      </dt>
      <dd className="min-w-0 flex-1 break-words font-mono text-13 tabular-nums text-foreground">{value}</dd>
      <CopyButton value={value} message={`${label} copied`} aria-label={`Copy ${label}`} />
    </div>
  );
}
