import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe2, Moon, Plus, RotateCcw, Search, Sun, Sunrise, Sunset, X } from 'lucide-react';
import { Badge, Button, Card, CardHeader, IconButton, Input, Kbd, Tooltip, cn } from '../../components/ui';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  allTimeZones,
  dayDiffFromLocal,
  dtf,
  formatOffset,
  isValidTimeZone,
  localTimeZone,
  modernZone,
  tzOffsetMinutes,
  zoneCity,
  zonedParts,
  zoneRegion,
} from './timeUtils';

const DEFAULT_ZONES = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'];
const spring = { type: 'spring', stiffness: 460, damping: 36 } as const;

interface TimezonesCardProps {
  /** Instant to display (input value, or live now). */
  ms: number;
  live: boolean;
}

export function TimezonesCard({ ms, live }: TimezonesCardProps) {
  const [stored, setZones] = useLocalStorage<string[]>('time-zones', DEFAULT_ZONES);
  const zones = useMemo(() => (Array.isArray(stored) ? stored.filter(isValidTimeZone) : DEFAULT_ZONES), [stored]);
  const [picking, setPicking] = useState(false);

  const add = (tz: string) => setZones((prev) => (prev.includes(tz) ? prev : [...prev, tz]));
  const remove = (tz: string) => setZones((prev) => prev.filter((z) => z !== tz));
  const isDefault = zones.length === DEFAULT_ZONES.length && zones.every((z, i) => z === DEFAULT_ZONES[i]);

  return (
    <Card className="flex min-w-0 flex-col">
      <CardHeader
        title="Timezones"
        description={live ? 'Live — current time everywhere' : 'Showing the converted input time'}
        icon={<Globe2 />}
        actions={
          <>
            {!isDefault && (
              <IconButton label="Reset to defaults" size="sm" onClick={() => setZones(DEFAULT_ZONES)}>
                <RotateCcw />
              </IconButton>
            )}
            <Button
              variant={picking ? 'subtle' : 'secondary'}
              size="xs"
              onClick={() => setPicking((p) => !p)}
              aria-expanded={picking}
            >
              <Plus className={cn('h-3.5 w-3.5 transition-transform duration-200', picking && 'rotate-45')} />
              {picking ? 'Close' : 'Add'}
            </Button>
          </>
        }
      />

      <AnimatePresence initial={false}>
        {picking && (
          <motion.div
            key="picker"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className="overflow-hidden border-b border-border-subtle"
          >
            <ZonePicker ms={ms} pinned={zones} onPick={add} onClose={() => setPicking(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-2">
        {zones.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <p className="text-13 font-medium">No timezones pinned</p>
            <p className="text-xs text-muted-foreground">Add a few cities to compare times at a glance.</p>
            <Button variant="secondary" size="xs" onClick={() => setPicking(true)}>
              <Plus className="h-3.5 w-3.5" /> Add timezone
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {zones.map((tz) => (
                <ZoneRow key={tz} tz={tz} ms={ms} onRemove={() => remove(tz)} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </Card>
  );
}

function dayPhaseIcon(hour: number) {
  if (hour >= 5 && hour < 8) return { icon: <Sunrise />, tone: 'text-warning', label: 'Morning' };
  if (hour >= 8 && hour < 17) return { icon: <Sun />, tone: 'text-warning', label: 'Daytime' };
  if (hour >= 17 && hour < 20) return { icon: <Sunset />, tone: 'text-primary', label: 'Evening' };
  return { icon: <Moon />, tone: 'text-primary', label: 'Night' };
}

function ZoneRow({ tz, ms, onRemove }: { tz: string; ms: number; onRemove: () => void }) {
  const parts = zonedParts(ms, tz);
  const offset = formatOffset(tzOffsetMinutes(ms, tz));
  const diff = dayDiffFromLocal(ms, tz);
  const phase = dayPhaseIcon(parts.hour);
  const time = dtf(tz, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(ms);
  const date = dtf(tz, { weekday: 'short', month: 'short', day: 'numeric' }).format(ms);
  const isLocal = modernZone(tz) === localTimeZone || modernZone(dtf(tz, {}).resolvedOptions().timeZone) === localTimeZone;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
      transition={spring}
      className="group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-2"
    >
      <Tooltip content={phase.label}>
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-2 [&_svg]:h-4 [&_svg]:w-4',
            phase.tone,
          )}
        >
          {phase.icon}
        </span>
      </Tooltip>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-13 font-medium">{tz === 'UTC' ? 'UTC' : zoneCity(tz)}</span>
          {isLocal && <Badge tone="primary">Local</Badge>}
        </div>
        <div className="truncate text-2xs text-muted-foreground">
          {tz === 'UTC' ? 'Coordinated Universal Time' : zoneRegion(tz)} · <span className="font-mono">{offset}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="font-mono text-[15px] font-medium tabular-nums leading-5">{time}</span>
        <span className="flex items-center gap-1 text-2xs text-muted-foreground">
          {diff !== 0 && (
            <span className={cn('font-medium', diff > 0 ? 'text-success' : 'text-warning')}>
              {diff > 0 ? `+${diff}` : `−${Math.abs(diff)}`} day{Math.abs(diff) === 1 ? '' : 's'}
            </span>
          )}
          {diff !== 0 && <span aria-hidden>·</span>}
          {date}
        </span>
      </div>
      <IconButton
        label={`Remove ${tz}`}
        size="sm"
        onClick={onRemove}
        className="opacity-100 sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100"
      >
        <X />
      </IconButton>
    </motion.li>
  );
}

function ZonePicker({
  ms,
  pinned,
  onPick,
  onClose,
}: {
  ms: number;
  pinned: string[];
  onPick: (tz: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[_\s]+/g, ' ');
    const pinnedSet = new Set(pinned);
    return allTimeZones()
      .filter((tz) => !pinnedSet.has(tz))
      .filter((tz) => !q || tz.toLowerCase().replace(/_/g, ' ').includes(q))
      .slice(0, 80);
  }, [query, pinned]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter' && results[0]) {
      e.preventDefault();
      onPick(results[0]);
      setQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      listRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Escape') return;
    e.preventDefault();
    if (e.key === 'Escape') return onClose();
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = buttons[i + (e.key === 'ArrowDown' ? 1 : -1)];
    next?.focus();
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <Input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search city or region…"
        aria-label="Search timezones"
        leading={<Search />}
        className="h-8"
      />
      <ul
        ref={listRef}
        onKeyDown={onListKeyDown}
        className="max-h-56 overflow-y-auto rounded-md border border-border-subtle bg-background/40 p-1"
        aria-label="Timezone results"
      >
        {results.length === 0 ? (
          <li className="px-3 py-6 text-center text-xs text-muted-foreground">No matching timezones</li>
        ) : (
          results.map((tz) => (
            <li key={tz}>
              <button
                type="button"
                onClick={() => onPick(tz)}
                className="focus-ring flex w-full items-center justify-between gap-3 rounded px-2.5 py-1.5 text-left text-13 transition-colors hover:bg-surface-3 focus-visible:bg-surface-3"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium">{tz === 'UTC' ? 'UTC' : zoneCity(tz)}</span>
                  <span className="ml-2 text-2xs text-muted-foreground">{tz}</span>
                </span>
                <span className="shrink-0 font-mono text-2xs tabular-nums text-muted-foreground">
                  {formatOffset(tzOffsetMinutes(ms, tz))}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
      <p className="hidden items-center gap-1.5 text-2xs text-muted-foreground sm:flex">
        <Kbd combo="enter" size="sm" /> adds the first match <span aria-hidden>·</span> <Kbd combo="arrowdown" size="sm" />
        to browse <span aria-hidden>·</span> <Kbd combo="esc" size="sm" /> closes
      </p>
    </div>
  );
}
