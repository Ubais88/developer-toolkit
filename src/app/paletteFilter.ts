/**
 * Ranking for the command palette. Stricter than cmdk's default fuzzy matcher so that
 * short queries like "uid" don't match every item with those letters somewhere in a description.
 */
export function paletteFilter(value: string, search: string, keywords: string[] = []): number {
  const query = search.toLowerCase().trim();
  if (!query) return 1;
  const name = value.toLowerCase();
  const words = name.split(/[\s\-_/·→↔&()]+/).filter(Boolean);
  const kws = keywords.map((k) => k.toLowerCase());

  if (name.startsWith(query)) return 1;
  if (words.some((w) => w.startsWith(query))) return 0.9;
  if (name.includes(query)) return 0.8;
  if (kws.some((k) => k.startsWith(query))) return 0.7;
  if (kws.some((k) => k.includes(query))) return 0.6;

  // Every term of a multi-word query appears somewhere
  const terms = query.split(/\s+/);
  if (terms.length > 1) {
    const haystack = `${name} ${kws.join(' ')}`;
    if (terms.every((t) => haystack.includes(t))) return 0.5;
  }

  // Compact subsequence match on the name only ("jsc" → "JSON Compare")
  if (query.length >= 2) {
    let pos = -1;
    let first = -1;
    for (const ch of query) {
      pos = name.indexOf(ch, pos + 1);
      if (pos === -1) return 0;
      if (first === -1) first = pos;
    }
    const span = pos - first + 1;
    if (span <= query.length * 4) return 0.3 * (query.length / span);
  }
  return 0;
}
