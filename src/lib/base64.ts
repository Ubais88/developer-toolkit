/**
 * Unicode-safe Base64 / Base64URL helpers.
 *
 * `btoa`/`atob` only handle Latin-1, so text is routed through TextEncoder/TextDecoder
 * and the binary <-> base64 step works on byte arrays.
 */

export interface EncodeOptions {
  /** Use the URL-safe alphabet (`-` and `_` instead of `+` and `/`). */
  urlSafe?: boolean;
  /** Keep trailing `=` padding (default true). */
  padding?: boolean;
}

const CHUNK = 0x8000;

/** Encode raw bytes as Base64 (or Base64URL). */
export function bytesToBase64(bytes: Uint8Array, opts: EncodeOptions = {}): string {
  const { urlSafe = false, padding = true } = opts;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  let out = btoa(binary);
  if (urlSafe) out = out.replace(/\+/g, '-').replace(/\//g, '_');
  if (!padding) out = out.replace(/=+$/, '');
  return out;
}

/** Strip whitespace, convert base64url → standard alphabet and restore padding. Throws on invalid input. */
function normalizeBase64(input: string): string {
  let s = input.replace(/\s+/g, '');
  if (!s) return '';
  s = s.replace(/-/g, '+').replace(/_/g, '/');

  const firstPad = s.indexOf('=');
  const body = firstPad === -1 ? s : s.slice(0, firstPad);
  const pad = firstPad === -1 ? '' : s.slice(firstPad);

  const bad = body.search(/[^A-Za-z0-9+/]/);
  if (bad !== -1) {
    const ch = body[bad];
    throw new Error(`Invalid Base64: unexpected character "${ch}" at position ${bad + 1}.`);
  }
  if (!/^=*$/.test(pad) || pad.length > 2) {
    throw new Error('Invalid Base64: padding "=" may only appear at the end (max two).');
  }
  if (body.length % 4 === 1) {
    throw new Error('Invalid Base64: input length is not valid (looks truncated by one character).');
  }
  return body + '='.repeat((4 - (body.length % 4)) % 4);
}

/** Decode Base64 / Base64URL (padding optional, whitespace ignored) into bytes. */
export function base64ToBytes(input: string): Uint8Array {
  const normalized = normalizeBase64(input);
  let binary: string;
  try {
    binary = atob(normalized);
  } catch {
    throw new Error('Invalid Base64: the input could not be decoded.');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** UTF-8 safe text → Base64. */
export function encodeBase64(text: string, opts: EncodeOptions = {}): string {
  return bytesToBase64(new TextEncoder().encode(text), opts);
}

/** Base64 or Base64URL (padding optional, whitespace ignored) → UTF-8 text. Throws a friendly Error on invalid input. */
export function decodeBase64(input: string): string {
  const bytes = base64ToBytes(input);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Decoded bytes are not valid UTF-8 text — the data may be binary (try the Image / File tab).');
  }
}

/** Alias kept for readability where Base64URL (e.g. JWT segments) is expected. */
export function base64UrlDecodeToString(input: string): string {
  return decodeBase64(input);
}

/** Heuristic: does this string look like Base64 / Base64URL data? */
export function isLikelyBase64(input: string): boolean {
  // Only line breaks are tolerated here — spaces usually mean "this is prose".
  const s = input.trim().replace(/[\r\n]+/g, '');
  if (s.length < 8) return false;
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(s)) return false;
  if (/[+/]/.test(s) && /[-_]/.test(s)) return false;
  if (s.replace(/=+$/, '').length % 4 === 1) return false;
  try {
    base64ToBytes(s);
    return true;
  } catch {
    return false;
  }
}

/** Byte length of a string once UTF-8 encoded. */
export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export interface ParsedDataUri {
  mime: string | null;
  base64: string;
}

/** Split `data:<mime>;base64,<data>` into parts. Plain Base64 is returned with `mime: null`. */
export function parseDataUri(input: string): ParsedDataUri {
  const trimmed = input.trim();
  const match = /^data:([^;,]*)?((?:;[^;,]*)*?);base64,(.*)$/is.exec(trimmed);
  if (match) return { mime: match[1] || null, base64: match[3] };
  if (/^data:/i.test(trimmed)) throw new Error('Only base64-encoded data URIs are supported.');
  return { mime: null, base64: trimmed };
}

const startsWith = (bytes: Uint8Array, sig: number[], offset = 0) =>
  bytes.length >= offset + sig.length && sig.every((b, i) => bytes[offset + i] === b);

/** Detect a MIME type from file magic bytes. */
export function detectMime(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return 'application/pdf';
  if (startsWith(bytes, [0x42, 0x4d])) return 'image/bmp';
  if (startsWith(bytes, [0x00, 0x00, 0x01, 0x00])) return 'image/x-icon';
  // Text-based formats: sniff the first few hundred bytes.
  const head = new TextDecoder('utf-8').decode(bytes.subarray(0, 512)).trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return 'image/svg+xml';
  return null;
}

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/json': 'json',
};

export function extensionForMime(mime: string | null): string {
  return (mime && EXTENSIONS[mime]) || 'bin';
}

/** 1536 → "1.5 KB" */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}
