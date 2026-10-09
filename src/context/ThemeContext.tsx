import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import {
  ACCENTS,
  PALETTES,
  PRESETS,
  RADII,
  hslTripletToHex,
  resolvePalette,
  type BasePalette,
  type BorderRadius,
  type PrimaryColor,
  type ResolvedMode,
  type ThemeMode,
  type ThemePreset,
} from '../theme/tokens';

export type { BasePalette, BorderRadius, PrimaryColor, ResolvedMode, ThemeMode, ThemePreset };

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** The mode actually applied (system resolved to light/dark). */
  resolvedMode: ResolvedMode;
  primaryColor: PrimaryColor;
  setPrimaryColor: (color: PrimaryColor) => void;
  radius: BorderRadius;
  setRadius: (radius: BorderRadius) => void;
  glass: boolean;
  setGlass: (enabled: boolean) => void;
  preset: ThemePreset | null;
  applyPreset: (preset: ThemePreset) => void;
  basePalette: BasePalette;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(() =>
    readStored<ThemeMode>('theme-mode', ['light', 'dark', 'system'], 'dark'),
  );
  const [primaryColor, setPrimaryColor] = useState<PrimaryColor>(() =>
    readStored<PrimaryColor>('theme-primary', Object.keys(ACCENTS) as PrimaryColor[], 'indigo'),
  );
  const [radius, setRadius] = useState<BorderRadius>(() =>
    readStored<BorderRadius>('theme-radius', Object.keys(RADII) as BorderRadius[], 'lg'),
  );
  const [glass, setGlass] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme-glass');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [preset, setPreset] = useState<ThemePreset | null>(() => {
    try {
      const saved = localStorage.getItem('theme-preset') as ThemePreset | null;
      return saved && saved in PRESETS ? saved : null;
    } catch {
      return null;
    }
  });

  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => setSystemDark(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const resolvedMode: ResolvedMode = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
  const basePalette = resolvePalette(resolvedMode, preset);

  // Persist preferences (same keys as before so existing settings survive)
  useEffect(() => { localStorage.setItem('theme-mode', mode); }, [mode]);
  useEffect(() => { localStorage.setItem('theme-primary', primaryColor); }, [primaryColor]);
  useEffect(() => { localStorage.setItem('theme-radius', radius); }, [radius]);
  useEffect(() => { localStorage.setItem('theme-glass', String(glass)); }, [glass]);

  // Write CSS variables to <html>
  useEffect(() => {
    const root = document.documentElement;
    const p = PALETTES[basePalette];
    const accent = ACCENTS[primaryColor];

    root.classList.remove('light', 'dark');
    root.classList.add(resolvedMode);
    root.style.colorScheme = resolvedMode;
    root.setAttribute('data-theme', primaryColor);
    root.setAttribute('data-radius', radius);
    root.setAttribute('data-glass', String(glass));

    const vars: Record<string, string> = {
      '--background': p.background,
      '--foreground': p.foreground,
      '--surface-1': p.surface1,
      '--surface-2': p.surface2,
      '--surface-3': p.surface3,
      '--card': p.surface1,
      '--card-foreground': p.foreground,
      '--popover': p.popover,
      '--popover-foreground': p.foreground,
      '--border': p.border,
      '--border-subtle': p.borderSubtle,
      '--border-strong': p.borderStrong,
      '--input': p.border,
      '--secondary': p.surface2,
      '--secondary-foreground': p.foreground,
      '--muted': p.surface2,
      '--muted-foreground': p.mutedForeground,
      '--accent': p.surface3,
      '--accent-foreground': p.foreground,
      '--primary': accent.hsl,
      '--primary-foreground': accent.fg,
      '--primary-light': accent.light,
      '--ring': accent.hsl,
      '--radius': RADII[radius].value,
    };
    for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', hslTripletToHex(p.background));
  }, [resolvedMode, basePalette, primaryColor, radius, glass]);

  const applyPreset = useCallback((newPreset: ThemePreset) => {
    const config = PRESETS[newPreset];
    setPreset(newPreset);
    localStorage.setItem('theme-preset', newPreset);
    setMode(config.mode);
    setPrimaryColor(config.primary);
    setRadius(config.radius);
    setGlass(config.glass);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ mode, setMode, resolvedMode, primaryColor, setPrimaryColor, radius, setRadius, glass, setGlass, preset, applyPreset, basePalette }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
