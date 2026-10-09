import { useEffect, useId, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Braces, Download, Eraser, FileJson2, FileType2, Sparkles, Wand2 } from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  Input,
  Panel,
  SegmentedControl,
  Select,
  ToggleChip,
  ToolHeader,
  CopyButton,
  cn,
} from '../../components/ui';
import { Editor } from '../../components/editor/Editor';
import { useToast } from '../../context/ToastContext';
import { useSessionState } from '../../hooks/useSessionState';
import { countDeclarations, DEFAULT_JSON_TO_TS_OPTIONS, jsonToTs, type JsonToTsOptions } from '../../lib/jsonToTs';

const SAMPLE = JSON.stringify(
  {
    id: 'ord_9f8a7c21',
    status: 'shipped',
    createdAt: '2024-11-03T14:22:05Z',
    updatedAt: '2024-11-04T09:10:44.512Z',
    total: 149.97,
    currency: 'USD',
    isGift: false,
    notes: 'Leave at the front desk',
    customer: {
      id: 4821,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: null,
      address: { line1: '12 Analytical Way', city: 'London', postalCode: 'EC1A 1BB', country: 'GB' },
    },
    items: [
      { sku: 'KB-75-BRN', name: 'Mechanical keyboard', quantity: 1, unitPrice: 119.99, discount: null },
      { sku: 'CBL-USBC-2M', name: 'USB-C cable (2 m)', quantity: 2, unitPrice: 14.99, discount: 5, tags: ['accessory', 'cable'] },
    ],
    shipping: {
      carrier: 'UPS',
      trackingNumber: '1Z999AA10123456784',
      estimatedDelivery: '2024-11-07',
      address: { line1: '12 Analytical Way', city: 'London', postalCode: 'EC1A 1BB', country: 'GB' },
    },
    events: [
      { type: 'created', at: '2024-11-03T14:22:05Z' },
      { type: 'shipped', at: '2024-11-04T09:10:44Z', by: 'warehouse-3' },
    ],
    metadata: { source: 'web', 'coupon-code': 'FALL24', experiments: [] },
  },
  null,
  2,
);

type Result = { output: string; error: string | null };

