/** Returns the name (or undefined) of each capturing group, in order, by scanning the pattern. */
export function captureGroupNames(pattern: string): (string | undefined)[] {
  const names: (string | undefined)[] = [];
  let inClass = false;
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (inClass) {
      if (ch === ']') inClass = false;
      continue;
    }
    if (ch === '[') {
      inClass = true;
      continue;
    }
    if (ch !== '(') continue;
    if (pattern[i + 1] !== '?') {
      names.push(undefined);
      continue;
    }
    const named = /^\?<([A-Za-z_$][\w$]*)>/.exec(pattern.slice(i + 1));
    if (named) names.push(named[1]);
    // Other (?…) forms are non-capturing groups or lookarounds
  }
  return names;
}
