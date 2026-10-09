import { useMonaco } from '@monaco-editor/react';
import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ACCENTS, PALETTES, hslTripletToHex } from '../../theme/tokens';

export const DARK_THEME = 'dtk-dark';
export const LIGHT_THEME = 'dtk-light';

/**
 * Defines the app's Monaco themes from the current palette + accent and applies the right one.
 * Returns the theme name to pass to `<Editor theme=…>` / `<DiffEditor theme=…>`.
 */
export function useMonacoTheme(): string {
  const monaco = useMonaco();
  const { resolvedMode, basePalette, primaryColor } = useTheme();
  const themeName = resolvedMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  useEffect(() => {
    if (!monaco) return;
    const p = PALETTES[basePalette];
    const accent = hslTripletToHex(ACCENTS[primaryColor].hsl);
    const bg = hslTripletToHex(p.surface1);
    const fg = hslTripletToHex(p.foreground);
    const muted = hslTripletToHex(p.mutedForeground);
    const border = hslTripletToHex(p.border);
    const dark = resolvedMode === 'dark';

    monaco.editor.defineTheme(themeName, {
      base: dark ? 'vs-dark' : 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': bg,
        'editor.foreground': dark ? '#d4d4d8' : fg,
        'editorCursor.foreground': accent,
        'editor.lineHighlightBackground': dark ? '#ffffff06' : '#0000000a',
        'editor.lineHighlightBorder': '#00000000',
        'editorLineNumber.foreground': muted + '80',
        'editorLineNumber.activeForeground': muted,
        'editorIndentGuide.background1': border + '80',
        'editorIndentGuide.activeBackground1': border,
        'editor.selectionBackground': accent + '40',
        'editor.inactiveSelectionBackground': accent + '1f',
        'editor.selectionHighlightBackground': accent + '26',
        'editor.wordHighlightBackground': accent + '26',
        'editor.wordHighlightStrongBackground': accent + '33',
        'editor.findMatchBackground': accent + '55',
        'editor.findMatchHighlightBackground': accent + '26',
        'editorWidget.background': hslTripletToHex(p.popover),
        'editorWidget.border': border,
        'editorGutter.background': bg,
        'scrollbarSlider.background': muted + '33',
        'scrollbarSlider.hoverBackground': muted + '55',
        'scrollbarSlider.activeBackground': muted + '77',
        'diffEditor.insertedTextBackground': dark ? '#22c55e26' : '#22c55e2e',
        'diffEditor.removedTextBackground': dark ? '#ef444426' : '#ef44442e',
        'diffEditor.insertedLineBackground': dark ? '#22c55e14' : '#22c55e1a',
        'diffEditor.removedLineBackground': dark ? '#ef444414' : '#ef44441a',
        'diffEditor.border': border,
        'diffEditor.diagonalFill': border + '80',
      },
    });
    monaco.editor.setTheme(themeName);
  }, [monaco, themeName, resolvedMode, basePalette, primaryColor]);

  return themeName;
}

export const EDITOR_FONT = "'JetBrains Mono', 'Fira Code', Consolas, monospace";
