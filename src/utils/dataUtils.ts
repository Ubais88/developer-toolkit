export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const timestampToDate = (timestamp: number | string): string => {
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  const date = new Date(ts);
  return date.toISOString();
};

export const dateToTimestamp = (dateString: string): number => {
  return new Date(dateString).getTime();
};

export const jsonToCSV = (json: string): string => {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('JSON must be an array of objects');
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          const stringValue = value === null || value === undefined ? '' : String(value);
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  } catch (error) {
    throw new Error('Invalid JSON for CSV conversion');
  }
};

export const csvToJSON = (csv: string): string => {
  try {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });

    return JSON.stringify(data, null, 2);
  } catch (error) {
    throw new Error('Invalid CSV format');
  }
};

export const escapeString = (input: string, type: 'sql' | 'json'): string => {
  if (type === 'sql') {
    return input.replace(/'/g, "''");
  } else {
    return JSON.stringify(input).slice(1, -1);
  }
};

export const unescapeString = (input: string, type: 'sql' | 'json'): string => {
  if (type === 'sql') {
    return input.replace(/''/g, "'");
  } else {
    try {
      return JSON.parse(`"${input}"`);
    } catch {
      return input;
    }
  }
};

export const generateCommaSeparated = (
  input: string,
  options: {
    quoteType: 'none' | 'single' | 'double';
    removeDuplicates: boolean;
    trimSpaces: boolean;
  }
): string => {
  let items = input.split(/[\n,\s]+/).filter(item => item.length > 0);

  if (options.trimSpaces) {
    items = items.map(item => item.trim());
  }

  if (options.removeDuplicates) {
    items = Array.from(new Set(items));
  }

  if (options.quoteType === 'single') {
    items = items.map(item => `'${item}'`);
  } else if (options.quoteType === 'double') {
    items = items.map(item => `"${item}"`);
  }

  return items.join(',');
};

export const base64Encode = (str: string): string => {
  try {
    return btoa(str);
  } catch (e) {
    return 'Error: Invalid input for Base64 encoding';
  }
};

export const base64Decode = (str: string): string => {
  try {
    return atob(str);
  } catch (e) {
    return 'Error: Invalid Base64 string';
  }
};

export const urlEncode = (str: string): string => encodeURIComponent(str);
export const urlDecode = (str: string): string => decodeURIComponent(str);

export const decodeJWT = (token: string): string => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 'Error: Invalid JWT format';
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    return JSON.stringify({ header, payload }, null, 2);
  } catch (e) {
    return 'Error: Failed to decode JWT';
  }
};

export const generateHash = async (message: string, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest(algorithm, msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
