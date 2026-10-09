import { JSONPath } from 'jsonpath-plus';

export type ResultMode = 'value' | 'path';

export type QueryResult =
  | { ok: true; matches: unknown[] }
  | { ok: false; source: 'json' | 'path'; message: string };

export type ParsedJson = { ok: true; data: unknown } | { ok: false; message: string; line?: number; column?: number };

/** JSON.parse with a browser-agnostic, human friendly error (message + 1-based line/column). */
export function parseJson(text: string): ParsedJson {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    let line: number | undefined;
    let column: number | undefined;
    const lc = raw.match(/line (\d+) column (\d+)/i);
    const pos = raw.match(/position (\d+)/i);
    if (lc) {
      line = Number(lc[1]);
      column = Number(lc[2]);
    } else if (pos) {
      const lines = text.slice(0, Number(pos[1])).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }
    const message =
      raw
        .replace(/^JSON\.parse:\s*/i, '')
        .replace(/\s*(in JSON\s*)?at position \d+.*$/i, '')
        .replace(/\s*at line \d+ column \d+ of the JSON data$/i, '')
        .trim() || 'Invalid JSON';
    return { ok: false, message: message.charAt(0).toUpperCase() + message.slice(1), line, column };
  }
}

export function runQuery(data: unknown, path: string, mode: ResultMode): QueryResult {
  if (!path.startsWith('$')) return { ok: false, source: 'path', message: 'A JSONPath must start with "$"' };
  try {
    const out: unknown = JSONPath({ path, json: data as object, resultType: mode, wrap: true });
    return { ok: true, matches: Array.isArray(out) ? out : out === undefined ? [] : [out] };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, source: 'path', message: message.replace(/^jsonPath: /, '') };
  }
}

export const EXAMPLES = [
  { path: '$.store.book[*].author', hint: 'Authors of all books' },
  { path: '$..author', hint: 'All authors, anywhere' },
  { path: '$.store.*', hint: 'Everything in the store' },
  { path: '$..price', hint: 'Every price' },
  { path: '$..book[2]', hint: 'The third book' },
  { path: '$..book[-1:]', hint: 'The last book' },
  { path: '$..book[0,1]', hint: 'The first two books' },
  { path: '$..book[?(@.isbn)]', hint: 'Books with an ISBN' },
  { path: '$..book[?(@.price<10)]', hint: 'Books cheaper than 10' },
  { path: '$..*', hint: 'Every node' },
];

export const CHEAT_SHEET = [
  { token: '$', desc: 'Root object' },
  { token: '@', desc: 'Current node (in filters)' },
  { token: '.', desc: 'Child member' },
  { token: '..', desc: 'Recursive descent' },
  { token: '*', desc: 'Wildcard: all members' },
  { token: '[]', desc: 'Subscript / child by name or index' },
  { token: '[,]', desc: 'Union of names or indices' },
  { token: '[start:end:step]', desc: 'Array slice' },
  { token: '?()', desc: 'Filter expression' },
  { token: '()', desc: 'Script expression' },
];

export const BOOKSTORE_SAMPLE = `{
  "store": {
    "book": [
      {
        "category": "reference",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95
      },
      {
        "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99
      },
      {
        "category": "fiction",
        "author": "Herman Melville",
        "title": "Moby Dick",
        "isbn": "0-553-21311-3",
        "price": 8.99
      },
      {
        "category": "fiction",
        "author": "J. R. R. Tolkien",
        "title": "The Lord of the Rings",
        "isbn": "0-395-19395-8",
        "price": 22.99
      }
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95
    }
  }
}
`;
