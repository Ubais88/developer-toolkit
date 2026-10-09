export interface Rule {
  id: string;
  find: string;
  replace: string;
  active: boolean;
}

export interface HistoryItem {
  id: string;
  original: string;
  modified: string;
  timestamp: string;
}

export const DEFAULT_RULES: Rule[] = [
  { id: 'default-1', find: 'https://dc.biobrain.io', replace: 'http://localhost:5173', active: true },
  { id: 'default-2', find: 'https://bb-dc-app.azurewebsites.net', replace: 'http://localhost:5173', active: true },
];

export const MAGIC_TOKENS = ['[#token#]', '[#ltid#]', '[#ltuid#]'];

/** Timestamp-ordered UUID (v7). */
export function generateUUIDv7(): string {
  const timestamp = Date.now();
  const value = new Uint8Array(16);
  crypto.getRandomValues(value);
  value[0] = (timestamp / 0x10000000000) & 0xff;
  value[1] = (timestamp / 0x100000000) & 0xff;
  value[2] = (timestamp / 0x1000000) & 0xff;
  value[3] = (timestamp / 0x10000) & 0xff;
  value[4] = (timestamp / 0x100) & 0xff;
  value[5] = timestamp & 0xff;
  value[6] = (value[6] & 0x0f) | 0x70;
  value[8] = (value[8] & 0x3f) | 0x80;
  return [...value]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

export interface GeneratedToken {
  id: string;
  tag: string;
}

/**
 * Replace each magic token occurrence with its own UUIDv7; `generated` collects them in order.
 * `reuse` (tag → ids) keeps previously generated IDs stable, e.g. while the user edits a query param.
 */
export function replaceMagicTokens(value: string, generated: GeneratedToken[] = [], reuse?: Record<string, string[]>): string {
  return MAGIC_TOKENS.reduce((acc, tag) => {
    const queue = [...(reuse?.[tag] ?? [])];
    return acc.split(tag).reduce((out, part, i) => {
      if (i === 0) return part;
      const id = queue.shift() ?? generateUUIDv7();
      generated.push({ id, tag });
      return out + id + part;
    }, '');
  }, value);
}

export interface TransformResult {
  url: string;
  /** Rule id → number of replacements it made */
  matches: Record<string, number>;
  /** IDs substituted for magic tokens, in generation order */
  tokens: GeneratedToken[];
}

/** Apply active find/replace rules (top to bottom) and magic tokens. Throws if the result isn't a valid URL. */
export function transformUrlDetailed(input: string, rules: Rule[], reuse?: Record<string, string[]>): TransformResult {
  let target = input.trim();
  if (!/^https?:\/\//i.test(target)) target = 'http://' + target;
  const matches: Record<string, number> = {};
  for (const r of rules) {
    if (!r.active || !r.find) continue;
    const parts = target.split(r.find);
    matches[r.id] = parts.length - 1;
    target = parts.join(r.replace);
  }
  const tokens: GeneratedToken[] = [];
  target = replaceMagicTokens(target, tokens, reuse);
  const { hostname } = new URL(target); // throws on invalid URLs
  // Chrome tolerates spaces in hosts (as %20); they're never what the user meant
  if (!hostname || /\s|%20/.test(hostname)) throw new TypeError('Invalid host');
  return { url: target, matches, tokens };
}

/** Group generated tokens by tag so they can be fed back as `reuse`. */
export function tokensByTag(tokens: GeneratedToken[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const t of tokens) (out[t.tag] ??= []).push(t.id);
  return out;
}

/**
 * Replace the query string of a source URL with `params`, working on the raw text so magic tokens (which
 * contain `#`) aren't mistaken for the fragment. Values equal to a generated ID go back to their magic token.
 */
export function withSourceParams(source: string, params: { key: string; val: string }[], tokens: GeneratedToken[]): string {
  const mask = (s: string) => MAGIC_TOKENS.reduce((acc, t, i) => acc.split(t).join(`\u0001${i}\u0001`), s);
  const unmask = (s: string) => MAGIC_TOKENS.reduce((acc, t, i) => acc.split(`\u0001${i}\u0001`).join(t), s);
  const masked = mask(source.trim());
  const hashAt = masked.indexOf('#');
  const hash = hashAt === -1 ? '' : masked.slice(hashAt);
  const beforeHash = hashAt === -1 ? masked : masked.slice(0, hashAt);
  const queryAt = beforeHash.indexOf('?');
  const base = queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt);

  const search = new URLSearchParams();
  params.forEach(({ key, val }) => key && search.append(key, val));
  // UUIDs are URL-safe, so they appear verbatim in the encoded query
  const query = tokens.reduce((q, t) => q.split(t.id).join(mask(t.tag)), search.toString());
  return unmask(base + (query ? `?${query}` : '') + hash);
}

export function transformUrl(input: string, rules: Rule[]): string {
  return transformUrlDetailed(input, rules).url;
}

export type SegmentKind = 'protocol' | 'host' | 'path' | 'punct' | 'key' | 'value' | 'token' | 'hash';

/**
 * Splits a URL string into coloured segments without re-serialising it, so the text shown is exactly
 * the text that gets copied. `tokens` are highlighted wherever they appear.
 */
export function urlSegments(url: string, tokens: string[] = []): { text: string; kind: SegmentKind }[] {
  const out: { text: string; kind: SegmentKind }[] = [];
  const pushText = (text: string, kind: SegmentKind) => {
    if (!text) return;
    if (!tokens.length || (kind !== 'value' && kind !== 'path')) return void out.push({ text, kind });
    // Carve generated tokens out of values/paths
    const re = new RegExp(tokens.map((t) => t.replace(/[-]/g, '\\-')).join('|'), 'g');
    let last = 0;
    for (const m of text.matchAll(re)) {
      if (m.index! > last) out.push({ text: text.slice(last, m.index), kind });
      out.push({ text: m[0], kind: 'token' });
      last = m.index! + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last), kind });
  };

  let rest = url;
  const proto = /^[a-z][a-z0-9+.-]*:\/\//i.exec(rest);
  if (proto) {
    pushText(proto[0], 'protocol');
    rest = rest.slice(proto[0].length);
  }
  const hostEnd = rest.search(/[/?#]/);
  pushText(hostEnd === -1 ? rest : rest.slice(0, hostEnd), 'host');
  rest = hostEnd === -1 ? '' : rest.slice(hostEnd);

  const hashAt = rest.indexOf('#');
  const hash = hashAt === -1 ? '' : rest.slice(hashAt);
  rest = hashAt === -1 ? rest : rest.slice(0, hashAt);
  const queryAt = rest.indexOf('?');
  pushText(queryAt === -1 ? rest : rest.slice(0, queryAt), 'path');

  if (queryAt !== -1) {
    pushText('?', 'punct');
    rest.slice(queryAt + 1).split('&').forEach((pair, i) => {
      if (i > 0) pushText('&', 'punct');
      const eq = pair.indexOf('=');
      if (eq === -1) return pushText(pair, 'key');
      pushText(pair.slice(0, eq), 'key');
      pushText('=', 'punct');
      pushText(pair.slice(eq + 1), 'value');
    });
  }
  pushText(hash, 'hash');
  return out;
}

export interface ParsedUrl {
  protocol: string;
  host: string;
  path: string;
  hash: string;
  params: { key: string; val: string }[];
}

export function parseUrl(url: string): ParsedUrl | null {
  try {
    const u = new URL(url);
    const params: { key: string; val: string }[] = [];
    u.searchParams.forEach((val, key) => params.push({ key, val }));
    return { protocol: u.protocol, host: u.host, path: u.pathname, hash: u.hash, params };
  } catch {
    return null;
  }
}
