export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/** Epoch (seconds or milliseconds) → ISO string. */
export const timestampToDate = (timestamp: number | string): string => {
  const raw = typeof timestamp === 'string' ? Number(timestamp.trim()) : timestamp;
  if (!Number.isFinite(raw)) throw new Error('Invalid timestamp');
  const ms = Math.abs(raw) < 1e11 ? raw * 1000 : raw;
  return new Date(ms).toISOString();
};

export const dateToTimestamp = (dateString: string): number => {
  const t = new Date(dateString).getTime();
  if (Number.isNaN(t)) throw new Error('Invalid date');
  return t;
};

const csvCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const jsonToCSV = (json: string): string => {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON');
  }
  if (!Array.isArray(data) || data.length === 0) throw new Error('JSON must be a non-empty array of objects');
  // Union of keys across all rows, in first-seen order
  const headers = [...new Set(data.flatMap((row) => (row && typeof row === 'object' ? Object.keys(row) : [])))];
  return [
    headers.map(csvCell).join(','),
    ...data.map((row) => headers.map((h) => csvCell((row as Record<string, unknown>)?.[h])).join(',')),
  ].join('\n');
};

/** RFC 4180-ish CSV parser (quoted fields, escaped quotes, CRLF). */
export const parseCSV = (csv: string, delimiter = ','): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (quoted) {
      if (ch === '"' && csv[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && csv[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
};

export const csvToJSON = (csv: string): string => {
  const rows = parseCSV(csv.trim());
  if (rows.length < 2) throw new Error('CSV needs a header row and at least one data row');
  const headers = rows[0].map((h) => h.trim());
  const data = rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()])),
  );
  return JSON.stringify(data, null, 2);
};

export const escapeString = (input: string, type: 'sql' | 'json'): string =>
  type === 'sql' ? input.replace(/'/g, "''") : JSON.stringify(input).slice(1, -1);

export const unescapeString = (input: string, type: 'sql' | 'json'): string => {
  if (type === 'sql') return input.replace(/''/g, "'");
  try {
    return JSON.parse(`"${input}"`);
  } catch {
    return input;
  }
};

export const generateCommaSeparated = (
  input: string,
  options: { quoteType: 'none' | 'single' | 'double'; removeDuplicates: boolean; trimSpaces: boolean },
): string => {
  let items = input.split(/[\n,\s]+/).filter((item) => item.length > 0);
  if (options.trimSpaces) items = items.map((item) => item.trim());
  if (options.removeDuplicates) items = Array.from(new Set(items));
  if (options.quoteType === 'single') items = items.map((item) => `'${item}'`);
  else if (options.quoteType === 'double') items = items.map((item) => `"${item}"`);
  return items.join(',');
};

/** UTF-8 safe Base64 encode. */
export const base64Encode = (str: string): string => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

/** UTF-8 safe Base64 decode; accepts base64url and missing padding. Throws on invalid input. */
export const base64Decode = (str: string): string => {
  let s = str.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (s.length % 4) s += '='.repeat(4 - (s.length % 4));
  let binary: string;
  try {
    binary = atob(s);
  } catch {
    throw new Error('Invalid Base64 string');
  }
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
};

export const urlEncode = (str: string): string => encodeURIComponent(str);
export const urlDecode = (str: string): string => decodeURIComponent(str.replace(/\+/g, ' '));

export const decodeJWT = (token: string): string => {
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error('A JWT has three dot-separated parts');
  try {
    const header = JSON.parse(base64Decode(parts[0]));
    const payload = JSON.parse(base64Decode(parts[1]));
    return JSON.stringify({ header, payload }, null, 2);
  } catch {
    throw new Error('Could not decode the token header or payload');
  }
};

export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export const generateHash = async (message: string, algorithm: HashAlgorithm): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest(algorithm, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/** Read a file into a JSON byte-array string, e.g. "[80,75,3,4,…]". */
export const excelToBinaryString = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(JSON.stringify(Array.from(new Uint8Array(e.target?.result as ArrayBuffer))));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

/** Parse "[1,2,3]" or "1, 2, 3" into an .xlsx Blob. */
export const binaryStringToBlob = (input: string): Blob => {
  let clean = input.trim();
  if (clean.startsWith('[') && clean.endsWith(']')) clean = clean.slice(1, -1);
  const bytes = clean
    .split(',')
    .map((x) => parseInt(x.trim(), 10))
    .filter((x) => !Number.isNaN(x));
  if (!bytes.length) throw new Error('No bytes found');
  return new Blob([new Uint8Array(bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

const HTML_SPECIAL = new Set(['<', '>', '&', '"', "'"]);

/** Encode markup characters and anything outside Latin-1 printable range as numeric entities. */
export const htmlEncode = (str: string): string =>
  Array.from(str)
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return HTML_SPECIAL.has(ch) || code >= 160 ? `&#${code};` : ch;
    })
    .join('');

export const htmlDecode = (str: string): string => {
  try {
    return new DOMParser().parseFromString(str, 'text/html').documentElement.textContent || str;
  } catch {
    return str;
  }
};

export type CaseType = 'camel' | 'snake' | 'pascal' | 'kebab' | 'constant' | 'title' | 'dot' | 'upper' | 'lower';

export const convertCase = (str: string, type: CaseType): string => {
  const words = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .split(/[\s_.-]+/)
    .filter((w) => w.length > 0);
  if (!words.length) return '';
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  switch (type) {
    case 'camel':
      return words[0].toLowerCase() + words.slice(1).map(cap).join('');
    case 'snake':
      return words.map((w) => w.toLowerCase()).join('_');
    case 'pascal':
      return words.map(cap).join('');
    case 'kebab':
      return words.map((w) => w.toLowerCase()).join('-');
    case 'constant':
      return words.map((w) => w.toUpperCase()).join('_');
    case 'title':
      return words.map(cap).join(' ');
    case 'dot':
      return words.map((w) => w.toLowerCase()).join('.');
    case 'upper':
      return str.toUpperCase();
    case 'lower':
      return str.toLowerCase();
  }
};

const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat'.split(' ');

export const generateLoremIpsum = (count: number, type: 'paragraphs' | 'sentences' | 'words'): string => {
  const word = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
  const sentence = () => {
    const w = Array.from({ length: Math.floor(Math.random() * 8) + 6 }, word);
    w[0] = w[0].charAt(0).toUpperCase() + w[0].slice(1);
    return w.join(' ') + '.';
  };
  if (type === 'words') return Array.from({ length: count }, word).join(' ');
  if (type === 'sentences') return Array.from({ length: count }, sentence).join(' ');
  return Array.from({ length: count }, () => Array.from({ length: Math.floor(Math.random() * 4) + 3 }, sentence).join(' ')).join('\n\n');
};
