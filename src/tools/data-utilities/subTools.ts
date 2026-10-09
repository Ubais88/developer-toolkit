import type { SubTool } from '../types';

export type UtilityCategory = 'generators' | 'encoders' | 'converters' | 'text';

export const DATA_SUBTOOLS: (SubTool & { category: UtilityCategory })[] = [
  { id: 'uuid', category: 'generators', name: 'UUID Generator', description: 'Generate v4 UUIDs in bulk', keywords: ['guid', 'id', 'random', 'uuid v4'] },
  { id: 'hash', category: 'generators', name: 'Hash Generator', description: 'SHA-1 / SHA-256 / SHA-512 digests', keywords: ['sha', 'sha256', 'checksum', 'digest', 'crypto'] },
  { id: 'lorem', category: 'generators', name: 'Lorem Ipsum', description: 'Placeholder paragraphs, sentences or words', keywords: ['placeholder', 'dummy text', 'filler'] },
  { id: 'base64', category: 'encoders', name: 'Base64 (quick)', description: 'Encode / decode Base64 text', keywords: ['b64', 'encode', 'decode'] },
  { id: 'url', category: 'encoders', name: 'URL Encode / Decode', description: 'Percent-encode query strings', keywords: ['percent', 'uri', 'encodeURIComponent', 'escape url'] },
  { id: 'jwt', category: 'encoders', name: 'JWT Decode (quick)', description: 'Peek at a token payload', keywords: ['token', 'bearer', 'auth'] },
  { id: 'html', category: 'encoders', name: 'HTML Entities', description: 'Encode / decode & < > " entities', keywords: ['entity', 'escape html', 'xss'] },
  { id: 'json-csv', category: 'converters', name: 'JSON → CSV', description: 'Convert an array of objects to CSV', keywords: ['csv', 'spreadsheet', 'export'] },
  { id: 'csv-json', category: 'converters', name: 'CSV → JSON', description: 'Parse CSV rows into JSON', keywords: ['csv', 'import', 'parse'] },
  { id: 'excel', category: 'converters', name: 'Excel ↔ Bytes', description: 'Excel file to byte array and back', keywords: ['xlsx', 'xls', 'binary', 'bytes', 'blob'] },
  { id: 'escape', category: 'text', name: 'Escape / Unescape', description: 'Escape strings for SQL or JSON', keywords: ['quote', 'backslash', 'string literal'] },
  { id: 'case', category: 'text', name: 'Case Converter', description: 'camelCase, snake_case, PascalCase, kebab-case…', keywords: ['camel', 'snake', 'pascal', 'kebab', 'upper', 'lower'] },
  { id: 'delimiter', category: 'text', name: 'List Delimiter', description: 'Join lines with a delimiter', keywords: ['join', 'comma', 'list', 'separator'] },
  { id: 'epoch', category: 'text', name: 'Epoch Converter (quick)', description: 'Epoch ↔ ISO date', keywords: ['unix', 'timestamp', 'date'] },
];

export const SUBTOOL_BY_ID = Object.fromEntries(DATA_SUBTOOLS.map((s) => [s.id, s]));
