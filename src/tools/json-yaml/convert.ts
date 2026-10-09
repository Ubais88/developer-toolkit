import { parseAllDocuments, stringify, YAMLParseError } from 'yaml';

export type Direction = 'json-to-yaml' | 'yaml-to-json';

export interface ConvertError {
  message: string;
  line?: number;
  column?: number;
}

export type ConvertResult =
  | { ok: true; output: string; documents: number }
  | { ok: false; error: ConvertError };

/** 1-based line/column for a character offset. */
function positionAt(text: string, offset: number): { line: number; column: number } {
  const before = text.slice(0, Math.max(0, Math.min(offset, text.length)));
  const lines = before.split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

/** Normalises the differing JSON.parse error messages of V8 / SpiderMonkey / JSC. */
export function jsonError(text: string, err: unknown): ConvertError {
  const raw = err instanceof Error ? err.message : String(err);
  let line: number | undefined;
  let column: number | undefined;

  const lc = raw.match(/line (\d+) column (\d+)/i);
  const pos = raw.match(/position (\d+)/i);
  if (lc) {
    line = Number(lc[1]);
    column = Number(lc[2]);
  } else if (pos) {
    ({ line, column } = positionAt(text, Number(pos[1])));
  }

  const message =
    raw
      .replace(/^JSON\.parse:\s*/i, '')
      .replace(/\s*(in JSON\s*)?at position \d+.*$/i, '')
      .replace(/\s*at line \d+ column \d+ of the JSON data$/i, '')
      .replace(/\s*\(line \d+ column \d+\)$/i, '')
      .trim() || 'Invalid JSON';

  return { message: message.charAt(0).toUpperCase() + message.slice(1), line, column };
}

function yamlError(err: unknown): ConvertError {
  if (err instanceof YAMLParseError) {
    const message = err.message.split('\n')[0].replace(/\s*at line \d+, column \d+:?$/i, '');
    return { message, line: err.linePos?.[0].line, column: err.linePos?.[0].col };
  }
  return { message: err instanceof Error ? err.message : String(err) };
}

export function convert(input: string, direction: Direction, indent: number): ConvertResult {
  if (!input.trim()) return { ok: true, output: '', documents: 0 };

  if (direction === 'json-to-yaml') {
    let data: unknown;
    try {
      data = JSON.parse(input);
    } catch (e) {
      return { ok: false, error: jsonError(input, e) };
    }
    return { ok: true, output: stringify(data, { indent, lineWidth: 0 }), documents: 1 };
  }

  try {
    const docs = parseAllDocuments(input);
    if (!Array.isArray(docs)) return { ok: true, output: '', documents: 0 };
    for (const doc of docs) {
      if (doc.errors.length) throw doc.errors[0];
    }
    const values = docs.map((d) => d.toJS({ maxAliasCount: 1000 }) as unknown);
    const data = values.length > 1 ? values : values[0];
    return { ok: true, output: JSON.stringify(data ?? null, null, indent), documents: values.length };
  } catch (e) {
    return { ok: false, error: yamlError(e) };
  }
}

/** True when text that failed as JSON reads as a YAML mapping or sequence. */
export function looksLikeYaml(text: string): boolean {
  const trimmed = text.trimStart();
  // Broken JSON objects/arrays are usually still valid YAML flow collections — don't misfire on them.
  if (!trimmed || trimmed.startsWith('{') || trimmed.startsWith('[')) return false;
  try {
    const docs = parseAllDocuments(text);
    if (!Array.isArray(docs) || docs.length === 0 || docs.some((d) => d.errors.length)) return false;
    const first: unknown = docs[0].toJS();
    return typeof first === 'object' && first !== null;
  } catch {
    return false;
  }
}
