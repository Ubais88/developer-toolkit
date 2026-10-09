/**
 * Dependency-free JSON → TypeScript declaration generator.
 *
 * Works in two passes:
 *  1. Every JSON value is folded into a `Shape` that records which kinds of values were
 *     observed at that position (arrays of objects merge all their element shapes).
 *  2. Shapes are rendered into declarations. Nested objects become named types,
 *     de-duplicated by structural signature, emitted in discovery order after the root.
 */

export interface JsonToTsOptions {
  rootName: string;
  declaration: 'interface' | 'type';
  exportTypes: boolean;
  readonly: boolean;
  /** `null` → optional `?:` instead of `| null` */
  optionalNulls: boolean;
  /** Annotate ISO-8601 date strings with a `// ISO 8601 date` comment */
  inferDates: boolean;
  /** `T[]` vs `Array<T>` */
  arrayStyle: 'brackets' | 'generic';
  indent: 2 | 4;
}

export const DEFAULT_JSON_TO_TS_OPTIONS: JsonToTsOptions = {
  rootName: 'Root',
  declaration: 'interface',
  exportTypes: true,
  readonly: false,
  optionalNulls: false,
  inferDates: true,
  arrayStyle: 'brackets',
  indent: 2,
};

/* ───────────────────────────── Shapes ───────────────────────────── */

interface FieldShape {
  /** Number of object samples that contained this key */
  present: number;
  shape: Shape;
}

interface ObjectShape {
  count: number;
  fields: Map<string, FieldShape>;
}

interface Shape {
  samples: number;
  nulls: number;
  strings: number;
  dates: number;
  numbers: number;
  booleans: number;
  object: ObjectShape | null;
  /** Merged shape of every element of every array seen here */
  array: Shape | null;
}

const newShape = (): Shape => ({
  samples: 0,
  nulls: 0,
  strings: 0,
  dates: 0,
  numbers: 0,
  booleans: 0,
  object: null,
  array: null,
});

const ISO_DATE =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

const isIsoDate = (s: string) => ISO_DATE.test(s) && !Number.isNaN(Date.parse(s));

function addValue(shape: Shape, value: unknown): void {
  shape.samples++;
  if (value === null || value === undefined) {
    shape.nulls++;
  } else if (typeof value === 'string') {
    shape.strings++;
    if (isIsoDate(value)) shape.dates++;
  } else if (typeof value === 'number' || typeof value === 'bigint') {
    shape.numbers++;
  } else if (typeof value === 'boolean') {
    shape.booleans++;
  } else if (Array.isArray(value)) {
    shape.array ??= newShape();
    for (const item of value) addValue(shape.array, item);
  } else if (typeof value === 'object') {
    const obj = (shape.object ??= { count: 0, fields: new Map() });
    obj.count++;
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      let field = obj.fields.get(key);
      if (!field) {
        field = { present: 0, shape: newShape() };
        obj.fields.set(key, field);
      }
      field.present++;
      addValue(field.shape, v);
    }
  } else {
    // functions / symbols can't come from JSON — treat as unknown-ish strings
    shape.strings++;
  }
}

/* ─────────────────────────── Signatures ─────────────────────────── */

/** Structural, name-independent signature used to dedupe identical object shapes. */
function makeSignatures() {
  const objCache = new WeakMap<ObjectShape, string>();

  const shapeSig = (s: Shape): string => {
    const parts: string[] = [];
    if (s.strings) parts.push(s.dates === s.strings ? 'D' : 'S');
    if (s.numbers) parts.push('N');
    if (s.booleans) parts.push('B');
    if (s.object) parts.push(objectSig(s.object));
    if (s.array) parts.push(`[${s.array.samples ? shapeSig(s.array) : '?'}]`);
    if (s.nulls) parts.push('0');
    return parts.join('|') || '?';
  };

  const objectSig = (o: ObjectShape): string => {
    const cached = objCache.get(o);
    if (cached) return cached;
    const keys = [...o.fields.keys()].sort();
    const sig = `{${keys
      .map((k) => {
        const f = o.fields.get(k)!;
        return `${JSON.stringify(k)}${f.present < o.count ? '?' : ''}:${shapeSig(f.shape)}`;
      })
      .join(',')}}`;
    objCache.set(o, sig);
    return sig;
  };

  return { objectSig };
}

