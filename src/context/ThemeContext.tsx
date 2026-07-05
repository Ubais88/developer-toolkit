import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type PrimaryColor = 'indigo' | 'blue' | 'emerald' | 'rose' | 'orange' | 'violet' | 'cyan' | 'teal' | 'fuchsia' | 'lime' | 'sky' | 'pink';
type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl';
type BasePalette = 'slate' | 'charcoal' | 'graphite' | 'oled' | 'light-slate' | 'light-stone' | 'light-warm';

type ThemePreset = 'classic' | 'modern' | 'professional' | 'vibrant' | 'calm' | 'cyber' | 'nature' | 'candy';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
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

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('theme-mode') as ThemeMode) || 'light';
  });

  const [primaryColor, setPrimaryColor] = useState<PrimaryColor>(() => {
    return (localStorage.getItem('theme-primary') as PrimaryColor) || 'indigo';
  });

  const [radius, setRadius] = useState<BorderRadius>(() => {
    return (localStorage.getItem('theme-radius') as BorderRadius) || 'lg';
  });

  const [glass, setGlass] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme-glass');
    return saved !== null ? saved === 'true' : true;
  });

  const [preset, setPreset] = useState<ThemePreset | null>(() => {
    return (localStorage.getItem('theme-preset') as ThemePreset) || null;
  });

  // Calculate resolved mode (light/dark) dynamically
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateResolvedMode = () => {
      if (mode === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedMode(isDark ? 'dark' : 'light');
      } else {
        setResolvedMode(mode);
      }
    };

    updateResolvedMode();

    if (mode === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateResolvedMode();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [mode]);

  // Determine base palette based on active preset and resolved mode
  let basePalette: BasePalette = 'charcoal'; // Default premium neutral dark
  if (resolvedMode === 'light') {
    if (preset === 'nature') basePalette = 'light-stone';
    else if (preset === 'calm' || preset === 'candy') basePalette = 'light-warm';
    else basePalette = 'light-slate';
  } else {
    // dark mode base themes
    if (preset === 'classic' || preset === 'professional') basePalette = 'slate';
    else if (preset === 'cyber') basePalette = 'oled';
    else if (preset === 'vibrant' || preset === 'candy') basePalette = 'graphite';
    else basePalette = 'charcoal'; // default dark (modern, calm, nature)
  }

  // Update storage & document states on change
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('theme-primary', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    localStorage.setItem('theme-radius', radius);
  }, [radius]);

  useEffect(() => {
    localStorage.setItem('theme-glass', String(glass));
  }, [glass]);

  // Unified theme variable updater
  useEffect(() => {
    const root = window.document.documentElement;

    // Apply dark/light class for Tailwind
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedMode);
    root.setAttribute('data-theme', primaryColor);

    // Color definitions for each BasePalette (all dark options are neutral/non-blue)
    const palettes: Record<BasePalette, {
      background: string;
      card: string;
      popover: string;
      border: string;
      input: string;
      secondary: string;
      muted: string;
      mutedForeground: string;
      accent: string;
      accentForeground: string;
      foreground: string;
    }> = {
      'oled': {
        background: '0 0% 0%', // #000000
        card: '0 0% 3%', // #080808
        popover: '0 0% 4%',
        border: '0 0% 12%', // #1f1f1f
        input: '0 0% 12%',
        secondary: '0 0% 7%',
        muted: '0 0% 7%',
        mutedForeground: '0 0% 63%',
        accent: '0 0% 14%',
        accentForeground: '0 0% 98%',
        foreground: '0 0% 98%'
      },
      'charcoal': {
        background: '0 0% 8%', // #141414
        card: '0 0% 13%', // #212121
        popover: '0 0% 13%',
        border: '0 0% 18%', // #2e2e2e
        input: '0 0% 18%',
        secondary: '0 0% 15%',
        muted: '0 0% 15%',
        mutedForeground: '0 0% 63%',
        accent: '0 0% 20%',
        accentForeground: '0 0% 98%',
        foreground: '0 0% 98%'
      },
      'graphite': {
        background: '240 6% 10%', // #18181b
        card: '240 5% 15%', // #27272a
        popover: '240 5% 15%',
        border: '240 5% 22%', // #3f3f46
        input: '240 5% 22%',
        secondary: '240 4% 18%',
        muted: '240 4% 18%',
        mutedForeground: '240 5% 63%',
        accent: '240 4% 24%',
        accentForeground: '240 5% 98%',
        foreground: '240 5% 98%'
      },
      'slate': {
        background: '220 13% 10%', // #181a1f
        card: '220 13% 15%', // #21252b
        popover: '220 13% 15%',
        border: '220 13% 22%', // #2d3139
        input: '220 13% 22%',
        secondary: '220 13% 18%',
        muted: '220 13% 18%',
        mutedForeground: '220 10% 63%',
        accent: '220 13% 24%',
        accentForeground: '220 10% 98%',
        foreground: '220 10% 98%'
      },
      'light-slate': {
        background: '210 40% 98%',
        card: '0 0% 100%',
        popover: '0 0% 100%',
        border: '214.3 31.8% 91.4%',
        input: '214.3 31.8% 91.4%',
        secondary: '210 40% 96.1%',
        muted: '210 40% 96.1%',
        mutedForeground: '215.4 16.3% 46.9%',
        accent: '210 40% 96.1%',
        accentForeground: '222.2 47.4% 11.2%',
        foreground: '222.2 84% 4.9%'
      },
      'light-stone': {
        background: '60 9% 98%',
        card: '0 0% 100%',
        popover: '0 0% 100%',
        border: '20 6% 90%',
        input: '20 6% 90%',
        secondary: '60 9% 95%',
        muted: '60 9% 95%',
        mutedForeground: '25 5% 45%',
        accent: '60 9% 95%',
        accentForeground: '24 10% 10%',
        foreground: '24 10% 10%'
      },
      'light-warm': {
        background: '300 20% 99%',
        card: '0 0% 100%',
        popover: '0 0% 100%',
        border: '300 10% 93%',
        input: '300 10% 93%',
        secondary: '300 20% 97%',
        muted: '300 20% 97%',
        mutedForeground: '300 10% 50%',
        accent: '300 20% 97%',
        accentForeground: '300 20% 15%',
        foreground: '300 20% 15%'
      }
    };

    const currentPalette = palettes[basePalette];

    // Set variable updates on documentElement
    root.style.setProperty('--background', currentPalette.background);
    root.style.setProperty('--card', currentPalette.card);
    root.style.setProperty('--card-foreground', currentPalette.foreground);
    root.style.setProperty('--popover', currentPalette.popover);
    root.style.setProperty('--popover-foreground', currentPalette.foreground);
    root.style.setProperty('--border', currentPalette.border);
    root.style.setProperty('--input', currentPalette.input);
    root.style.setProperty('--secondary', currentPalette.secondary);
    root.style.setProperty('--secondary-foreground', currentPalette.accentForeground);
    root.style.setProperty('--muted', currentPalette.muted);
    root.style.setProperty('--muted-foreground', currentPalette.mutedForeground);
    root.style.setProperty('--accent', currentPalette.accent);
    root.style.setProperty('--accent-foreground', currentPalette.accentForeground);
    root.style.setProperty('--foreground', currentPalette.foreground);

    // Primary Colors HSL map
    const colors: Record<PrimaryColor, string> = {
      indigo: '243 75% 59%',
      blue: '221 83% 53%',
      emerald: '158 64% 52%',
      rose: '343 81% 56%',
      orange: '24 95% 53%',
      violet: '262 83% 58%',
      cyan: '189 94% 43%',
      teal: '173 80% 40%',
      fuchsia: '292 84% 61%',
      lime: '84 81% 44%',
      sky: '199 89% 48%',
      pink: '330 81% 60%',
    };

    root.style.setProperty('--primary', colors[primaryColor]);
    root.style.setProperty('--primary-foreground', '210 40% 98%');

    // Radii
    const radii: Record<BorderRadius, string> = {
      none: '0px',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
    };
    root.style.setProperty('--radius', radii[radius]);
    root.setAttribute('data-radius', radius);
    root.setAttribute('data-glass', String(glass));

    // LightColors mapping for primary-light background
    const lightColors: Record<PrimaryColor, string> = {
      indigo: '226 100% 97%',
      blue: '214 100% 97%',
      emerald: '166 76% 97%',
      rose: '355 100% 97%',
      orange: '33 100% 96%',
      violet: '259 100% 97%',
      cyan: '183 100% 96%',
      teal: '166 76% 97%',
      fuchsia: '300 100% 97%',
      lime: '76 89% 96%',
      sky: '204 100% 97%',
      pink: '327 100% 97%',
    };
    root.style.setProperty('--primary-light', lightColors[primaryColor]);

    // Apply subtle tint overlay on background (no blue tint in dark mode)
    if (resolvedMode === 'dark') {
      root.style.setProperty('--bg-tint', `hsl(0 0% 100% / 0.01)`);
    } else {
      root.style.setProperty('--bg-tint', `hsl(0 0% 0% / 0.003)`);
    }

  }, [resolvedMode, basePalette, primaryColor, radius, glass]);

  const applyPreset = (newPreset: ThemePreset) => {
    setPreset(newPreset);
    localStorage.setItem('theme-preset', newPreset);

    switch (newPreset) {
      case 'classic':
        setMode('light'); setPrimaryColor('indigo'); setRadius('lg'); setGlass(true); break;
      case 'modern':
        setMode('dark'); setPrimaryColor('violet'); setRadius('xl'); setGlass(true); break;
      case 'professional':
        setMode('light'); setPrimaryColor('blue'); setRadius('sm'); setGlass(false); break;
      case 'vibrant':
        setMode('dark'); setPrimaryColor('orange'); setRadius('md'); setGlass(true); break;
      case 'calm':
        setMode('light'); setPrimaryColor('emerald'); setRadius('md'); setGlass(true); break;
      case 'cyber':
        setMode('dark'); setPrimaryColor('cyan'); setRadius('none'); setGlass(true); break;
      case 'nature':
        setMode('light'); setPrimaryColor('lime'); setRadius('lg'); setGlass(false); break;
      case 'candy':
        setMode('light'); setPrimaryColor('pink'); setRadius('xl'); setGlass(true); break;
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, primaryColor, setPrimaryColor, radius, setRadius, glass, setGlass, preset, applyPreset, basePalette }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
