import { jsonrepair } from 'jsonrepair';

export const formatJSON = (input: string, indent = 2): string => {
  try {
    return JSON.stringify(JSON.parse(input), null, indent);
  } catch {
    throw new Error('Invalid JSON');
  }
};

export const minifyJSON = (input: string): string => {
  try {
    return JSON.stringify(JSON.parse(input));
  } catch {
    throw new Error('Invalid JSON');
  }
};

export interface JSONValidation {
  valid: boolean;
  error?: string;
  line?: number;
  column?: number;
}

/** Validate JSON and locate the error (handles both "position N" and "line X column Y" engine messages). */
export const validateJSON = (input: string): JSONValidation => {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const lineCol = /line (\d+) column (\d+)/i.exec(message);
    if (lineCol) return { valid: false, error: message, line: Number(lineCol[1]), column: Number(lineCol[2]) };
    const pos = /position (\d+)/i.exec(message);
    if (pos) {
      const before = input.slice(0, Number(pos[1])).split('\n');
      return { valid: false, error: message, line: before.length, column: before[before.length - 1].length + 1 };
    }
    return { valid: false, error: message };
  }
};

export const repairJSON = (input: string): string => {
  try {
    return jsonrepair(input);
  } catch {
    throw new Error('Could not repair JSON automatically');
  }
};
