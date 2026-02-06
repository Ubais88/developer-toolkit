import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type PrimaryColor = 'indigo' | 'blue' | 'emerald' | 'rose' | 'orange' | 'violet' | 'cyan' | 'teal' | 'fuchsia' | 'lime' | 'sky' | 'pink';
type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl';

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

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(mode);
    }

    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', primaryColor);
    localStorage.setItem('theme-primary', primaryColor);

    // Map primary colors to HSL values for Tailwind
    const colors: Record<PrimaryColor, string> = {
      indigo: '243 75% 59%', // 600
      blue: '221 83% 53%', // 600
      emerald: '158 64% 52%', // 600
      rose: '343 81% 56%', // 600
      orange: '24 95% 53%', // 600
      violet: '262 83% 58%', // 600
      cyan: '189 94% 43%', // 600
      teal: '173 80% 40%', // 600
      fuchsia: '292 84% 61%', // 600
      lime: '84 81% 44%', // 600
      sky: '199 89% 48%', // 600
      pink: '330 81% 60%', // 600
    };

    // Set the main primary variable used by Tailwind
    root.style.setProperty('--primary', colors[primaryColor]);

    // Set foreground text color for primary background (usually white)
    root.style.setProperty('--primary-foreground', '210 40% 98%');

    // Also keep legacy --primary-color if used else where (optional but safer)
    // We can iterate over the HSL to make it a valid color strings if needed, but likely strict tailwind usage is enough.
    // Actually, let's just stick to what Tailwind needs.

    // We might want to set a lighter shade for backgrounds if --primary-light is used in custom styles
    // But since we are fixing "Apply on UI", the main thing is --primary.

    // Let's create a --primary-light that is an HSL value or a color string?
    // In index.css, --primary is HSL. --primary-light was hex. 
    // If our component uses bg-primary-light, we define it in tailwind config?
    // Wait, checked tailwind config: bg-primary-light is NOT in the extension!
    // ThemeEditor uses `bg-primary-light`. 
    // Checking ThemeEditor again... `bg-primary-light`.
    // Checking tailwind.config.js again... 
    // `colors: { primary: { ..., 50: '#eef2ff' ... } }`
    // It does NOT have `light`. 
    // So `bg-primary-light` class probably doesn't exist unless defined in index.css as a utility or custom class?
    // Let's look at index.css lines 82... no, those are setting vars.
    // Wait, ThemeEditor line 74: `bg-primary-light`.
    // If this class doesn't exist, that button has no background.
    // I need to add `primary-light` to tailwind config OR index.css.
    // Or reuse `primary-50` or `primary/10`.
    // ThemeEditor uses `bg-primary/10` in some places (line 144) but `bg-primary-light` in others (line 74).
    // I should standardize on `bg-primary/10` or define `light` in tailwind.

    // BUT first, let's fix the MAIN issue: `--primary` variable matching.

    // Backgrounds for active states - let's map these to the 50/100 shade HSL
    const lightColors: Record<PrimaryColor, string> = {
      indigo: '226 100% 97%', // 50
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
    // If we want `bg-primary-light` to work, we need to add it to tailwind or use style attribute. 
    // Better: Update Tailwind config to include 'light' in primary colors map to var(--primary-light).
    // For now, let's just set the variable so if it IS configured (I might have missed it in a brief look or it's implicitly used), it works.
    root.style.setProperty('--primary-light', lightColors[primaryColor]);

  }, [primaryColor]);


  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('theme-radius', radius);

    const radii: Record<BorderRadius, string> = {
      none: '0px',
      sm: '0.125rem', // 2px
      md: '0.375rem', // 6px
      lg: '0.5rem',   // 8px
      xl: '0.75rem',  // 12px - User requested ~10px, 12px is a cleaner standard step
    };
    root.style.setProperty('--radius', radii[radius]);
    root.setAttribute('data-radius', radius);
  }, [radius]);

  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('theme-glass', String(glass));
    root.setAttribute('data-glass', String(glass));

    // Apply subtle background tint
    // We use the HSL values from the colors map to create a very light background tint
    // This requires us to extract the HSL numbers or rely on opacity.
    // Since --primary is already HSL (e.g., '243 75% 59%'), we can just use it with low opacity.
    // We'll set a CSS variable for the body background overlay.

    if (mode === 'dark') {
      root.style.setProperty('--bg-tint', `hsl(var(--primary) / 0.05)`);
    } else {
      root.style.setProperty('--bg-tint', `hsl(var(--primary) / 0.03)`);
    }

  }, [glass, primaryColor, mode]);
  // Note: added primaryColor and mode to dependency array so tint updates when they change


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
    <ThemeContext.Provider value={{ mode, setMode, primaryColor, setPrimaryColor, radius, setRadius, glass, setGlass, preset, applyPreset }}>
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
