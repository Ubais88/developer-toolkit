import MonacoEditor, { OnMount } from '@monaco-editor/react';
import { cn } from '../ui/cn';
import { EDITOR_FONT, useMonacoTheme } from './monacoTheme';
import { EditorSkeleton } from './EditorSkeleton';

export type EditorLanguage =
  | 'json' | 'sql' | 'text' | 'plaintext' | 'html' | 'javascript' | 'typescript'
  | 'yaml' | 'markdown' | 'css' | 'xml';

interface EditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  language?: EditorLanguage;
  highlightError?: number;
  placeholder?: string;
  /** Separates Monaco models (undo/redo history) per document */
  path?: string;
  onCursorChange?: (line: number, column: number) => void;
  onMount?: OnMount;
  fontSize?: number;
  lineNumbers?: boolean;
  wordWrap?: boolean;
}

export const Editor = ({
  value,
  onChange,
  readOnly = false,
  className,
  language = 'json',
  highlightError,
  placeholder,
  path,
  onCursorChange,
  onMount,
  fontSize = 13,
  lineNumbers = true,
  wordWrap = true,
}: EditorProps) => {
  const theme = useMonacoTheme();

  const handleMount: OnMount = (editor, monaco) => {
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });
    if (highlightError) editor.revealLineInCenter(highlightError);
    onMount?.(editor, monaco);
  };

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <MonacoEditor
        path={path}
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={(v) => onChange?.(v ?? '')}
        theme={theme}
        onMount={handleMount}
        loading={<EditorSkeleton />}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize,
          fontFamily: EDITOR_FONT,
          fontLigatures: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 14, bottom: 14 },
          lineNumbers: lineNumbers ? 'on' : 'off',
          lineNumbersMinChars: 3,
          renderLineHighlight: 'all',
          wordWrap: wordWrap ? 'on' : 'off',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          roundedSelection: true,
          overviewRulerBorder: false,
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, useShadows: false },
          find: { addExtraSpaceOnTop: false },
        }}
      />
      {placeholder && !value && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-[3.25rem] top-[14px] whitespace-pre-wrap pr-6 font-mono text-13 text-muted-foreground/60"
        >
          {placeholder}
        </div>
      )}
    </div>
  );
};
