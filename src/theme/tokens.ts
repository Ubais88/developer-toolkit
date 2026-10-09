// Single source of truth for theme colours. Consumed by ThemeContext (CSS variables),
// the Monaco theme, and every accent/preset picker in the UI.

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedMode = 'light' | 'dark';
export type PrimaryColor =
  | 'indigo' | 'blue' | 'emerald' | 'rose' | 'orange' | 'violet'
  | 'cyan' | 'teal' | 'fuchsia' | 'lime' | 'sky' | 'pink';
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type BasePalette = 'slate' | 'charcoal' | 'graphite' | 'oled' | 'light-slate' | 'light-stone' | 'light-warm';
export type ThemePreset = 'classic' | 'modern' | 'professional' | 'vibrant' | 'calm' | 'cyber' | 'nature' | 'candy';

interface AccentToken {
  label: string;
  /** HSL triplet, e.g. `243 75% 59%` */
  hsl: string;
  /** Foreground used on top of the accent (buttons, badges) */
  fg: string;
  /** Very light tint used for `--primary-light` */
  light: string;
}

const WHITE_FG = '0 0% 100%';
const DARK_FG = '240 10% 6%';

export const ACCENTS: Record<PrimaryColor, AccentToken> = {
  indigo:  { label: 'Indigo',  hsl: '243 75% 62%', fg: WHITE_FG, light: '226 100% 97%' },
  violet:  { label: 'Violet',  hsl: '262 83% 64%', fg: WHITE_FG, light: '259 100% 97%' },
  blue:    { label: 'Blue',    hsl: '217 91% 60%', fg: WHITE_FG, light: '214 100% 97%' },
  sky:     { label: 'Sky',     hsl: '199 89% 48%', fg: DARK_FG,  light: '204 100% 97%' },
  cyan:    { label: 'Cyan',    hsl: '189 94% 43%', fg: DARK_FG,  light: '183 100% 96%' },
  teal:    { label: 'Teal',    hsl: '173 80% 40%', fg: WHITE_FG, light: '166 76% 97%' },
  emerald: { label: 'Emerald', hsl: '158 64% 46%', fg: DARK_FG,  light: '166 76% 97%' },
  lime:    { label: 'Lime',    hsl: '84 81% 44%',  fg: DARK_FG,  light: '76 89% 96%' },
  orange:  { label: 'Orange',  hsl: '24 95% 53%',  fg: WHITE_FG, light: '33 100% 96%' },
  rose:    { label: 'Rose',    hsl: '343 81% 58%', fg: WHITE_FG, light: '355 100% 97%' },
  pink:    { label: 'Pink',    hsl: '330 81% 60%', fg: WHITE_FG, light: '327 100% 97%' },
  fuchsia: { label: 'Fuchsia', hsl: '292 84% 61%', fg: WHITE_FG, light: '300 100% 97%' },
};

export const ACCENT_ORDER = Object.keys(ACCENTS) as PrimaryColor[];

export interface PaletteToken {
  label: string;
  mode: ResolvedMode;
  background: string;
  surface1: string;
  surface2: string;
  surface3: string;
  popover: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  mutedForeground: string;
  foreground: string;
}