/* ───────────────────────────── Naming ───────────────────────────── */

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Global type names that would shadow / merge with built-ins (ES + common DOM). */
const RESERVED = new Set([
  'Array', 'ReadonlyArray', 'String', 'Number', 'Boolean', 'Object', 'Function', 'Symbol', 'BigInt',
  'Date', 'Error', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'RegExp', 'JSON', 'Math', 'Record',
  'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Exclude', 'Extract', 'Iterator', 'Generator',
  'Proxy', 'Reflect', 'Intl', 'Event', 'Location', 'Node', 'Element', 'Document', 'Window', 'Image',
  'Comment', 'Text', 'File', 'Blob', 'Response', 'Request', 'Headers', 'URL', 'Storage', 'Option',
  'Range', 'Selection', 'Attr', 'History', 'Navigator', 'Screen', 'Notification', 'Animation',
  'Plugin', 'Credential', 'Performance', 'Position', 'Touch', 'Audio', 'Worker', 'Report',
  'Permissions', 'Clipboard', 'Crypto', 'Cache', 'Body', 'Lock', 'Gamepad', 'MediaSource',
  'Any', 'Unknown', 'Never', 'Null', 'Undefined', 'Void',
]);

/** Keywords that can't be used as type names. */
const KEYWORDS = new Set([
  'any', 'unknown', 'never', 'null', 'undefined', 'void', 'string', 'number', 'boolean', 'object',
  'symbol', 'bigint', 'type', 'interface', 'class', 'enum', 'const', 'let', 'var', 'function',
]);

export function toPascalCase(input: string): string {
  const words = input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  let name = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  if (!name) return '';
  if (/^\d/.test(name)) name = `Type${name}`;
  return name;
}

const IRREGULAR: Record<string, string> = {
  people: 'person',
  children: 'child',
  men: 'man',
  women: 'woman',
  mice: 'mouse',
  geese: 'goose',
  teeth: 'tooth',
  feet: 'foot',
  indices: 'index',
  matrices: 'matrix',
  vertices: 'vertex',
  criteria: 'criterion',
  analyses: 'analysis',
  movies: 'movie',
  cookies: 'cookie',
  zombies: 'zombie',
  statuses: 'status',
  buses: 'bus',
  aliases: 'alias',
  shoes: 'shoe',
  toes: 'toe',
};

const UNCOUNTABLE = new Set(['series', 'species', 'news', 'data', 'info', 'metadata', 'status', 'sheep', 'fish']);

/** Naive English singularisation of the last word of a PascalCase name. */
export function singularize(pascal: string): string {
  const match = /[A-Z]?[a-z]+$/.exec(pascal);
  if (!match) return pascal;
  const head = pascal.slice(0, match.index);
  const word = match[0];
  const lower = word.toLowerCase();
  const restoreCase = (w: string) => (word[0] === word[0].toUpperCase() ? w[0].toUpperCase() + w.slice(1) : w);

  if (UNCOUNTABLE.has(lower)) return pascal;
  if (IRREGULAR[lower]) return head + restoreCase(IRREGULAR[lower]);
  let single = lower;
  if (/[^aeiou]ies$/.test(lower)) single = lower.slice(0, -3) + 'y';
  else if (/(ss|sh|ch|x|z)es$/.test(lower)) single = lower.slice(0, -2);
  else if (/[^siu]s$/.test(lower) && lower.length > 2) single = lower.slice(0, -1);
  return single === lower ? pascal : head + restoreCase(single);
}

const quoteKey = (key: string) => (IDENTIFIER.test(key) ? key : JSON.stringify(key));

/* ──────────────────────────── Rendering ─────────────────────────── */

interface Rendered {
  text: string;
  /** Needs parentheses when used as an array element in `T[]` form */
  wrap: boolean;
}

const DATE_COMMENT = ' // ISO 8601 date';

function isDateOnly(s: Shape): boolean {
  if (s.object || s.numbers || s.booleans) return false;
  if (s.array) return !s.strings && s.array.samples > 0 && isDateOnly(s.array);
  return s.strings > 0 && s.dates === s.strings;
}