function generate(input: string, options: JsonToTsOptions): Result {
  if (!input.trim()) return { output: '', error: null };
  try {
    return { output: jsonToTs(JSON.parse(input), options), error: null };
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}

const lineCount = (s: string) => (s ? s.replace(/\n$/, '').split('\n').length : 0);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function JsonToTs() {
  const toast = useToast();
  const rootId = useId();
  const [input, setInput] = useSessionState('j2ts-input', SAMPLE);
  const [storedOptions, setStoredOptions] = useSessionState<JsonToTsOptions>('j2ts-options', DEFAULT_JSON_TO_TS_OPTIONS);
  // Merge with defaults so options persisted by an older version never come back partial.
  const options = useMemo(() => ({ ...DEFAULT_JSON_TO_TS_OPTIONS, ...storedOptions }), [storedOptions]);
  const setOption = <K extends keyof JsonToTsOptions>(key: K, value: JsonToTsOptions[K]) =>
    setStoredOptions((prev) => ({ ...DEFAULT_JSON_TO_TS_OPTIONS, ...prev, [key]: value }));

  const [result, setResult] = useState<Result>(() => generate(input, options));

  // Live generation (debounced). On invalid JSON keep the last good output and surface the error.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = generate(input, options);
      setResult((prev) => (next.error ? { output: prev.output, error: next.error } : next));
    }, 200);
    return () => clearTimeout(t);
  }, [input, options]);

  const { output, error } = result;
  const isEmpty = !input.trim();
  const typeCount = countDeclarations(output);
  const fileName = `${options.rootName.trim() || 'Root'}.ts`;

  const formatInput = () => {
    try {
      setInput(JSON.stringify(JSON.parse(input), null, 2));
    } catch {
      toast.error('Can’t format — the JSON is invalid');
    }
  };

  const download = () => {
    const blob = new Blob([output], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${fileName}`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 md:p-6 lg:overflow-hidden">
      <ToolHeader
        icon={<FileType2 />}
        title="JSON → TypeScript"
        description="Generate interfaces from any JSON payload — nested types, unions and optional keys inferred."
      />

      {/* Options toolbar */}
      <div
        role="toolbar"
        aria-label="Generator options"
        className="hairline flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-surface-1 px-3 py-2"
      >
        <label htmlFor={`${rootId}-root`} className="flex items-center gap-2">
          <span className="label-caps">Root</span>
          <Input
            id={`${rootId}-root`}
            mono
            value={options.rootName}
            onChange={(e) => setOption('rootName', e.target.value)}
            placeholder="Root"
            spellCheck={false}
            autoComplete="off"
            className="h-7 w-32 px-2 text-xs"
          />
        </label>

        <Divider />

        <SegmentedControl
          aria-label="Declaration style"
          value={options.declaration}
          onChange={(v) => setOption('declaration', v)}
          options={[
            { value: 'interface', label: 'interface' },
            { value: 'type', label: 'type' },
          ]}
          className="font-mono"
        />

        <Divider />

        <div className="flex flex-wrap items-center gap-1.5">
          <ToggleChip checked={options.exportTypes} onChange={(v) => setOption('exportTypes', v)} title="Prefix declarations with export">
            export
          </ToggleChip>
          <ToggleChip checked={options.readonly} onChange={(v) => setOption('readonly', v)} title="Mark properties and arrays readonly">
            readonly
          </ToggleChip>
          <ToggleChip
            checked={options.optionalNulls}
            onChange={(v) => setOption('optionalNulls', v)}
            title="Make null values optional (?:) instead of | null"
          >
            optional nulls
          </ToggleChip>
          <ToggleChip
            checked={options.arrayStyle === 'generic'}
            onChange={(v) => setOption('arrayStyle', v ? 'generic' : 'brackets')}
            title="Use Array<T> instead of T[]"
          >
            <span className="font-mono">Array&lt;T&gt;</span>
          </ToggleChip>
          <ToggleChip checked={options.inferDates} onChange={(v) => setOption('inferDates', v)} title="Annotate ISO 8601 date strings">
            ISO dates
          </ToggleChip>
        </div>

        <label htmlFor={`${rootId}-indent`} className="flex items-center gap-2 lg:ml-auto">
          <span className="label-caps">Indent</span>
          <Select
            id={`${rootId}-indent`}
            size="sm"
            value={String(options.indent)}
            onChange={(e) => setOption('indent', e.target.value === '4' ? 4 : 2)}
            options={[
              { value: '2', label: '2 spaces' },
              { value: '4', label: '4 spaces' },
            ]}
          />
        </label>
      </div>

      {/* Panes */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <Panel
          title="JSON"
          icon={<Braces />}
          meta={isEmpty ? undefined : plural(lineCount(input), 'line')}
          className="min-h-[320px] lg:min-h-0"
          bodyClassName="flex flex-col"
          actions={
            <>
              <IconButton size="sm" label="Format JSON" onClick={formatInput} disabled={isEmpty}>
                <Wand2 />
              </IconButton>
              <IconButton size="sm" label="Load sample" onClick={() => setInput(SAMPLE)}>
                <FileJson2 />
              </IconButton>
              <IconButton size="sm" label="Clear" onClick={() => setInput('')} disabled={isEmpty}>
                <Eraser />
              </IconButton>
            </>
          }
        >
          <div className="min-h-0 flex-1">
            <Editor
              value={input}
              onChange={setInput}
              language="json"
              path="j2ts-input.json"
              placeholder="Paste a JSON object or array…"
            />
          </div>
          <AnimatePresence initial={false}>
            {error && !isEmpty && (
              <motion.div
                key="error"
                role="alert"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="shrink-0 overflow-hidden"
              >
                <div className="flex items-start gap-2 border-t border-destructive/20 bg-destructive/10 px-3.5 py-2 text-xs text-destructive">
                  <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 break-words font-mono">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>

        <Panel
          title="TypeScript"
          icon={<FileType2 />}
          meta={
            isEmpty || !output ? undefined : (
              <span className="inline-flex items-center gap-2">
                <span>
                  {plural(typeCount, 'type')} · {plural(lineCount(output), 'line')}
                </span>
                {error && (
                  <Badge tone="warning" className="h-4 px-1.5 text-[10px]">
                    stale
                  </Badge>
                )}
              </span>
            )
          }
          className="min-h-[320px] lg:min-h-0"
          actions={
            <>
              <CopyButton value={output} message="TypeScript copied" disabled={!output || isEmpty} />
              <IconButton size="sm" label={`Download ${fileName}`} onClick={download} disabled={!output || isEmpty}>
                <Download />
              </IconButton>
            </>
          }
        >
          {isEmpty ? (
            <EmptyState
              icon={<Sparkles />}
              title="Types appear here"
              hint="Paste JSON on the left — interfaces are generated as you type."
              action={
                <Button variant="outline" size="xs" onClick={() => setInput(SAMPLE)}>
                  <FileJson2 className="h-3.5 w-3.5" />
                  Load sample
                </Button>
              }
            />
          ) : !output && error ? (
            <EmptyState
              icon={<AlertCircle />}
              title="Waiting for valid JSON"
              hint="Fix the error in the input and types will be generated instantly."
            />
          ) : (
            <div className={cn('h-full transition-opacity duration-200', error && 'opacity-50')}>
              <Editor value={output} readOnly language="typescript" path="j2ts-output.ts" />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="hidden h-5 w-px bg-border-subtle sm:block" />;
}
