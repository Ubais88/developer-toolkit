import { useRef, useEffect } from 'react';
import { useSessionState } from '../hooks/useSessionState';
import { DiffEditor, MonacoDiffEditor, useMonaco } from '@monaco-editor/react';
import { Button } from './Button';
import { ArrowRight, ArrowLeft, Wand2 } from 'lucide-react';
import { formatJSON } from '../utils/jsonUtils';
import { useTheme } from '../context/ThemeContext';

interface JSONCompareProps {
  onCopy: (text: string) => void;
}

export const JSONCompare = ({ onCopy }: JSONCompareProps) => {
  const { mode, basePalette } = useTheme();
  const monaco = useMonaco();
  const [original, setOriginal] = useSessionState('json-compare-original', '');
  const [modified, setModified] = useSessionState('json-compare-modified', '');

  const diffEditorRef = useRef<MonacoDiffEditor | null>(null);
  const widgetsRef = useRef<any[]>([]);

  // Dynamically update DiffEditor background matching current active basePalette
  useEffect(() => {
    if (monaco) {
      const bgColors = {
        oled: '#000000',
        charcoal: '#141414',
        graphite: '#18181b',
        slate: '#181a1f',
        'light-slate': '#f8fafc',
        'light-stone': '#fafaf9',
        'light-warm': '#fafafb',
      };
      
      const currentBg = bgColors[basePalette as keyof typeof bgColors] || '#141414';

      monaco.editor.defineTheme('premium-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': currentBg,
          'editor.foreground': '#cbd5e1',
          'editorCursor.foreground': 'hsl(var(--primary))',
          'editor.lineHighlightBackground': mode === 'dark' ? '#ffffff06' : '#00000006',
          'editorLineNumber.foreground': '#475569',
          'editor.selectionBackground': 'hsl(var(--primary)/0.25)',
          'editor.inactiveSelectionBackground': 'hsl(var(--primary)/0.1)',
        }
      });
      
      monaco.editor.setTheme(mode === 'dark' ? 'premium-dark' : 'light');
    }
  }, [monaco, basePalette, mode]);

  const getEditorValues = () => {
    if (diffEditorRef.current) {
      return {
        original: diffEditorRef.current.getOriginalEditor().getValue(),
        modified: diffEditorRef.current.getModifiedEditor().getValue()
      };
    }
    return { original, modified };
  };

  const handleFormat = () => {
    try {
      const values = getEditorValues();
      const formattedOriginal = formatJSON(values.original);
      const formattedModified = formatJSON(values.modified);
      setOriginal(formattedOriginal);
      setModified(formattedModified);
      onCopy('JSON formatted');
    } catch (error) {
      onCopy('Invalid JSON');
    }
  };

  const handleCopyLeftToRight = () => {
    const values = getEditorValues();
    setModified(values.original);
    onCopy('Copied Left to Right');
  };

  const handleCopyRightToLeft = () => {
    const values = getEditorValues();
    setOriginal(values.modified);
    onCopy('Copied Right to Left');
  };

  useEffect(() => {
    if (!monaco || !diffEditorRef.current) return;
    const diffEditor = diffEditorRef.current;

    // ... Existing widget logic (kept for functionality but could be stylized if needed) ...
    // For brevity in this redesign, keeping core logic if possible or assuming it works.
    // I will include the widget logic to ensure functionality is preserved.

    const applyChange = (change: any, direction: 'L2R' | 'R2L') => {
      const originalEditor = diffEditor.getOriginalEditor();
      const modifiedEditor = diffEditor.getModifiedEditor();
      const originalModel = originalEditor.getModel();
      const modifiedModel = modifiedEditor.getModel();
      if (!originalModel || !modifiedModel) return;

      if (direction === 'L2R') {
        let text = '';
        if (change.originalEndLineNumber >= change.originalStartLineNumber) {
          const range = new monaco.Range(change.originalStartLineNumber, 1, change.originalEndLineNumber, originalModel.getLineMaxColumn(change.originalEndLineNumber));
          text = originalModel.getValueInRange(range);
        }
        if (change.modifiedEndLineNumber >= change.modifiedStartLineNumber) {
          const range = new monaco.Range(change.modifiedStartLineNumber, 1, change.modifiedEndLineNumber, modifiedModel.getLineMaxColumn(change.modifiedEndLineNumber));
          modifiedEditor.executeEdits('diff', [{ range, text, forceMoveMarkers: true }]);
        } else {
          const range = new monaco.Range(change.modifiedStartLineNumber, 1, change.modifiedStartLineNumber, 1);
          modifiedEditor.executeEdits('diff', [{ range, text: text.trimEnd() + (text ? '\n' : ''), forceMoveMarkers: true }]);
        }
      } else {
        let text = '';
        if (change.modifiedEndLineNumber >= change.modifiedStartLineNumber) {
          const range = new monaco.Range(change.modifiedStartLineNumber, 1, change.modifiedEndLineNumber, modifiedModel.getLineMaxColumn(change.modifiedEndLineNumber));
          text = modifiedModel.getValueInRange(range);
        }
        if (change.originalEndLineNumber >= change.originalStartLineNumber) {
          const range = new monaco.Range(change.originalStartLineNumber, 1, change.originalEndLineNumber, originalModel.getLineMaxColumn(change.originalEndLineNumber));
          originalEditor.executeEdits('diff', [{ range, text, forceMoveMarkers: true }]);
        } else {
          const range = new monaco.Range(change.originalStartLineNumber, 1, change.originalStartLineNumber, 1);
          originalEditor.executeEdits('diff', [{ range, text: text.trimEnd() + (text ? '\n' : ''), forceMoveMarkers: true }]);
        }
      }
    };

    const updateWidgets = () => {
      widgetsRef.current.forEach(w => {
        diffEditor.getOriginalEditor().removeContentWidget(w);
        diffEditor.getModifiedEditor().removeContentWidget(w);
      });
      widgetsRef.current = [];
      const changes = diffEditor.getLineChanges() || [];
      changes.forEach((change, idx) => {
        const l2rBtn = document.createElement('div');
        l2rBtn.innerHTML = '→';
        l2rBtn.className = 'cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary rounded px-1 text-xs font-bold border border-primary/20 z-50 backdrop-blur-sm';
        l2rBtn.onclick = (e) => { e.stopPropagation(); applyChange(change, 'L2R'); };
        const l2rWidget = { getId: () => `l2r-${idx}`, getDomNode: () => l2rBtn, getPosition: () => ({ position: { lineNumber: Math.max(change.originalStartLineNumber, 1), column: 1 }, preference: [monaco.editor.ContentWidgetPositionPreference.EXACT] }) };
        diffEditor.getOriginalEditor().addContentWidget(l2rWidget);
        widgetsRef.current.push(l2rWidget);

        const r2lBtn = document.createElement('div');
        r2lBtn.innerHTML = '←';
        r2lBtn.className = 'cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary rounded px-1 text-xs font-bold border border-primary/20 z-50 backdrop-blur-sm';
        r2lBtn.onclick = (e) => { e.stopPropagation(); applyChange(change, 'R2L'); };
        const r2lWidget = { getId: () => `r2l-${idx}`, getDomNode: () => r2lBtn, getPosition: () => ({ position: { lineNumber: Math.max(change.modifiedStartLineNumber, 1), column: 1 }, preference: [monaco.editor.ContentWidgetPositionPreference.EXACT] }) };
        diffEditor.getModifiedEditor().addContentWidget(r2lWidget);
        widgetsRef.current.push(r2lWidget);
      });
    };
    const disposable = diffEditor.onDidUpdateDiff(updateWidgets);
    setTimeout(updateWidgets, 100);
    return () => { disposable.dispose(); };
  }, [monaco]);

  return (
    <div className="flex flex-col h-full bg-transparent relative group">
      {/* Tools Layer */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-full shadow-lg transition-all opacity-100 ring-1 ring-black/5">
        <Button onClick={handleCopyLeftToRight} variant="ghost" size="none" className="rounded-full w-8 h-8 p-0" title="Copy Left to Right">
          <ArrowRight className="w-4 h-4 text-slate-500 hover:text-primary transition-colors" />
        </Button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
        <Button onClick={handleFormat} variant="ghost" size="sm" className="gap-2 px-3 rounded-full text-slate-600 dark:text-slate-300">
          <Wand2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold">Format Both</span>
        </Button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
        <Button onClick={handleCopyRightToLeft} variant="ghost" size="none" className="rounded-full w-8 h-8 p-0" title="Copy Right to Left">
          <ArrowLeft className="w-4 h-4 text-slate-500 hover:text-primary transition-colors" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden relative">
        <style>{`
             .monaco-editor .content-widget { z-index: 100; }
           `}</style>
        <DiffEditor
          height="100%"
          language="json"
          original={original}
          modified={modified}
           theme={mode === 'dark' ? 'premium-dark' : 'light'}
          onMount={(editor) => {
            diffEditorRef.current = editor;

            const originalModel = editor.getOriginalEditor().getModel();
            const modifiedModel = editor.getModifiedEditor().getModel();
            if (originalModel) originalModel.onDidChangeContent(() => setOriginal(originalModel.getValue()));
            if (modifiedModel) modifiedModel.onDidChangeContent(() => setModified(modifiedModel.getValue()));
          }}
          options={{
            originalEditable: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Inter', monospace",
            padding: { top: 24, bottom: 24 },
            renderOverviewRuler: false,
            find: {
              addExtraSpaceOnTop: false,
            },
          }}
        />
      </div>
    </div>
  );
};
