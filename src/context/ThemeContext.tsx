import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type PrimaryColor = 'indigo' | 'blue' | 'emerald' | 'rose' | 'orange' | 'violet';
type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

type ThemePreset = 'classic' | 'modern' | 'professional' | 'vibrant' | 'calm';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  primaryColor: PrimaryColor;
  setPrimaryColor: (color: PrimaryColor) => void;
  radius: BorderRadius;
  setRadius: (radius: BorderRadius) => void;
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
    // Map primary colors to hue values or specific hexes via CSS variables
    // For now, we will use data-attributes to let Tailwind or CSS handle it,
    // or set CSS variables directly.
    root.setAttribute('data-theme', primaryColor);
    localStorage.setItem('theme-primary', primaryColor);
    
    // Set standard CSS variables for the color palette
    // These align with Tailwind's 600 spectrum for main, 50 for bg, etc.
    const colors: Record<PrimaryColor, string> = {
        indigo: '#4f46e5', // 600
        blue: '#2563eb',
        emerald: '#059669',
        rose: '#e11d48',
        orange: '#ea580c',
        violet: '#7c3aed',
    };
    root.style.setProperty('--primary-color', colors[primaryColor]);

    // Backgrounds for active states (usually 50 or 100)
    const lightColors: Record<PrimaryColor, string> = {
        indigo: '#eef2ff', // 50
        blue: '#eff6ff',
        emerald: '#ecfdf5',
        rose: '#fff1f2',
        orange: '#fff7ed',
        violet: '#f5f3ff',
    };
    root.style.setProperty('--primary-light', lightColors[primaryColor]);

  }, [primaryColor]);

  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('theme-radius', radius);
    
    const radii: Record<BorderRadius, string> = {
        none: '0px',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        full: '9999px',
    };
    root.style.setProperty('--radius', radii[radius]);

    // Also update a data attribute for easier Tailwind selection if needed
    root.setAttribute('data-radius', radius);
  }, [radius]);

  const applyPreset = (newPreset: ThemePreset) => {
    setPreset(newPreset);
    localStorage.setItem('theme-preset', newPreset);

    switch (newPreset) {
      case 'classic':
        setMode('light');
        setPrimaryColor('indigo');
        setRadius('lg');
        break;
      case 'modern':
        setMode('dark');
        setPrimaryColor('violet');
        setRadius('full');
        break;
      case 'professional':
        setMode('light');
        setPrimaryColor('blue');
        setRadius('sm');
        break;
      case 'vibrant':
        setMode('dark');
        setPrimaryColor('orange');
        setRadius('md');
        break;
      case 'calm':
        setMode('light');
        setPrimaryColor('emerald');
        setRadius('md');
        break;
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, primaryColor, setPrimaryColor, radius, setRadius, preset, applyPreset }}>
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
