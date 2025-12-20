export const formatJSON = (input: string): string => {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    throw new Error('Invalid JSON');
  }
};

export const minifyJSON = (input: string): string => {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch (error) {
    throw new Error('Invalid JSON');
  }
};

export const validateJSON = (input: string): { valid: boolean; error?: string; line?: number } => {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const match = errorMessage.match(/position (\d+)/);
    const position = match ? parseInt(match[1]) : undefined;
    const line = position ? input.substring(0, position).split('\n').length : undefined;
    return { valid: false, error: errorMessage, line };
  }
};

export const searchInJSON = (json: string, searchTerm: string): { found: boolean; matches: number } => {
  try {
    const parsed = JSON.parse(json);
    const jsonString = JSON.stringify(parsed, null, 2).toLowerCase();
    const term = searchTerm.toLowerCase();
    const matches = (jsonString.match(new RegExp(term, 'g')) || []).length;
    return { found: matches > 0, matches };
  } catch {
    return { found: false, matches: 0 };
  }
};

export const compareJSON = (json1: string, json2: string): {
  diff: Array<{ type: 'added' | 'removed' | 'changed' | 'unchanged'; key: string; value1?: any; value2?: any }>;
} => {
  try {
    const obj1 = JSON.parse(json1);
    const obj2 = JSON.parse(json2);
    const diff: Array<{ type: 'added' | 'removed' | 'changed' | 'unchanged'; key: string; value1?: any; value2?: any }> = [];

    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    allKeys.forEach(key => {
      if (!(key in obj1)) {
        diff.push({ type: 'added', key, value2: obj2[key] });
      } else if (!(key in obj2)) {
        diff.push({ type: 'removed', key, value1: obj1[key] });
      } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        diff.push({ type: 'changed', key, value1: obj1[key], value2: obj2[key] });
      } else {
        diff.push({ type: 'unchanged', key, value1: obj1[key], value2: obj2[key] });
      }
    });

    return { diff };
  } catch (error) {
    throw new Error('Invalid JSON for comparison');
  }
};
