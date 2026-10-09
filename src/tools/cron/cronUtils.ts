import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';

export type FieldKind = 'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

export interface FieldDef {
  kind: FieldKind;
  label: string;
  range: string;
}

export const FIELD_DEFS: Record<FieldKind, FieldDef> = {
  second: { kind: 'second', label: 'Second', range: '0–59' },
  minute: { kind: 'minute', label: 'Minute', range: '0–59' },
  hour: { kind: 'hour', label: 'Hour', range: '0–23' },
  dayOfMonth: { kind: 'dayOfMonth', label: 'Day of month', range: '1–31 · L ?' },
  month: { kind: 'month', label: 'Month', range: '1–12 · JAN–DEC' },
  dayOfWeek: { kind: 'dayOfWeek', label: 'Day of week', range: '0–7 · SUN–SAT' },
};

const FIVE: FieldKind[] = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];
const SIX: FieldKind[] = ['second', ...FIVE];

/** Non-standard macros, expanded to their classic 5-field form for the breakdown. */
export const MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

export interface Token {
  value: string;
  start: number;
  end: number;
}

export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr))) tokens.push({ value: m[0], start: m.index, end: m.index + m[0].length });
  return tokens;
}

/** Index of the token the caret is in (or about to type into). */
export function tokenAtCaret(tokens: Token[], caret: number | null): number {
  if (caret === null) return -1;
  const inside = tokens.findIndex((t) => caret >= t.start && caret <= t.end);
  if (inside !== -1) return inside;
  return tokens.findIndex((t) => t.start > caret);
}

// ── Field descriptions ──────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const UNIT: Record<FieldKind, [string, string]> = {
  second: ['second', 'seconds'],
  minute: ['minute', 'minutes'],
  hour: ['hour', 'hours'],
  dayOfMonth: ['day', 'days'],
  month: ['month', 'months'],
  dayOfWeek: ['weekday', 'weekdays'],
};

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

function named(v: string, kind: FieldKind): string {
  const upper = v.toUpperCase();
  if (kind === 'month') {
    if (/^\d+$/.test(v)) return MONTHS[Number(v) - 1] ?? v;
    return upper.charAt(0) + upper.slice(1, 3).toLowerCase();
  }
  if (kind === 'dayOfWeek') {
    if (/^\d+$/.test(v)) return DAYS[Number(v)] ?? v;
    return upper.charAt(0) + upper.slice(1, 3).toLowerCase();
  }
  return v;
}

function single(v: string, kind: FieldKind): string {
  const pad = v.padStart(2, '0');
  switch (kind) {
    case 'second':
      return `:${pad}s`;
    case 'minute':
      return `:${pad}`;
    case 'hour':
      return `${pad}h`;
    case 'dayOfMonth':
      return v === 'L' ? 'last day' : `day ${v}`;
    default:
      return named(v, kind);
  }
}

function describePart(part: string, kind: FieldKind): string {
  const [one, many] = UNIT[kind];
  if (part === '*' || part === '?') {
    if (kind === 'dayOfMonth' || kind === 'dayOfWeek') return part === '?' ? 'any (unspecified)' : 'every day';
    return `every ${one}`;
  }
  const step = /^(.+)\/(\d+)$/.exec(part);
  if (step) {
    const [, base, n] = step;
    const every = n === '1' ? `every ${one}` : `every ${n} ${many}`;
    if (base === '*') return every;
    const range = /^(\w+)-(\w+)$/.exec(base);
    if (range) return `${every}, ${named(range[1], kind)}–${named(range[2], kind)}`;
    return `${every} from ${single(base, kind)}`;
  }
  const range = /^(\w+)-(\w+)$/.exec(part);
  if (range) {
    if (kind === 'month' || kind === 'dayOfWeek') return `${named(range[1], kind)}–${named(range[2], kind)}`;
    return `${single(range[1], kind)} – ${single(range[2], kind)}`;
  }
  if (kind === 'dayOfWeek') {
    const last = /^(\w+)L$/i.exec(part);
    if (last) return `last ${named(last[1], kind)} of month`;
    const nth = /^(\w+)#(\d)$/.exec(part);
    if (nth) return `${ordinal(Number(nth[2]))} ${named(nth[1], kind)} of month`;
  }
  if (kind === 'dayOfMonth' && /^L-\d+$/i.test(part)) return `${part.slice(2)} days before last`;
  return single(part, kind);
}

export function describeField(raw: string, kind: FieldKind): string {
  return raw
    .split(',')
    .map((p) => describePart(p, kind))
    .join(', ');
}

// ── Analysis ────────────────────────────────────────────────────────────

export interface FieldInfo {
  kind: FieldKind;
  value: string;
  meaning: string;
  valid: boolean;
  /** Token index in the raw input (-1 when expanded from a macro). */
  tokenIndex: number;
}

export type CronAnalysis =
  | { ok: true; description: string; fields: FieldInfo[]; hasSeconds: boolean; macro?: string; expression: string }
  | { ok: false; error: string; fields: FieldInfo[] };

const cronstrueOptions = { use24HourTimeFormat: true, verbose: true, throwExceptionOnParseError: true };

function fieldValid(kind: FieldKind, value: string): boolean {
  const kinds = SIX;
  const probe = kinds.map((k) => (k === kind ? value : k === 'second' || k === 'minute' || k === 'hour' ? '0' : '*'));
  try {
    CronExpressionParser.parse(probe.join(' '), { currentDate: new Date(0), tz: 'UTC' });
    return true;
  } catch {
    return false;
  }
}

const cleanError = (e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.replace(/^Error:\s*/, '').trim() || 'Invalid cron expression';
};

export function analyzeCron(input: string): CronAnalysis {
  const expr = input.trim().replace(/\s+/g, ' ');
  const macroKey = expr.toLowerCase();
  const macro = MACROS[macroKey];
  const tokens = macro ? tokenize(macro) : tokenize(input);
  const kinds = tokens.length === 6 ? SIX : FIVE;
  const fields: FieldInfo[] = tokens.slice(0, kinds.length).map((t, i) => ({
    kind: kinds[i],
    value: t.value,
    meaning: describeField(t.value, kinds[i]),
    valid: fieldValid(kinds[i], t.value),
    tokenIndex: macro ? -1 : i,
  }));

  if (!expr) return { ok: false, error: 'Enter a cron expression, e.g. */15 * * * *', fields };
  if (!macro && (tokens.length < 5 || tokens.length > 6)) {
    return {
      ok: false,
      error: `Expected 5 fields (or 6 with seconds) but found ${tokens.length}.`,
      fields,
    };
  }
  const normalized = macro ?? expr;
  try {
    CronExpressionParser.parse(normalized, { currentDate: new Date(), tz: 'UTC' });
  } catch (e) {
    return { ok: false, error: cleanError(e), fields };
  }
  let description: string;
  try {
    description = cronstrue.toString(normalized, cronstrueOptions);
  } catch (e) {
    return { ok: false, error: cleanError(e), fields };
  }
  return { ok: true, description, fields, hasSeconds: kinds.length === 6, macro: macro ? macroKey : undefined, expression: normalized };
}

/** Next `count` run times (epoch ms) for a validated expression, evaluated in `tz`. */
export function nextRuns(expression: string, tz: string, from: number, count = 10): { runs: number[]; error?: string } {
  try {
    const it = CronExpressionParser.parse(expression, { tz, currentDate: new Date(from) });
    const runs: number[] = [];
    for (let i = 0; i < count && it.hasNext(); i++) runs.push(it.next().toDate().getTime());
    return { runs };
  } catch (e) {
    return { runs: [], error: cleanError(e) };
  }
}