export function jsonToTs(input: unknown, options: JsonToTsOptions): string {
  const opts = { ...DEFAULT_JSON_TO_TS_OPTIONS, ...options };
  const pad = ' '.repeat(opts.indent === 4 ? 4 : 2);
  const exp = opts.exportTypes ? 'export ' : '';
  const ro = opts.readonly ? 'readonly ' : '';
  const { objectSig } = makeSignatures();

  const trimmedRoot = (opts.rootName ?? '').trim();
  const rootName =
    IDENTIFIER.test(trimmedRoot) && !KEYWORDS.has(trimmedRoot) ? trimmedRoot : toPascalCase(trimmedRoot) || 'Root';

  const taken = new Set<string>([rootName]);
  const nameBySig = new Map<string, string>();
  const queue: { name: string; obj: ObjectShape }[] = [];

  const uniqueName = (hint: string): string => {
    let base = toPascalCase(hint) || 'Item';
    if (RESERVED.has(base)) base = `${base}Data`;
    let name = base;
    for (let i = 2; taken.has(name); i++) name = `${base}${i}`;
    taken.add(name);
    return name;
  };

  const nameFor = (obj: ObjectShape, hint: string): string => {
    const sig = objectSig(obj);
    const existing = nameBySig.get(sig);
    if (existing) return existing;
    const name = uniqueName(hint);
    nameBySig.set(sig, name);
    queue.push({ name, obj });
    return name;
  };

  const itemHintFor = (hint: string) => {
    const single = singularize(hint);
    return single !== hint ? single : `${hint}Item`;
  };

  const renderArray = (item: Shape, itemHint: string): Rendered => {
    const inner: Rendered = item.samples ? renderShape(item, itemHint, itemHint, false) : { text: 'unknown', wrap: false };
    if (opts.arrayStyle === 'generic') {
      return { text: `${opts.readonly ? 'ReadonlyArray' : 'Array'}<${inner.text}>`, wrap: false };
    }
    const el = inner.wrap ? `(${inner.text})` : inner.text;
    return { text: `${ro}${el}[]`, wrap: opts.readonly };
  };

  function renderShape(shape: Shape, hint: string, itemHint: string, omitNull: boolean): Rendered {
    const members: string[] = [];
    let wrap = false;
    if (shape.strings) members.push('string');
    if (shape.numbers) members.push('number');
    if (shape.booleans) members.push('boolean');
    if (shape.object) {
      members.push(shape.object.fields.size ? nameFor(shape.object, hint) : 'Record<string, unknown>');
    }
    if (shape.array) {
      const arr = renderArray(shape.array, itemHint);
      members.push(arr.text);
      wrap = arr.wrap;
    }
    if (shape.nulls && !omitNull) members.push('null');
    if (!members.length) return { text: 'unknown', wrap: false };
    return { text: members.join(' | '), wrap: wrap || members.length > 1 };
  }

  const renderBody = (obj: ObjectShape): string[] =>
    [...obj.fields].map(([key, field]) => {
      const optional = field.present < obj.count || (opts.optionalNulls && field.shape.nulls > 0);
      const hint = toPascalCase(key) || 'Item';
      const { text } = renderShape(field.shape, hint, itemHintFor(hint), opts.optionalNulls);
      const comment = opts.inferDates && isDateOnly(field.shape) ? DATE_COMMENT : '';
      return `${pad}${ro}${quoteKey(key)}${optional ? '?' : ''}: ${text};${comment}`;
    });

  const declare = (name: string, obj: ObjectShape): string => {
    const body = renderBody(obj).join('\n');
    return opts.declaration === 'interface'
      ? `${exp}interface ${name} {\n${body}\n}`
      : `${exp}type ${name} = {\n${body}\n};`;
  };

  const root = newShape();
  addValue(root, input);

  const blocks: string[] = [];
  const isPlainObjectRoot =
    !!root.object && root.object.fields.size > 0 && !root.array && !root.nulls && !root.strings && !root.numbers && !root.booleans;

  if (isPlainObjectRoot) {
    nameBySig.set(objectSig(root.object!), rootName);
    queue.push({ name: rootName, obj: root.object! });
  } else {
    const { text } = renderShape(root, rootName, itemHintFor(rootName), false);
    const comment = opts.inferDates && isDateOnly(root) ? DATE_COMMENT : '';
    blocks.push(`${exp}type ${rootName} = ${text};${comment}`);
  }

  // Rendering a declaration may enqueue more nested types — process in discovery order.
  for (let i = 0; i < queue.length; i++) blocks.push(declare(queue[i].name, queue[i].obj));

  return `${blocks.join('\n\n')}\n`;
}

/** Number of top-level declarations in generated output. */
export function countDeclarations(ts: string): number {
  return (ts.match(/^(?:export )?(?:interface|type) /gm) ?? []).length;
}