export const PALETTES: Record<BasePalette, PaletteToken> = {
  charcoal: {
    label: 'Charcoal', mode: 'dark',
    background: '240 5% 6%', surface1: '240 4% 9%', surface2: '240 4% 11.5%', surface3: '240 4% 14.5%',
    popover: '240 4% 10%', border: '240 4% 16%', borderSubtle: '240 4% 12.5%', borderStrong: '240 4% 23%',
    mutedForeground: '240 5% 62%', foreground: '240 5% 96%',
  },
  oled: {
    label: 'OLED', mode: 'dark',
    background: '0 0% 0%', surface1: '0 0% 4%', surface2: '0 0% 6.5%', surface3: '0 0% 9.5%',
    popover: '0 0% 6%', border: '0 0% 13%', borderSubtle: '0 0% 9%', borderStrong: '0 0% 20%',
    mutedForeground: '0 0% 60%', foreground: '0 0% 96%',
  },
  graphite: {
    label: 'Graphite', mode: 'dark',
    background: '240 6% 9%', surface1: '240 5% 12%', surface2: '240 5% 14.5%', surface3: '240 5% 17.5%',
    popover: '240 5% 13%', border: '240 5% 20%', borderSubtle: '240 5% 15.5%', borderStrong: '240 5% 27%',
    mutedForeground: '240 5% 64%', foreground: '240 5% 96%',
  },
  slate: {
    label: 'Slate', mode: 'dark',
    background: '222 16% 8%', surface1: '222 14% 11%', surface2: '222 13% 13.5%', surface3: '222 12% 16.5%',
    popover: '222 14% 12%', border: '222 12% 19%', borderSubtle: '222 13% 14.5%', borderStrong: '222 10% 26%',
    mutedForeground: '220 10% 63%', foreground: '220 15% 96%',
  },
  'light-slate': {
    label: 'Light', mode: 'light',
    background: '0 0% 100%', surface1: '220 20% 98%', surface2: '220 16% 96%', surface3: '220 14% 93%',
    popover: '0 0% 100%', border: '220 13% 90%', borderSubtle: '220 14% 94%', borderStrong: '220 9% 80%',
    mutedForeground: '220 9% 44%', foreground: '224 24% 9%',
  },
  'light-stone': {
    label: 'Stone', mode: 'light',
    background: '60 9% 99%', surface1: '60 5% 97%', surface2: '40 6% 95%', surface3: '30 6% 92%',
    popover: '0 0% 100%', border: '30 6% 89%', borderSubtle: '30 6% 93%', borderStrong: '25 5% 78%',
    mutedForeground: '25 5% 42%', foreground: '24 10% 10%',
  },
  'light-warm': {
    label: 'Warm', mode: 'light',
    background: '300 20% 99.5%', surface1: '300 15% 98%', surface2: '300 12% 96%', surface3: '300 10% 93%',
    popover: '0 0% 100%', border: '300 10% 90%', borderSubtle: '300 10% 94%', borderStrong: '300 6% 80%',
    mutedForeground: '300 6% 44%', foreground: '300 20% 12%',
  },
};

export const RADII: Record<BorderRadius, { label: string; value: string }> = {
  none: { label: 'None', value: '0px' },
  sm: { label: 'Small', value: '0.25rem' },
  md: { label: 'Medium', value: '0.375rem' },
  lg: { label: 'Large', value: '0.5rem' },
  xl: { label: 'Round', value: '0.75rem' },
};

export interface PresetToken {
  label: string;
  description: string;
  mode: ThemeMode;
  primary: PrimaryColor;
  radius: BorderRadius;
  glass: boolean;
}

export const PRESETS: Record<ThemePreset, PresetToken> = {
  modern:       { label: 'Modern',       description: 'Charcoal & violet',   mode: 'dark',  primary: 'violet',  radius: 'lg', glass: true },
  classic:      { label: 'Classic',      description: 'Light & indigo',      mode: 'light', primary: 'indigo',  radius: 'lg', glass: true },
  professional: { label: 'Professional', description: 'Crisp blue',          mode: 'light', primary: 'blue',    radius: 'sm', glass: false },
  vibrant:      { label: 'Vibrant',      description: 'Graphite & orange',   mode: 'dark',  primary: 'orange',  radius: 'md', glass: true },
  calm:         { label: 'Calm',         description: 'Soft emerald',        mode: 'light', primary: 'emerald', radius: 'md', glass: true },
  cyber:        { label: 'Cyber',        description: 'OLED black & cyan',   mode: 'dark',  primary: 'cyan',    radius: 'none', glass: true },
  nature:       { label: 'Nature',       description: 'Stone & lime',        mode: 'light', primary: 'lime',    radius: 'lg', glass: false },
  candy:        { label: 'Candy',        description: 'Warm & pink',         mode: 'light', primary: 'pink',    radius: 'xl', glass: true },
};

export const PRESET_ORDER = Object.keys(PRESETS) as ThemePreset[];

export function resolvePalette(mode: ResolvedMode, preset: ThemePreset | null): BasePalette {
  if (mode === 'light') {
    if (preset === 'nature') return 'light-stone';
    if (preset === 'calm' || preset === 'candy') return 'light-warm';
    return 'light-slate';
  }
  if (preset === 'classic' || preset === 'professional') return 'slate';
  if (preset === 'cyber') return 'oled';
  if (preset === 'vibrant' || preset === 'candy') return 'graphite';
  return 'charcoal';
}

/** Convert an HSL triplet string (`"240 5% 6%"`) to `#rrggbb`. */
export function hslTripletToHex(triplet: string): string {
  const [hRaw, sRaw, lRaw] = triplet.trim().split(/\s+/);
  const h = parseFloat(hRaw);
  const s = parseFloat(sRaw) / 100;
  const l = parseFloat(lRaw) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
