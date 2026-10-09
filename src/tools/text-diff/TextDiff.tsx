import { useCallback, useEffect, useRef, useState } from 'react';
import type { DiffOnMount } from '@monaco-editor/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, Braces, ChevronDown, ChevronUp, Columns2, Eraser, FileDiff, Rows2, Space, Sparkles, WrapText } from 'lucide-react';
import { usePaletteActions } from '../../app/paletteActions';
import { DiffEditor } from '../../components/editor/DiffEditor';
import { Badge, Button, IconButton, Panel, SegmentedControl, Select, ToggleChip, ToolHeader, cn } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useSessionState } from '../../hooks/useSessionState';
import { DEFAULT_SAMPLE, DIFF_LANGUAGES, sampleFor } from './samples';

type DiffEditorInstance = Parameters<DiffOnMount>[0];
type CodeEditorInstance = ReturnType<DiffEditorInstance['getModifiedEditor']>;
type ViewMode = 'split' | 'inline';

interface DiffStats {
  added: number;
  removed: number;
  changes: number;
}

const KEY_ORIGINAL = 'diff-original';
const KEY_MODIFIED = 'diff-modified';
const WRITE_DEBOUNCE = 300;
/** Below this width Monaco falls back to the inline view even in split mode. */
const INLINE_BREAKPOINT = 760;
const spring = { type: 'spring', stiffness: 500, damping: 36 } as const;

function lineCount(text: string): number {
  if (!text) return 0;
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
}

function replaceAll(editor: CodeEditorInstance, text: string) {
  const model = editor.getModel();
  if (!model || model.getValue() === text) return;
  editor.executeEdits('text-diff', [{ range: model.getFullModelRange(), text, forceMoveMarkers: true }]);
  editor.pushUndoStop();
}

function writeSession(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — nothing to persist */
  }
}

