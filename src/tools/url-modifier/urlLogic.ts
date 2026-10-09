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

/** Replace each magic token occurrence with its own fresh UUIDv7. */
export function replaceMagicTokens(value: string): string {
  return MAGIC_TOKENS.reduce(
    (acc, tag) => acc.split(tag).reduce((out, part, i) => (i === 0 ? part : out + generateUUIDv7() + part), ''),
    value,
  );
}

/** Apply active find/replace rules and magic tokens. Throws if the result isn't a valid URL. */
export function transformUrl(input: string, rules: Rule[]): string {
  let target = input.trim();
  if (!/^https?:\/\//i.test(target)) target = 'http://' + target;
  for (const r of rules) {
    if (r.active && r.find) target = target.split(r.find).join(r.replace);
  }
  target = replaceMagicTokens(target);
  new URL(target); // validate
  return target;
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

/** Rebuild a URL's query string from an edited param list. */
export function withParams(url: string, params: { key: string; val: string }[]): string {
  const u = new URL(url);
  u.search = '';
  params.forEach(({ key, val }) => key && u.searchParams.append(key, val));
  return u.toString();
}
