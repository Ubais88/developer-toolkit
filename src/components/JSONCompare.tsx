import { useState, useRef, useEffect } from 'react';
import { DiffEditor, MonacoDiffEditor, useMonaco } from '@monaco-editor/react';
import { Button } from './Button';
import { FileJson, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatJSON } from '../utils/jsonUtils';
import { useTheme } from '../context/ThemeContext';

interface JSONCompareProps {
  onCopy: (text: string) => void;
}

export const JSONCompare = ({ onCopy }: JSONCompareProps) => {
  const { mode } = useTheme();
  const monaco = useMonaco();
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  
  const diffEditorRef = useRef<MonacoDiffEditor | null>(null);
  const widgetsRef = useRef<any[]>([]);

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
      setOriginal(formatJSON(values.original));
      setModified(formatJSON(values.modified));
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
    
    // Function to apply changes from one side to the other
    const applyChange = (change: any, direction: 'L2R' | 'R2L') => {
       const originalEditor = diffEditor.getOriginalEditor();
       const modifiedEditor = diffEditor.getModifiedEditor();
       const originalModel = originalEditor.getModel();
       const modifiedModel = modifiedEditor.getModel();

       if (!originalModel || !modifiedModel) return;

       if (direction === 'L2R') {
         // Taking content from Original (Left) and putting into Modified (Right)
         let text = '';
         // Check if original range has content
         if (change.originalEndLineNumber >= change.originalStartLineNumber) {
            const range = new monaco.Range(
               change.originalStartLineNumber, 
               1, 
               change.originalEndLineNumber, 
               originalModel.getLineMaxColumn(change.originalEndLineNumber)
            );
            text = originalModel.getValueInRange(range);
         }

         // Determine replacement range in Modified
         // If insertion (change.modifiedEnd < start), we insert at start
         // If modification/deletion (change.modifiedEnd >= start), we replace lines
         
         if (change.modifiedEndLineNumber >= change.modifiedStartLineNumber) {
            // Replace existing lines
            const range = new monaco.Range(
              change.modifiedStartLineNumber,
              1,
              change.modifiedEndLineNumber,
              modifiedModel.getLineMaxColumn(change.modifiedEndLineNumber)
            );
            modifiedEditor.executeEdits('diff', [{ range, text, forceMoveMarkers: true }]);
         } else {
             // Insertion point (target is empty here)
             // We want to insert lines.
             // But executeEdits with range (line, 1, line, 1) inserts.
             // If we copy 3 lines, we insert 3 lines.
             // We need to handle newline carefully if inserting into middle of content?
             // Actually, monaco diff lines are whole lines.
             // If we insert at line X, we push down line X?
             // Yes.
             const range = new monaco.Range(
               change.modifiedStartLineNumber,
               1,
               change.modifiedStartLineNumber,
               1
             );
             // If putting multiple lines, ensure we add newline if needed?
             // Actually, getValueInRange doesn't get trailing newline of last line usually?
             // Wait, if we replace lines, we replace content.
             // If we insert, we need to add newlines?
             // Let's assume text contains newlines for the block.
             // Use `text + '\n'`?
             // A simpler way: use full line ranges including the newline character?
             // `getValue` usually excludes last newline?
             
             // Simpler approach:
             // Use `setValue` for the whole doc? No, slow.
             
             // Let's trust that replacing range (start, 1) to (end, maxCol) works for replacement.
             // For insertion: we insert at (start, 1).
             // If we insert "A\nB\nC", it works.
             // If we rely on getLineChanges, it maps lines.
             
             // If simple replacement/insertion creates weird newline issues, manual fix might be needed.
             // But standard approach:
             if (text) text += '\n'; // Usually need a newline when inserting a block of lines?
             // Actually, it depends if we are appending or inserting.
             // Let's rely on standard executeEdits behavior.
             modifiedEditor.executeEdits('diff', [{ range, text: text.trimEnd() + (text ? '\n' : ''), forceMoveMarkers: true }]);
         }
       } else {
         // R2L: Take Modified (Right) -> Original (Left)
         let text = '';
         if (change.modifiedEndLineNumber >= change.modifiedStartLineNumber) {
            const range = new monaco.Range(
              change.modifiedStartLineNumber,
              1,
              change.modifiedEndLineNumber,
              modifiedModel.getLineMaxColumn(change.modifiedEndLineNumber)
            );
            text = modifiedModel.getValueInRange(range);
         }

         if (change.originalEndLineNumber >= change.originalStartLineNumber) {
            const range = new monaco.Range(
              change.originalStartLineNumber,
              1,
              change.originalEndLineNumber,
              originalModel.getLineMaxColumn(change.originalEndLineNumber)
            );
            originalEditor.executeEdits('diff', [{ range, text, forceMoveMarkers: true }]);
         } else {
            const range = new monaco.Range(
               change.originalStartLineNumber,
               1,
               change.originalStartLineNumber,
               1
            );
            originalEditor.executeEdits('diff', [{ range, text: text.trimEnd() + (text ? '\n' : ''), forceMoveMarkers: true }]);
         }
       }
    };

    const updateWidgets = () => {
       // Clear old widgets
       widgetsRef.current.forEach(w => {
          diffEditor.getOriginalEditor().removeContentWidget(w);
          diffEditor.getModifiedEditor().removeContentWidget(w);
       });
       widgetsRef.current = [];

       const changes = diffEditor.getLineChanges() || [];
       
       changes.forEach((change, idx) => {
          // L -> R Button (Overlay on Original)
          // Only if original has lines to copy (deletion or modifications)
          // If original has 0 lines (insertion in mod), we effectively "delete" in mod if we apply L->R (i.e. make equal).
          // We can always show button "Make Right like Left".
          
          const l2rBtn = document.createElement('div');
          l2rBtn.innerHTML = '→';
          l2rBtn.className = 'cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 rounded px-1 text-xs font-bold border border-blue-300 z-50';
          l2rBtn.title = 'Copy to Right';
          l2rBtn.onclick = (e) => { e.stopPropagation(); applyChange(change, 'L2R'); };
          
          const l2rWidget = {
             getId: () => `l2r-${idx}`,
             getDomNode: () => l2rBtn,
             getPosition: () => ({
                position: {
                   lineNumber: Math.max(change.originalStartLineNumber, 1),
                   column: 1
                },
                preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
             })
          };
          diffEditor.getOriginalEditor().addContentWidget(l2rWidget);
          widgetsRef.current.push(l2rWidget);

          // R -> L Button (Overlay on Modified)
          const r2lBtn = document.createElement('div');
          r2lBtn.innerHTML = '←';
          r2lBtn.className = 'cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 rounded px-1 text-xs font-bold border border-blue-300 z-50';
          r2lBtn.title = 'Copy to Left';
          r2lBtn.onclick = (e) => { e.stopPropagation(); applyChange(change, 'R2L'); };
          
          const r2lWidget = {
             getId: () => `r2l-${idx}`,
             getDomNode: () => r2lBtn,
             getPosition: () => ({
                position: {
                   lineNumber: Math.max(change.modifiedStartLineNumber, 1),
                   column: 1
                },
                preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
             })
          };
          diffEditor.getModifiedEditor().addContentWidget(r2lWidget);
          widgetsRef.current.push(r2lWidget);
       });
    };

    const disposable = diffEditor.onDidUpdateDiff(updateWidgets);
    // Initial run
    setTimeout(updateWidgets, 100);

    return () => {
      disposable.dispose();
      widgetsRef.current.forEach(() => {
         // Cleanup if possible? Usually removing widget is enough, which we do on update.
         // But on unmount, editor might dispose widgets itself.
      });
    };
  }, [monaco]); // Removing mode dependency to avoid re-running on theme switch which might flick widgets, but monaco instance is stable.

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 shadow-sm z-10">
        <div className="flex gap-3">
          <Button onClick={handleFormat} variant="secondary" size="sm">
            <FileJson className="w-4 h-4" />
            Format Both
          </Button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 my-auto mx-2" />
          <Button onClick={handleCopyLeftToRight} variant="ghost" size="sm" title="Copy Left to Right">
            <span className="mr-2">Left</span>
            <ArrowRight className="w-4 h-4" />
            <span className="ml-2">Right</span>
          </Button>
          <Button onClick={handleCopyRightToLeft} variant="ghost" size="sm" title="Copy Right to Left">
            <span className="mr-2">Left</span>
            <ArrowLeft className="w-4 h-4" />
            <span className="ml-2">Right</span>
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center ml-2">
            Auto-comparison active. Edit either side.
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 p-4">
        <div className="h-full border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden relative group">
             {/* Small style tweak for widgets */}
             <style>{`
               .monaco-editor .content-widget { z-index: 100; }
             `}</style>
             <DiffEditor
                height="100%"
                language="json"
                original={original}
                modified={modified}
                theme={mode === 'dark' ? 'vs-dark' : 'light'}
                onMount={(editor) => {
                  diffEditorRef.current = editor;
                }}
                options={{
                  originalEditable: true,
                  renderSideBySide: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  padding: { top: 16, bottom: 16 },
                }}
             />
        </div>
      </div>
    </div>
  );
};
