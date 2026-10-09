export const DIFF_LANGUAGES = [
  { value: 'plaintext', label: 'Plain text' },
  { value: 'json', label: 'JSON' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'sql', label: 'SQL' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'xml', label: 'XML' },
  { value: 'python', label: 'Python' },
];

interface DiffSample {
  original: string;
  modified: string;
}

const TEXT_SAMPLE: DiffSample = {
  original: `Release notes — v2.3.0

The dashboard now loads faster on slow connections.
Users can export reports as CSV.
Dark mode follows the system preference.
Fixed a crash when opening empty projects.
Known issue: search ignores archived items.
`,
  modified: `Release notes — v2.4.0

The dashboard now loads up to 3x faster on slow connections.
Users can export reports as CSV or XLSX.
Dark mode follows the system preference.
Fixed a crash when opening empty projects.
Added keyboard shortcuts for every toolbar action.
`,
};

const JSON_SAMPLE: DiffSample = {
  original: `{
  "name": "api-gateway",
  "version": "1.4.2",
  "port": 8080,
  "features": ["auth", "rate-limit"],
  "database": { "host": "localhost", "pool": 10 }
}
`,
  modified: `{
  "name": "api-gateway",
  "version": "1.5.0",
  "port": 8443,
  "features": ["auth", "rate-limit", "tracing"],
  "database": { "host": "db.internal", "pool": 20, "ssl": true }
}
`,
};

const CODE_SAMPLE: DiffSample = {
  original: `function total(items) {
  let sum = 0;
  for (var i = 0; i < items.length; i++) {
    sum += items[i].price;
  }
  return sum;
}

export default total;
`,
  modified: `function total(items, taxRate = 0) {
  const sum = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  return Math.round(sum * (1 + taxRate) * 100) / 100;
}

export default total;
`,
};

export function sampleFor(language: string): DiffSample {
  if (language === 'json') return JSON_SAMPLE;
  if (language === 'javascript' || language === 'typescript') return CODE_SAMPLE;
  return TEXT_SAMPLE;
}

export const DEFAULT_SAMPLE = TEXT_SAMPLE;
