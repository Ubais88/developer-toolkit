import MonacoEditor, { OnMount } from '@monaco-editor/react';
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
}

export const Editor = ({
  value,
  onChange,
  readOnly = false,
  className = '',
  language = 'json',
  highlightError,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  placeholder,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  highlightLines
}: EditorProps) => {
  const { mode } = useTheme();

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Add custom keybinding or actions if needed
    // Example: Trigger format on load? No, let's keep it simple.
    
    if (highlightError) {
      // Logic to scroll to error could go here, but Monaco handles errors via markers usually.
      // We can manually reveal the line.
      editor.revealLineInCenter(highlightError);
    }
  };

  return (
    <div className={`h-full w-full overflow-hidden rounded-md border border-gray-200 bg-white dark:bg-slate-900 ${className}`}>
      <MonacoEditor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={handleEditorChange}
        theme={mode === 'dark' ? 'vs-dark' : 'light'}
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
        }}
      />
    </div>
  );
};
