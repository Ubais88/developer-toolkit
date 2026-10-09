/** Pure date/time helpers for the Timestamp tool. Everything is built on `Intl` — no date libraries. */

export type InputKind = 'now' | 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds' | 'iso' | 'rfc' | 'date';

export const KIND_LABEL: Record<InputKind, string> = {
  now: 'Now',
  seconds: 'Unix seconds',
  milliseconds: 'Unix milliseconds',
  microseconds: 'Unix microseconds',
  nanoseconds: 'Unix nanoseconds',
  iso: 'ISO 8601',
  rfc: 'RFC 2822',
  date: 'Date string',
};

export type ParseResult =
  | { ok: true; ms: number; kind: InputKind }
  | { ok: false; error: string };

const MAX_MS = 8.64e15; // ECMAScript Date range

const ISO_RE = /^[+-]?\d{4,6}-\d{2}(-\d{2})?([T\s]\d{2}:\d{2}(:\d{2}(\.\d+)?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i;
const RFC_RE = /^(mon|tue|wed|thu|fri|sat|sun),?\s+\d{1,2}\s+[a-z]{3}\s+\d{2,4}/i;

/** Detects the format of a free-form timestamp / date string and resolves it to epoch milliseconds. */
export function parseTimeInput(raw: string, now: number): ParseResult | null {
  const input = raw.trim();
  if (!input) return null;
  if (/^now$/i.test(input)) return { ok: true, ms: now, kind: 'now' };

  const numeric = /^(-?)(\d+)(?:\.(\d+))?$/.exec(input);
  if (numeric) {
    const [, sign, int, frac] = numeric;
    const digits = int.replace(/^0+(?=\d)/, '').length;
    let ms: number;
    let kind: InputKind;
    if (digits <= 11) {
      kind = 'seconds';
      ms = Number(`${sign}${int}${frac ? `.${frac}` : ''}`) * 1000;
    } else if (digits <= 14) {
      kind = 'milliseconds';
      ms = Number(`${sign}${int}`);
    } else if (digits <= 17) {
      kind = 'microseconds';
      ms = Number(BigInt(`${sign}${int}`) / 1000n);
    } else if (digits <= 20) {
      kind = 'nanoseconds';
      ms = Number(BigInt(`${sign}${int}`) / 1000000n);
    } else {
      return { ok: false, error: `Number is too large to be a timestamp (${digits} digits).` };
    }
    if (Math.abs(ms) > MAX_MS) return { ok: false, error: 'Timestamp is outside the supported date range.' };
    return { ok: true, ms: Math.round(ms), kind };
  }

  const parsed = Date.parse(input);
  if (Number.isNaN(parsed)) {
    return { ok: false, error: `Couldn't read "${input.length > 40 ? `${input.slice(0, 40)}…` : input}" as a date or timestamp.` };
  }
  const kind: InputKind = ISO_RE.test(input) ? 'iso' : RFC_RE.test(input) ? 'rfc' : 'date';
  return { ok: true, ms: parsed, kind };
}

/** Writes `ms` back out in the same style as the user's input (so quick actions keep their format). */
export function formatAs(ms: number, kind: InputKind | undefined): string {
  switch (kind) {
    case 'milliseconds':
      return String(Math.round(ms));
    case 'microseconds':
      return (BigInt(Math.round(ms)) * 1000n).toString();
    case 'nanoseconds':
      return (BigInt(Math.round(ms)) * 1000000n).toString();
    case 'iso':
    case 'date':
      return new Date(ms).toISOString();
    case 'rfc':
      return new Date(ms).toUTCString();
    default:
      return String(Math.floor(ms / 1000));
  }
}

// ── Intl helpers ─────────────────────────────────────────────────────────

const fmtCache = new Map<string, Intl.DateTimeFormat>();

/** Memoised `Intl.DateTimeFormat` — constructing these is comparatively expensive. */
export function dtf(timeZone: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${timeZone ?? ''}|${JSON.stringify(options)}`;
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(undefined, { ...options, timeZone });
    fmtCache.set(key, f);
  }
  return f;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// ICU still reports a few legacy ids — prefer the modern spellings people actually search for.
const MODERN_ZONE: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Rangoon': 'Asia/Yangon',
  'Europe/Kiev': 'Europe/Kyiv',
  'Atlantic/Faeroe': 'Atlantic/Faroe',
  'America/Godthab': 'America/Nuuk',
  'Etc/UTC': 'UTC',
};

/** Maps legacy IANA aliases (e.g. Asia/Calcutta) to their modern names when the runtime supports them. */
export function modernZone(tz: string): string {
  const m = MODERN_ZONE[tz];
  return m && isValidTimeZone(m) ? m : tz;
}

export const localTimeZone = (() => {
  try {
    return modernZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  } catch {
    return 'UTC';
  }
})();

let zoneList: string[] | null = null;
/** All IANA zones the runtime knows about (plus UTC). */
export function allTimeZones(): string[] {
  if (zoneList) return zoneList;
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  let zones: string[] = [];
  try {
    zones = intl.supportedValuesOf?.('timeZone') ?? [];
  } catch {
    zones = [];
  }
  if (!zones.length) {
    zones = ['America/Los_Angeles', 'America/Chicago', 'America/New_York', 'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Africa/Cairo', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland'];
  }
  zoneList = Array.from(new Set(['UTC', ...zones.map(modernZone)])).sort((a, b) =>
    a === 'UTC' ? -1 : b === 'UTC' ? 1 : a.localeCompare(b),
  );
  return zoneList;
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function zonedParts(ms: number, timeZone: string): ZonedParts {
  const parts = dtf(timeZone, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
    era: 'short',
  }).formatToParts(ms);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const era = parts.find((p) => p.type === 'era')?.value ?? '';
  const year = get('year');
  return {
    // Intl reports BC years as positive numbers with an era; convert to astronomical numbering.
    year: /^B/i.test(era) ? 1 - year : year,
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
    second: get('second'),
  };
}

/** UTC offset of `timeZone` at instant `ms`, in minutes. */
export function tzOffsetMinutes(ms: number, timeZone: string): number {
  const p = zonedParts(ms, timeZone);
  const d = new Date(utcDay(p));
  d.setUTCHours(p.hour, p.minute, p.second, 0);
  const floored = Math.floor(ms / 1000) * 1000;
  return Math.round((d.getTime() - floored) / 60000);
}

/** "GMT+5:30", "GMT−4", "GMT+0" */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '−' : '+';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

/** Calendar-day difference between `timeZone` and the browser's local zone at instant `ms`. */
export function dayDiffFromLocal(ms: number, timeZone: string): number {
  const a = zonedParts(ms, timeZone);
  const b = zonedParts(ms, localTimeZone);
  return Math.round((utcDay(a) - utcDay(b)) / 86400000);
}

function utcDay(p: ZonedParts): number {
  const d = new Date(0);
  d.setUTCFullYear(p.year, p.month - 1, p.day);
  return d.getTime();
}

/** "Asia/Kolkata" → "Kolkata", "America/Argentina/Buenos_Aires" → "Buenos Aires" */
export function zoneCity(tz: string): string {
  if (tz === 'UTC' || tz === 'Etc/UTC') return 'Coordinated Universal Time';
  const last = tz.split('/').pop() ?? tz;
  return last.replace(/_/g, ' ');
}

export function zoneRegion(tz: string): string {
  const parts = tz.split('/');
  return parts.length > 1 ? parts.slice(0, -1).join(' / ').replace(/_/g, ' ') : 'UTC';
}

// ── Calendar facts (evaluated in the local zone) ────────────────────────

export function isoWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return { week: Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7), year: d.getUTCFullYear() };
}

export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today - start) / 86400000) + 1;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** ISO week start (Monday 00:00 local). */
export function startOfLocalWeek(ms: number): number {
  const d = new Date(startOfLocalDay(ms));
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d.getTime();
}