/** A number that rolls vertically when it changes. */
function Count({ value }: { value: number }) {
  return (
    <span className="relative inline-flex overflow-hidden tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '-70%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '70%', opacity: 0 }}
          transition={spring}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function PaneLabel({ tone, label, lines, className }: { tone: 'danger' | 'success'; label: string; lines: number; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2 px-3.5', className)}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tone === 'danger' ? 'bg-destructive' : 'bg-success')} />
      <span className="label-caps">{label}</span>
      <span className="truncate text-2xs text-muted-foreground/70">
        {lines} {lines === 1 ? 'line' : 'lines'}
      </span>
    </div>
  );
}

export function TextDiff() {
  const toast = useToast();
  const [original, setOriginal] = useSessionState(KEY_ORIGINAL, DEFAULT_SAMPLE.original);
  const [modified, setModified] = useSessionState(KEY_MODIFIED, DEFAULT_SAMPLE.modified);
  const [language, setLanguage] = useSessionState('diff-language', 'plaintext');
  const [view, setView] = useSessionState<ViewMode>('diff-view', 'split');
  const [ignoreWs, setIgnoreWs] = useSessionState('diff-ignore-ws', false);
  const [wrap, setWrap] = useSessionState('diff-wrap', false);

  // Monaco's diff editor resets the cursor whenever its `original` prop changes, so the props only
  // carry the initial text. Later programmatic edits go straight to the models via `setTexts`.
  const [seed, setSeed] = useState(() => ({ original, modified }));
  const [stats, setStats] = useState<DiffStats | null>(null);
  const [wide, setWide] = useState(true);

  const editorRef = useRef<DiffEditorInstance | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const timers = useRef<{ original?: ReturnType<typeof setTimeout>; modified?: ReturnType<typeof setTimeout> }>({});
  const pending = useRef<{ original?: string; modified?: string }>({});

  // Track the pane width so the labels match the view Monaco actually renders.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= INLINE_BREAKPOINT));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Flush debounced writes if the tool unmounts mid-typing.
  useEffect(() => {
    const t = timers.current;
    const p = pending.current;
    return () => {
      clearTimeout(t.original);
      clearTimeout(t.modified);
      if (p.original !== undefined) writeSession(KEY_ORIGINAL, p.original);
      if (p.modified !== undefined) writeSession(KEY_MODIFIED, p.modified);
    };
  }, []);

  const handleMount = useCallback<DiffOnMount>(
    (editor) => {
      editorRef.current = editor;
      editor.updateOptions({ renderSideBySideInlineBreakpoint: INLINE_BREAKPOINT });

      const watch = (side: 'original' | 'modified', code: CodeEditorInstance, commit: (v: string) => void) => {
        code.onDidChangeModelContent(() => {
          const value = code.getValue();
          pending.current[side] = value;
          clearTimeout(timers.current[side]);
          timers.current[side] = setTimeout(() => {
            pending.current[side] = undefined;
            commit(value);
          }, WRITE_DEBOUNCE);
        });
      };
      watch('original', editor.getOriginalEditor(), setOriginal);
      watch('modified', editor.getModifiedEditor(), setModified);

      const updateStats = () => {
        const changes = editor.getLineChanges();
        if (!changes) return;
        let added = 0;
        let removed = 0;
        for (const c of changes) {
          if (c.modifiedEndLineNumber > 0) added += c.modifiedEndLineNumber - c.modifiedStartLineNumber + 1;
          if (c.originalEndLineNumber > 0) removed += c.originalEndLineNumber - c.originalStartLineNumber + 1;
        }
        setStats({ added, removed, changes: changes.length });
      };
      editor.onDidUpdateDiff(updateStats);
      // The first diff may already be computed by the time onMount runs.
      updateStats();
    },
    [setOriginal, setModified],
  );

  const current = () => {
    const ed = editorRef.current;
    return ed
      ? { original: ed.getOriginalEditor().getValue(), modified: ed.getModifiedEditor().getValue() }
      : { original, modified };
  };

  const setTexts = (nextOriginal: string, nextModified: string) => {
    const ed = editorRef.current;
    if (ed) {
      replaceAll(ed.getOriginalEditor(), nextOriginal);
      replaceAll(ed.getModifiedEditor(), nextModified);
    } else {
      setSeed({ original: nextOriginal, modified: nextModified });
    }
    setOriginal(nextOriginal);
    setModified(nextModified);
  };

  const swap = () => {
    const { original: o, modified: m } = current();
    setTexts(m, o);
  };

  const formatJson = () => {
    const texts = current();
    const out = { ...texts };
    for (const side of ['original', 'modified'] as const) {
      if (!texts[side].trim()) continue;
      try {
        out[side] = JSON.stringify(JSON.parse(texts[side]), null, 2) + '\n';
      } catch (e) {
        toast.error(`${side === 'original' ? 'Original' : 'Modified'} is not valid JSON: ${(e as Error).message}`);
        return;
      }
    }
    setTexts(out.original, out.modified);
    toast.success('Formatted both sides');
  };

  const loadSample = () => {
    const s = sampleFor(language);
    setTexts(s.original, s.modified);
  };

  const clear = () => {
    setTexts('', '');
    editorRef.current?.getOriginalEditor().focus();
  };

  const split = view === 'split' && wide;
  const isEmpty = !original && !modified;

  usePaletteActions([
    ...(stats?.changes
      ? [
          { id: 'next', title: 'Next change', icon: ChevronDown, keywords: ['jump', 'navigate'], run: () => editorRef.current?.goToDiff('next') },
          { id: 'prev', title: 'Previous change', icon: ChevronUp, keywords: ['jump', 'navigate'], run: () => editorRef.current?.goToDiff('previous') },
        ]
      : []),
    ...(isEmpty ? [] : [{ id: 'swap', title: 'Swap sides', icon: ArrowLeftRight, keywords: ['flip', 'reverse'], run: swap }]),
    ...(language === 'json' && !isEmpty ? [{ id: 'format', title: 'Format both as JSON', icon: Braces, keywords: ['prettify'], run: formatJson }] : []),
    { id: 'layout', title: view === 'split' ? 'Switch to inline view' : 'Switch to split view', icon: view === 'split' ? Rows2 : Columns2, keywords: ['layout', 'side by side'], run: () => setView(view === 'split' ? 'inline' : 'split') },
    { id: 'whitespace', title: ignoreWs ? 'Show whitespace changes' : 'Ignore whitespace', icon: Space, keywords: ['trim', 'spaces'], run: () => setIgnoreWs(!ignoreWs) },
    { id: 'wrap', title: wrap ? 'Disable line wrap' : 'Wrap lines', icon: WrapText, keywords: ['word wrap'], run: () => setWrap(!wrap) },
    { id: 'sample', title: 'Load sample', icon: Sparkles, keywords: ['example', 'demo'], run: loadSample },
    ...(isEmpty ? [] : [{ id: 'clear', title: 'Clear both sides', icon: Eraser, keywords: ['empty', 'reset'], run: clear }]),
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 md:p-6 lg:overflow-hidden">
      <ToolHeader
        icon={<FileDiff />}
        title="Text Diff"
        description="Compare two texts or code snippets side by side"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={loadSample}>
              <Sparkles className="h-3.5 w-3.5" />
              Load sample
            </Button>
            <Button variant="ghost" size="sm" onClick={clear} disabled={isEmpty}>
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            size="sm"
            aria-label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={DIFF_LANGUAGES}
            className="w-[124px]"
          />
          <SegmentedControl<ViewMode>
            aria-label="Diff layout"
            value={view}
            onChange={setView}
            options={[
              { value: 'split', label: 'Split', icon: <Columns2 /> },
              { value: 'inline', label: 'Inline', icon: <Rows2 /> },
            ]}
          />
          <ToggleChip checked={ignoreWs} onChange={setIgnoreWs} title="Ignore leading and trailing whitespace">
            Ignore whitespace
          </ToggleChip>
          <ToggleChip checked={wrap} onChange={setWrap}>
            Wrap lines
          </ToggleChip>
          <div className="mx-0.5 hidden h-5 w-px bg-border sm:block" aria-hidden />
          <div className="flex items-center gap-0.5">
            <IconButton label="Swap sides" size="sm" onClick={swap} disabled={isEmpty}>
              <ArrowLeftRight />
            </IconButton>
            <AnimatePresence initial={false}>
              {language === 'json' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 'auto' }}
                  exit={{ opacity: 0, scale: 0.8, width: 0 }}
                  transition={spring}
                  className="inline-flex"
                >
                  <IconButton label="Format both as JSON" size="sm" onClick={formatJson} disabled={isEmpty}>
                    <Braces />
                  </IconButton>
                </motion.span>
              )}
            </AnimatePresence>
            <IconButton
              label="Previous change"
              size="sm"
              onClick={() => editorRef.current?.goToDiff('previous')}
              disabled={!stats?.changes}
            >
              <ChevronUp />
            </IconButton>
            <IconButton
              label="Next change"
              size="sm"
              onClick={() => editorRef.current?.goToDiff('next')}
              disabled={!stats?.changes}
            >
              <ChevronDown />
            </IconButton>
          </div>
        </div>

        <div className="flex min-h-5 items-center gap-1.5" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            {stats &&
              (stats.changes === 0 ? (
                <motion.span
                  key="identical"
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={spring}
                >
                  <Badge tone="primary">{isEmpty ? 'Empty' : 'Identical'}</Badge>
                </motion.span>
              ) : (
                <motion.span
                  key="stats"
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={spring}
                  className="flex items-center gap-1.5"
                >
                  <Badge tone="success">
                    +<Count value={stats.added} /> added
                  </Badge>
                  <Badge tone="danger">
                    −<Count value={stats.removed} /> removed
                  </Badge>
                  <Badge>
                    <Count value={stats.changes} /> {stats.changes === 1 ? 'change' : 'changes'}
                  </Badge>
                </motion.span>
              ))}
          </AnimatePresence>
        </div>
      </div>

      <Panel className="min-h-[420px] flex-1" bodyClassName="flex flex-col">
        <div className="relative h-9 shrink-0 border-b border-border-subtle">
          <AnimatePresence initial={false} mode="wait">
            {split ? (
              <motion.div
                key="split"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="grid h-full grid-cols-2"
              >
                <PaneLabel tone="danger" label="Original" lines={lineCount(original)} />
                <PaneLabel tone="success" label="Modified" lines={lineCount(modified)} className="border-l border-border-subtle" />
              </motion.div>
            ) : (
              <motion.div
                key="inline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex h-full items-center"
              >
                <PaneLabel tone="danger" label="Original" lines={lineCount(original)} className="pr-0" />
                <ArrowLeftRight className="mx-2.5 h-3 w-3 shrink-0 text-muted-foreground/60" aria-hidden />
                <PaneLabel tone="success" label="Modified" lines={lineCount(modified)} className="pl-0" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div ref={hostRef} className="relative min-h-0 flex-1">
          <DiffEditor
            original={seed.original}
            modified={seed.modified}
            language={language}
            sideBySide={view === 'split'}
            ignoreTrimWhitespace={ignoreWs}
            wordWrap={wrap}
            onMount={handleMount}
          />
        </div>
      </Panel>
    </div>
  );
}
