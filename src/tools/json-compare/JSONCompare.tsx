import { useEffect, useRef, useState } from 'react';
import type { DiffOnMount } from '@monaco-editor/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowLeftRight, ArrowRight, ArrowUpDown, Columns2, GitCompare, Rows2, Space, Wand2 } from 'lucide-react';
import { usePaletteActions } from '../../app/paletteActions';
import { DiffEditor } from '../../components/editor/DiffEditor';
import { Badge, Button, IconButton, Panel, SegmentedControl, ToggleChip, ToolHeader, cn } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useSessionState } from '../../hooks/useSessionState';
import { formatJSON } from '../../utils/jsonUtils';

type DiffEditorInstance = Parameters<DiffOnMount>[0];
type Monaco = Parameters<DiffOnMount>[1];
type LineChange = NonNullable<ReturnType<DiffEditorInstance['getLineChanges']>>[number];
type ContentWidget = Parameters<ReturnType<DiffEditorInstance['getOriginalEditor']>['addContentWidget']>[0];

const sortKeysDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, sortKeysDeep((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
};

const WIDGET_CLASS =
  'cursor-pointer select-none rounded border border-primary/30 bg-primary/15 px-1 text-[11px] font-bold leading-4 text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground';

export const JSONCompare = () => {
  const toast = useToast();
  const [original, setOriginal] = useSessionState('json-compare-original', '');
  const [modified, setModified] = useSessionState('json-compare-modified', '');
  const [sideBySide, setSideBySide] = useSessionState('json-compare-split', true);
  const [ignoreWhitespace, setIgnoreWhitespace] = useSessionState('json-compare-ignore-ws', false);
  const [stats, setStats] = useState<{ added: number; removed: number; changes: number } | null>(null);

  const editorRef = useRef<DiffEditorInstance | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const widgetsRef = useRef<ContentWidget[]>([]);
  const cleanupRef = useRef<() => void>();

  useEffect(() => () => cleanupRef.current?.(), []);

  const values = () => {
    const ed = editorRef.current;
    return ed
      ? { original: ed.getOriginalEditor().getValue(), modified: ed.getModifiedEditor().getValue() }
      : { original, modified };
  };

  const formatBoth = (sort: boolean) => {
    const v = values();
    try {
      const fmt = (s: string) => (s.trim() ? (sort ? JSON.stringify(sortKeysDeep(JSON.parse(s)), null, 2) : formatJSON(s)) : s);
      setOriginal(fmt(v.original));
      setModified(fmt(v.modified));
      toast.success(sort ? 'Formatted with sorted keys' : 'Both sides formatted');
    } catch {
      toast.error('Invalid JSON — fix the highlighted side first');
    }
  };

  const swap = () => {
    const v = values();
    setOriginal(v.modified);
    setModified(v.original);
  };

  const handleMount: DiffOnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const originalModel = editor.getOriginalEditor().getModel();
    const modifiedModel = editor.getModifiedEditor().getModel();
    const subs = [
      originalModel?.onDidChangeContent(() => setOriginal(originalModel.getValue())),
      modifiedModel?.onDidChangeContent(() => setModified(modifiedModel.getValue())),
      editor.onDidUpdateDiff(() => updateWidgets(editor, monaco)),
    ];
    cleanupRef.current = () => subs.forEach((s) => s?.dispose());
    setTimeout(() => updateWidgets(editor, monaco), 100);
  };

  // Per-change merge arrows (→ copies a hunk left-to-right, ← right-to-left)
  const applyChange = (editor: DiffEditorInstance, monaco: Monaco, change: LineChange, direction: 'L2R' | 'R2L') => {
    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();
    const originalModel = originalEditor.getModel();
    const modifiedModel = modifiedEditor.getModel();
    if (!originalModel || !modifiedModel) return;

    const [srcModel, dstEditor, srcStart, srcEnd, dstStart, dstEnd] =
      direction === 'L2R'
        ? [originalModel, modifiedEditor, change.originalStartLineNumber, change.originalEndLineNumber, change.modifiedStartLineNumber, change.modifiedEndLineNumber]
        : [modifiedModel, originalEditor, change.modifiedStartLineNumber, change.modifiedEndLineNumber, change.originalStartLineNumber, change.originalEndLineNumber];
    const dstModel = dstEditor.getModel();
    if (!dstModel) return;

    const text = srcEnd >= srcStart ? srcModel.getValueInRange(new monaco.Range(srcStart, 1, srcEnd, srcModel.getLineMaxColumn(srcEnd))) : '';
    if (dstEnd >= dstStart) {
      const range = new monaco.Range(dstStart, 1, dstEnd, dstModel.getLineMaxColumn(dstEnd));
      dstEditor.executeEdits('merge', [{ range, text, forceMoveMarkers: true }]);
    } else {
      // Pure insertion: the destination has no lines for this hunk
      const line = dstStart + 1;
      const atEnd = line > dstModel.getLineCount();
      const range = atEnd
        ? new monaco.Range(dstModel.getLineCount(), dstModel.getLineMaxColumn(dstModel.getLineCount()), dstModel.getLineCount(), dstModel.getLineMaxColumn(dstModel.getLineCount()))
        : new monaco.Range(line, 1, line, 1);
      dstEditor.executeEdits('merge', [{ range, text: atEnd ? '\n' + text : text + '\n', forceMoveMarkers: true }]);
    }
  };

  const updateWidgets = (editor: DiffEditorInstance, monaco: Monaco) => {
    widgetsRef.current.forEach((w) => {
      editor.getOriginalEditor().removeContentWidget(w);
      editor.getModifiedEditor().removeContentWidget(w);
    });
    widgetsRef.current = [];

    const changes = editor.getLineChanges() ?? [];
    let added = 0;
    let removed = 0;
    changes.forEach((c) => {
      if (c.modifiedEndLineNumber >= c.modifiedStartLineNumber) added += c.modifiedEndLineNumber - c.modifiedStartLineNumber + 1;
      if (c.originalEndLineNumber >= c.originalStartLineNumber) removed += c.originalEndLineNumber - c.originalStartLineNumber + 1;
    });
    setStats({ added, removed, changes: changes.length });

    changes.forEach((change, idx) => {
      const make = (label: string, title: string, onClick: () => void) => {
        const el = document.createElement('div');
        el.textContent = label;
        el.title = title;
        el.className = WIDGET_CLASS;
        el.onmousedown = (e) => e.preventDefault();
        el.onclick = (e) => {
          e.stopPropagation();
          onClick();
        };
        return el;
      };
      const l2r = make('→', 'Apply this change to the right', () => applyChange(editor, monaco, change, 'L2R'));
      const r2l = make('←', 'Apply this change to the left', () => applyChange(editor, monaco, change, 'R2L'));
      const position = (line: number) => ({
        position: { lineNumber: Math.max(line, 1), column: 1 },
        preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
      });
      const l2rWidget: ContentWidget = { getId: () => `l2r-${idx}`, getDomNode: () => l2r, getPosition: () => position(change.originalStartLineNumber) };
      const r2lWidget: ContentWidget = { getId: () => `r2l-${idx}`, getDomNode: () => r2l, getPosition: () => position(change.modifiedStartLineNumber) };
      editor.getOriginalEditor().addContentWidget(l2rWidget);
      editor.getModifiedEditor().addContentWidget(r2lWidget);
      widgetsRef.current.push(l2rWidget, r2lWidget);
    });
  };

  const identical = stats?.changes === 0 && (original || modified);

  usePaletteActions([
    { id: 'format', title: 'Format both sides', icon: Wand2, keywords: ['prettify', 'beautify'], run: () => formatBoth(false) },
    { id: 'sort', title: 'Sort keys & format', icon: ArrowUpDown, keywords: ['alphabetical', 'order'], run: () => formatBoth(true) },
    { id: 'swap', title: 'Swap sides', icon: ArrowLeftRight, keywords: ['flip', 'reverse'], run: swap },
    { id: 'l2r', title: 'Copy left → right', icon: ArrowRight, keywords: ['original', 'modified'], run: () => setModified(values().original) },
    { id: 'r2l', title: 'Copy right → left', icon: ArrowLeft, keywords: ['original', 'modified'], run: () => setOriginal(values().modified) },
    { id: 'layout', title: sideBySide ? 'Switch to inline view' : 'Switch to split view', icon: sideBySide ? Rows2 : Columns2, keywords: ['layout', 'split', 'inline', 'side by side'], run: () => setSideBySide(!sideBySide) },
    { id: 'whitespace', title: ignoreWhitespace ? 'Show whitespace changes' : 'Ignore whitespace', icon: Space, keywords: ['trim', 'spaces'], run: () => setIgnoreWhitespace(!ignoreWhitespace) },
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 md:p-6">
      <ToolHeader
        icon={<GitCompare />}
        title="JSON Compare"
        description="Side-by-side diff with one-click merging of individual changes"
        actions={
          <>
            <AnimatePresence mode="popLayout" initial={false}>
              {stats && (original || modified) && (
                <motion.div key={`${stats.added}-${stats.removed}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-1.5">
                  {identical ? (
                    <Badge tone="success">Identical</Badge>
                  ) : (
                    <>
                      <Badge tone="success">+{stats.added}</Badge>
                      <Badge tone="danger">−{stats.removed}</Badge>
                      <Badge>
                        {stats.changes} change{stats.changes === 1 ? '' : 's'}
                      </Badge>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => formatBoth(false)}>
          <Wand2 className="h-3.5 w-3.5" />
          Format both
        </Button>
        <Button size="sm" variant="secondary" onClick={() => formatBoth(true)}>
          <ArrowUpDown className="h-3.5 w-3.5" />
          Sort keys & format
        </Button>
        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <IconButton label="Copy left → right" onClick={() => setModified(values().original)}>
          <ArrowRight />
        </IconButton>
        <IconButton label="Swap sides" onClick={swap}>
          <ArrowLeftRight />
        </IconButton>
        <IconButton label="Copy right → left" onClick={() => setOriginal(values().modified)}>
          <ArrowLeft />
        </IconButton>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ToggleChip checked={ignoreWhitespace} onChange={setIgnoreWhitespace}>
            Ignore whitespace
          </ToggleChip>
          <SegmentedControl
            aria-label="Layout"
            value={sideBySide ? 'split' : 'inline'}
            onChange={(v) => setSideBySide(v === 'split')}
            options={[
              { value: 'split', label: 'Split' },
              { value: 'inline', label: 'Inline' },
            ]}
          />
        </div>
      </div>

      <Panel className="min-h-[360px] flex-1" bodyClassName="flex flex-col">
        <div className={cn('grid h-10 shrink-0 items-center border-b border-border-subtle px-3.5', sideBySide ? 'grid-cols-2' : 'grid-cols-1')}>
          <span className="label-caps">{sideBySide ? 'Original' : 'Original → Modified'}</span>
          {sideBySide && <span className="label-caps pl-3.5">Modified</span>}
        </div>
        <div className="min-h-0 flex-1">
          <DiffEditor
          original={original}
          modified={modified}
          language="json"
          sideBySide={sideBySide}
          ignoreTrimWhitespace={ignoreWhitespace}
          onMount={handleMount}
          />
        </div>
      </Panel>
    </div>
  );
};
