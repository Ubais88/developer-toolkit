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

export const excelToBinaryString = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        // Convert to standard array for cleaner JSON stringification if requested, 
        // or just comma separated string: "1,2,3..."
        // The user asked for "[80,75...]" or "80,75,3..."
        // Let's provide a JSON array string as it's safer and requested format example was [80...].
        // But the user also said "comma separated bytes" in my plan interpretation.
        // Let's stick to the user's example: "[80,75...]" which is JSON.stringify(Array.from(data))
        resolve(JSON.stringify(Array.from(data)));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const binaryStringToBlob = (input: string): Blob => {
  let cleanInput = input.trim();

  // Handle [1,2,3] format
  if (cleanInput.startsWith('[') && cleanInput.endsWith(']')) {
    cleanInput = cleanInput.slice(1, -1);
  }

  // Split by comma and convert to numbers
  const bytes = cleanInput.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
  const u8 = new Uint8Array(bytes);

  // Create workbook from data to verify it's valid xlsx or just return the blob?
  // The user asked to convert "binary data ... to excel file". 
  // This implies the binary data IS the excel file bytes.
  // So we just return the Blob of type xlsx.
  return new Blob([u8], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const htmlEncode = (str: string): string => {
  return str.replace(/[\u00A0-\u9999<>&]/g, (i) => `&#${i.charCodeAt(0)};`);
};

export const htmlDecode = (str: string): string => {
  try {
    const doc = new DOMParser().parseFromString(str, 'text/html');
    return doc.documentElement.textContent || str;
  } catch {
    return str;
  }
};

export const convertCase = (str: string, type: 'camel' | 'snake' | 'pascal' | 'kebab' | 'upper' | 'lower'): string => {
  const clean = str.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  const words = clean.trim().split(/[\s_-]+/).filter(w => w.length > 0);
  if (!words.length) return '';
  switch (type) {
    case 'camel':
      return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    case 'snake':
      return words.map(w => w.toLowerCase()).join('_');
    case 'pascal':
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    case 'kebab':
      return words.map(w => w.toLowerCase()).join('-');
    case 'upper':
      return str.toUpperCase();
    case 'lower':
      return str.toLowerCase();
  }
};

export const generateLoremIpsum = (count: number, type: 'paragraphs' | 'sentences' | 'words'): string => {
  const loremWords = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'ut', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea', 'commodo', 'consequat'];
  
  const makeSentence = () => {
    const len = Math.floor(Math.random() * 8) + 6;
    const sWords = Array.from({ length: len }, () => loremWords[Math.floor(Math.random() * loremWords.length)]);
    sWords[0] = sWords[0].charAt(0).toUpperCase() + sWords[0].slice(1);
    return sWords.join(' ') + '.';
  };

  if (type === 'words') {
    return Array.from({ length: count }, () => loremWords[Math.floor(Math.random() * loremWords.length)]).join(' ');
  }
  if (type === 'sentences') {
    return Array.from({ length: count }, makeSentence).join(' ');
  }
  return Array.from({ length: count }, () => {
    const sLen = Math.floor(Math.random() * 4) + 3;
    return Array.from({ length: sLen }, makeSentence).join(' ');
  }).join('\n\n');
};
