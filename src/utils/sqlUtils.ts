export const formatSQL = (sql: string): string => {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
    'ON', 'AND', 'OR', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE',
    'TABLE', 'ALTER', 'DROP', 'INDEX', 'AS', 'DISTINCT', 'UNION',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IN', 'NOT', 'NULL',
    'IS', 'BETWEEN', 'LIKE', 'EXISTS', 'ASC', 'DESC'
  ];

  let formatted = sql.trim();

  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    formatted = formatted.replace(regex, keyword);
  });

  formatted = formatted
    .replace(/\s+/g, ' ')
    .replace(/,/g, ',\n  ')
    .replace(/\bFROM\b/g, '\nFROM')
    .replace(/\bWHERE\b/g, '\nWHERE')
    .replace(/\bJOIN\b/g, '\nJOIN')
    .replace(/\bLEFT JOIN\b/g, '\nLEFT JOIN')
    .replace(/\bRIGHT JOIN\b/g, '\nRIGHT JOIN')
    .replace(/\bINNER JOIN\b/g, '\nINNER JOIN')
    .replace(/\bON\b/g, '\n  ON')
    .replace(/\bAND\b/g, '\n  AND')
    .replace(/\bOR\b/g, '\n  OR')
    .replace(/\bORDER BY\b/g, '\nORDER BY')
    .replace(/\bGROUP BY\b/g, '\nGROUP BY')
    .replace(/\bLIMIT\b/g, '\nLIMIT');

  return formatted;
};

export const uppercaseSQL = (sql: string): string => {
  const keywords = [
    'select', 'from', 'where', 'join', 'left', 'right', 'inner', 'outer',
    'on', 'and', 'or', 'order', 'by', 'group', 'having', 'limit',
    'insert', 'into', 'values', 'update', 'set', 'delete', 'create',
    'table', 'alter', 'drop', 'index', 'as', 'distinct', 'union',
    'case', 'when', 'then', 'else', 'end', 'in', 'not', 'null',
    'is', 'between', 'like', 'exists', 'asc', 'desc'
  ];

  let result = sql;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    result = result.replace(regex, keyword.toUpperCase());
  });

  return result;
};

export const lowercaseSQL = (sql: string): string => {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
    'ON', 'AND', 'OR', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE',
    'TABLE', 'ALTER', 'DROP', 'INDEX', 'AS', 'DISTINCT', 'UNION',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IN', 'NOT', 'NULL',
    'IS', 'BETWEEN', 'LIKE', 'EXISTS', 'ASC', 'DESC'
  ];

  let result = sql;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    result = result.replace(regex, keyword.toLowerCase());
  });

  return result;
};

export const removeComments = (sql: string): string => {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
};

export const generateInClause = (values: string, quoteType: 'single' | 'double' | 'none'): string => {
  const items = values
    .split(/[\n,\s]+/)
    .map(v => v.trim())
    .filter(v => v.length > 0);

  let formatted: string[];
  if (quoteType === 'none') {
    formatted = items;
  } else {
    const quote = quoteType === 'single' ? "'" : '"';
    formatted = items.map(item => `${quote}${item}${quote}`);
  }

  return `(${formatted.join(', ')})`;
};

export const compareSQL = (sql1: string, sql2: string, ignoreWhitespace: boolean, ignoreCase: boolean): {
  same: boolean;
  formatted1: string;
  formatted2: string;
} => {
  let compare1 = sql1;
  let compare2 = sql2;

  if (ignoreWhitespace) {
    compare1 = compare1.replace(/\s+/g, ' ').trim();
    compare2 = compare2.replace(/\s+/g, ' ').trim();
  }

  if (ignoreCase) {
    compare1 = compare1.toLowerCase();
    compare2 = compare2.toLowerCase();
  }

  return {
    same: compare1 === compare2,
    formatted1: formatSQL(sql1),
    formatted2: formatSQL(sql2),
  };
};
