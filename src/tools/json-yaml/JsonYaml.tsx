import { useEffect, useMemo, useRef, useState } from 'react';
import type { OnMount } from '@monaco-editor/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeftRight, Braces, Copy, Download, Eraser, FileCode, FileJson, Layers, Sparkles } from 'lucide-react';
import { usePaletteActions } from '../../app/paletteActions';
import { useClipboard } from '../../hooks/useClipboard';
import { Editor } from '../../components/editor/Editor';
import { Badge, Button, CopyButton, IconButton, Panel, SegmentedControl, Select, ToolHeader, cn } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useSessionState } from '../../hooks/useSessionState';
import { convert, looksLikeYaml, type Direction } from './convert';
import { JSON_SAMPLE, YAML_SAMPLE } from './samples';

type EditorInstance = Parameters<OnMount>[0];
type MonacoInstance = Parameters<OnMount>[1];

const DEBOUNCE_MS = 200;
const MARKER_OWNER = 'json-yaml';
const spring = { type: 'spring', stiffness: 450, damping: 34 } as const;

const INDENT_OPTIONS = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
];

function useDebouncedValue<T>(value: T, delay: number): [T, (v: T) => void] {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return [debounced, setDebounced];
}

function download(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function countLines(text: string) {
  return text ? text.split('\n').length - (text.endsWith('\n') ? 1 : 0) : 0;
}

export function JsonYaml() {
  const toast = useToast();
  const { copy } = useClipboard();
  const [direction, setDirection] = useSessionState<Direction>('yaml-direction', 'json-to-yaml');
  const [indent, setIndent] = useSessionState('yaml-indent', 2);
  const [input, setInput] = useSessionState('yaml-input', JSON_SAMPLE);
  const [debounced, setDebounced] = useDebouncedValue(input, DEBOUNCE_MS);

  const result = useMemo(() => convert(debounced, direction, indent), [debounced, direction, indent]);

  // Keep the last successful output around so an error only dims it instead of blanking it.
  const [lastGood, setLastGood] = useState(result.ok ? result.output : '');
  if (result.ok && result.output !== lastGood) setLastGood(result.output);
  const output = result.ok ? result.output : lastGood;
  const error = result.ok ? null : result.error;
  const documents = result.ok ? result.documents : 0;

  const inputLang = direction === 'json-to-yaml' ? 'json' : 'yaml';
  const outputLang = direction === 'json-to-yaml' ? 'yaml' : 'json';
  const inputLabel = inputLang.toUpperCase();
  const outputLabel = outputLang.toUpperCase();

  const showYamlHint = !!error && direction === 'json-to-yaml' && looksLikeYaml(debounced);

  const editorRef = useRef<EditorInstance | null>(null);
  const monacoRef = useRef<MonacoInstance | null>(null);
  const [mounted, setMounted] = useState(false);

  // Monaco already squiggles JSON syntax errors; add our own marker for YAML parse errors.
  useEffect(() => {
    const model = editorRef.current?.getModel();
    const monaco = monacoRef.current;
    if (!model || !monaco) return;
    if (error && inputLang === 'yaml' && error.line) {
      const line = Math.min(error.line, model.getLineCount());
      const col = error.column ?? 1;
      monaco.editor.setModelMarkers(model, MARKER_OWNER, [
        {
          severity: monaco.MarkerSeverity.Error,
          message: error.message,
          startLineNumber: line,
          startColumn: col,
          endLineNumber: line,
          endColumn: Math.max(col + 1, model.getLineMaxColumn(line)),
        },
      ]);
    } else {
      monaco.editor.setModelMarkers(model, MARKER_OWNER, []);
    }
  }, [error, inputLang, mounted]);

  const setInputNow = (value: string) => {
    setInput(value);
    setDebounced(value);
  };

  const changeDirection = (next: Direction) => {
    if (next === direction) return;
    // Carry the converted text across so the content survives the flip. If the current input does not
    // convert (e.g. YAML pasted while in JSON mode), keep it as-is — the new direction may well parse it.
    const fresh = convert(input, direction, indent);
    if (fresh.ok && input.trim()) setInputNow(fresh.output);
    setDirection(next);
  };

  const swap = () => {
    if (!output) {
      setDirection(direction === 'json-to-yaml' ? 'yaml-to-json' : 'json-to-yaml');
      return;
    }
    setInputNow(output);
    setDirection(direction === 'json-to-yaml' ? 'yaml-to-json' : 'json-to-yaml');
  };

  const loadSample = () => setInputNow(direction === 'json-to-yaml' ? JSON_SAMPLE : YAML_SAMPLE);

  const clear = () => {
    setInputNow('');
    setLastGood('');
    editorRef.current?.focus();
  };

  const jumpToError = () => {
    const ed = editorRef.current;
    if (!ed || !error?.line) return;
    const position = { lineNumber: error.line, column: error.column ?? 1 };
    ed.revealPositionInCenter(position);
    ed.setPosition(position);
    ed.focus();
  };

  const handleDownload = () => {
    if (outputLang === 'yaml') download(output, 'converted.yaml', 'application/yaml');
    else download(output, 'converted.json', 'application/json');
    toast.success(`Downloaded converted.${outputLang}`);
  };

  usePaletteActions([
    { id: 'swap', title: `Swap: convert ${outputLabel} → ${inputLabel}`, icon: ArrowLeftRight, keywords: ['direction', 'flip', 'reverse'], run: swap },
    ...(output
      ? [
          { id: 'copy', title: `Copy ${outputLabel} output`, icon: Copy, keywords: ['clipboard'], run: () => void copy(output, `${outputLabel} copied`) },
          { id: 'download', title: `Download .${outputLang}`, icon: Download, keywords: ['save', 'export'], run: handleDownload },
        ]
      : []),
    ...(error?.line ? [{ id: 'error', title: `Jump to error (line ${error.line})`, icon: AlertCircle, keywords: ['problem', 'invalid'], run: jumpToError }] : []),
    { id: 'sample', title: 'Load sample', icon: Sparkles, keywords: ['example', 'demo'], run: loadSample },
    ...(input ? [{ id: 'clear', title: 'Clear input', icon: Eraser, keywords: ['empty', 'reset'], run: clear }] : []),
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 md:p-6 lg:overflow-hidden">
      <ToolHeader
        icon={<Braces />}
        title="JSON ↔ YAML"
        description="Convert between JSON and YAML as you type"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={loadSample}>
              <Sparkles className="h-3.5 w-3.5" />
              Load sample
            </Button>
            <Button variant="ghost" size="sm" onClick={clear} disabled={!input}>
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl<Direction>
          aria-label="Conversion direction"
          value={direction}
          onChange={changeDirection}
          options={[
            { value: 'json-to-yaml', label: 'JSON → YAML' },
            { value: 'yaml-to-json', label: 'YAML → JSON' },
          ]}
        />
        <IconButton label="Swap input and output" size="sm" onClick={swap}>
          <ArrowLeftRight />
        </IconButton>
        <div className="mx-0.5 h-5 w-px bg-border" aria-hidden />
        <Select
          size="sm"
          aria-label="Indentation"
          value={String(indent)}
          onChange={(e) => setIndent(Number(e.target.value))}
          options={INDENT_OPTIONS}
          className="w-[104px]"
        />
        <div className="ml-auto flex items-center" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            {error ? (
              <motion.span key="err" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={spring}>
                <Badge tone="danger">Invalid {inputLabel}</Badge>
              </motion.span>
            ) : input.trim() ? (
              <motion.span key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={spring}>
                <Badge tone="success">Valid {inputLabel}</Badge>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <Panel
          title={`${inputLabel} input`}
          icon={inputLang === 'json' ? <FileJson /> : <FileCode />}
          meta={input ? `${countLines(input)} lines` : undefined}
          className="min-h-[320px]"
          bodyClassName="flex flex-col"
        >
          <div className="relative min-h-0 flex-1">
            <Editor
              value={input}
              onChange={setInput}
              language={inputLang}
              path="yaml-tool-input"
              placeholder={inputLang === 'json' ? 'Paste JSON here…' : 'Paste YAML here…'}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                monacoRef.current = monaco;
                setMounted(true);
              }}
            />
          </div>
          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={spring}
                className="shrink-0 overflow-hidden"
              >
                <div role="alert" className="flex items-start gap-2.5 border-t border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
                  <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                  <p className="min-w-0 flex-1 break-words font-medium leading-relaxed">{error.message}</p>
                  {showYamlHint && (
                    <button
                      type="button"
                      onClick={() => changeDirection('yaml-to-json')}
                      className="focus-ring shrink-0 rounded px-1.5 py-0.5 font-medium text-foreground underline decoration-border-strong underline-offset-2 hover:decoration-foreground"
                    >
                      Looks like YAML — switch
                    </button>
                  )}
                  {error.line !== undefined && (
                    <button
                      type="button"
                      onClick={jumpToError}
                      title="Jump to error"
                      className="focus-ring shrink-0 rounded border border-destructive/30 px-1.5 py-0.5 font-mono text-2xs transition-colors hover:bg-destructive/15"
                    >
                      Ln {error.line}, Col {error.column ?? 1}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>

        <Panel
          title={`${outputLabel} output`}
          icon={outputLang === 'json' ? <FileJson /> : <FileCode />}
          meta={
            documents > 1 ? (
              <Badge tone="primary" className="normal-case tracking-normal">
                <Layers />
                {documents} docs → array
              </Badge>
            ) : output ? (
              `${countLines(output)} lines`
            ) : undefined
          }
          className="min-h-[320px]"
          actions={
            <>
              <CopyButton value={output} message={`${outputLabel} copied`} disabled={!output} />
              <IconButton label={`Download .${outputLang}`} size="sm" onClick={handleDownload} disabled={!output}>
                <Download />
              </IconButton>
            </>
          }
        >
          <div className={cn('h-full transition-opacity duration-200', error && 'opacity-50')}>
            <Editor value={output} readOnly language={outputLang} path="yaml-tool-output" placeholder="Output appears here" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
