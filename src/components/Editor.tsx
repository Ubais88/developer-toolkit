import MonacoEditor, { OnMount, useMonaco } from '@monaco-editor/react';
import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  language?: 'json' | 'sql' | 'text' | 'html' | 'javascript';
  highlightError?: number;
  placeholder?: string;
  highlightLines?: Set<number>;
  zenMode?: boolean;
  path?: string; // Used to separate Monaco Editor models natively (undo/redo, state)
  onCursorChange?: (line: number, column: number) => void;
}

export const Editor = ({
  value,
  onChange,
  readOnly = false,
  className = '',
  language = 'json',
  highlightError,
  path,
  onCursorChange
}: EditorProps) => {
  const { mode, basePalette } = useTheme();
  const monaco = useMonaco();

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  const handleEditorDidMount: OnMount = (editor) => {
    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });
    
    if (highlightError) {
      editor.revealLineInCenter(highlightError);
    }
  };

  // Dynamically define and update Monaco's theme based on mode/palette reactively
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

  return (
    <div className={`h-full w-full overflow-hidden rounded-md ${className}`}>
      <MonacoEditor
        path={path}
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={handleEditorChange}
        theme={mode === 'dark' ? 'premium-dark' : 'light'}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false }, // Maximize space
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          wordWrap: 'on',
          find: {
            addExtraSpaceOnTop: false,
          },
        }}
      />
    </div>
  );
};
