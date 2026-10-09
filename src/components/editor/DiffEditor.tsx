import { DiffEditor as MonacoDiffEditor, DiffOnMount } from '@monaco-editor/react';
import { cn } from '../ui/cn';
import { EDITOR_FONT, useMonacoTheme } from './monacoTheme';
import { EditorSkeleton } from './EditorSkeleton';

interface DiffEditorProps {
  original: string;
  modified: string;
  language?: string;
  sideBySide?: boolean;
  ignoreTrimWhitespace?: boolean;
  wordWrap?: boolean;
  /** Both sides are editable by default */
  readOnly?: boolean;
  className?: string;
  onMount?: DiffOnMount;
}

export const DiffEditor = ({
  original,
  modified,
  language = 'plaintext',
  sideBySide = true,
  ignoreTrimWhitespace = false,
  wordWrap = false,
  readOnly = false,
  className,
  onMount,
}: DiffEditorProps) => {
  const theme = useMonacoTheme();

  return (
    <div className={cn('h-full w-full overflow-hidden', className)}>
      <MonacoDiffEditor
        height="100%"
        language={language}
        original={original}
        modified={modified}
        theme={theme}
        onMount={onMount}
        loading={<EditorSkeleton />}
        options={{
          renderSideBySide: sideBySide,
          originalEditable: !readOnly,
          readOnly,
          ignoreTrimWhitespace,
          wordWrap: wordWrap ? 'on' : 'off',
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: EDITOR_FONT,
          fontLigatures: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderOverviewRuler: false,
          padding: { top: 14, bottom: 14 },
          smoothScrolling: true,
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, useShadows: false },
        }}
      />
    </div>
  );
};
