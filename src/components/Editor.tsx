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
  const { mode, basePalette, primaryColor } = useTheme();
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

      const primaryHexColors = {
        indigo: '#6366f1',
        blue: '#3b82f6',
        emerald: '#10b981',
        rose: '#f43f5e',
        orange: '#f97316',
        violet: '#8b5cf6',
        cyan: '#06b6d4',
        teal: '#0d9488',
        fuchsia: '#d946ef',
        lime: '#84cc16',
        sky: '#0ea5e9',
        pink: '#ec4899',
      };
      const primaryHex = primaryHexColors[primaryColor as keyof typeof primaryHexColors] || '#6366f1';

      monaco.editor.defineTheme('premium-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': currentBg,
          'editor.foreground': '#cbd5e1',
          'editorCursor.foreground': primaryHex,
          'editor.lineHighlightBackground': mode === 'dark' ? '#ffffff06' : '#00000006',
          'editorLineNumber.foreground': '#475569',
          'editor.selectionBackground': primaryHex + '40', // 25% opacity
          'editor.inactiveSelectionBackground': primaryHex + '1a', // 10% opacity
          'editor.selectionHighlightBackground': primaryHex + '26', // 15% opacity
          'editor.wordHighlightBackground': primaryHex + '26',
          'editor.wordHighlightStrongBackground': primaryHex + '33',
          'editor.findMatchBackground': primaryHex + '4d',
          'editor.findMatchHighlightBackground': primaryHex + '26',
        }
      });
      
      monaco.editor.setTheme(mode === 'dark' ? 'premium-dark' : 'light');
    }
  }, [monaco, basePalette, mode, primaryColor]);

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
