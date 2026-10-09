/**
 * Colour parsing / formatting / conversion helpers.
 * Pure functions, no dependencies. Channels are kept as floats (r/g/b 0–255, a 0–1)
 * so that round-trips through OKLCH sliders don't accumulate rounding error;
 * formatters do the rounding.
 */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface OKLCH {
  l: number; // 0–1
  c: number; // 0–~0.4
  h: number; // 0–360
}

export interface OKLab {
  l: number;
  a: number;
  b: number;
}

export interface HSL {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hwb' | 'oklch' | 'oklab' | 'named';

export interface ParsedColor {
  color: RGBA;
  format: ColorFormat;
}

/* ------------------------------------------------------------------ */
/* Named colours (CSS Color Module Level 4 — 148 names)               */
/* ------------------------------------------------------------------ */

export const NAMED_COLORS: Record<string, string> = {
  aliceblue: 'f0f8ff', antiquewhite: 'faebd7', aqua: '00ffff', aquamarine: '7fffd4', azure: 'f0ffff',
  beige: 'f5f5dc', bisque: 'ffe4c4', black: '000000', blanchedalmond: 'ffebcd', blue: '0000ff',
  blueviolet: '8a2be2', brown: 'a52a2a', burlywood: 'deb887', cadetblue: '5f9ea0', chartreuse: '7fff00',
  chocolate: 'd2691e', coral: 'ff7f50', cornflowerblue: '6495ed', cornsilk: 'fff8dc', crimson: 'dc143c',
  cyan: '00ffff', darkblue: '00008b', darkcyan: '008b8b', darkgoldenrod: 'b8860b', darkgray: 'a9a9a9',
  darkgreen: '006400', darkgrey: 'a9a9a9', darkkhaki: 'bdb76b', darkmagenta: '8b008b', darkolivegreen: '556b2f',
  darkorange: 'ff8c00', darkorchid: '9932cc', darkred: '8b0000', darksalmon: 'e9967a', darkseagreen: '8fbc8f',
  darkslateblue: '483d8b', darkslategray: '2f4f4f', darkslategrey: '2f4f4f', darkturquoise: '00ced1', darkviolet: '9400d3',
  deeppink: 'ff1493', deepskyblue: '00bfff', dimgray: '696969', dimgrey: '696969', dodgerblue: '1e90ff',
  firebrick: 'b22222', floralwhite: 'fffaf0', forestgreen: '228b22', fuchsia: 'ff00ff', gainsboro: 'dcdcdc',
  ghostwhite: 'f8f8ff', gold: 'ffd700', goldenrod: 'daa520', gray: '808080', green: '008000',
  greenyellow: 'adff2f', grey: '808080', honeydew: 'f0fff0', hotpink: 'ff69b4', indianred: 'cd5c5c',
  indigo: '4b0082', ivory: 'fffff0', khaki: 'f0e68c', lavender: 'e6e6fa', lavenderblush: 'fff0f5',
  lawngreen: '7cfc00', lemonchiffon: 'fffacd', lightblue: 'add8e6', lightcoral: 'f08080', lightcyan: 'e0ffff',
  lightgoldenrodyellow: 'fafad2', lightgray: 'd3d3d3', lightgreen: '90ee90', lightgrey: 'd3d3d3', lightpink: 'ffb6c1',
  lightsalmon: 'ffa07a', lightseagreen: '20b2aa', lightskyblue: '87cefa', lightslategray: '778899', lightslategrey: '778899',
  lightsteelblue: 'b0c4de', lightyellow: 'ffffe0', lime: '00ff00', limegreen: '32cd32', linen: 'faf0e6',
  magenta: 'ff00ff', maroon: '800000', mediumaquamarine: '66cdaa', mediumblue: '0000cd', mediumorchid: 'ba55d3',
  mediumpurple: '9370db', mediumseagreen: '3cb371', mediumslateblue: '7b68ee', mediumspringgreen: '00fa9a', mediumturquoise: '48d1cc',
  mediumvioletred: 'c71585', midnightblue: '191970', mintcream: 'f5fffa', mistyrose: 'ffe4e1', moccasin: 'ffe4b5',
  navajowhite: 'ffdead', navy: '000080', oldlace: 'fdf5e6', olive: '808000', olivedrab: '6b8e23',
  orange: 'ffa500', orangered: 'ff4500', orchid: 'da70d6', palegoldenrod: 'eee8aa', palegreen: '98fb98',
  paleturquoise: 'afeeee', palevioletred: 'db7093', papayawhip: 'ffefd5', peachpuff: 'ffdab9', peru: 'cd853f',
  pink: 'ffc0cb', plum: 'dda0dd', powderblue: 'b0e0e6', purple: '800080', rebeccapurple: '663399',
  red: 'ff0000', rosybrown: 'bc8f8f', royalblue: '4169e1', saddlebrown: '8b4513', salmon: 'fa8072',
  sandybrown: 'f4a460', seagreen: '2e8b57', seashell: 'fff5ee', sienna: 'a0522d', silver: 'c0c0c0',
  skyblue: '87ceeb', slateblue: '6a5acd', slategray: '708090', slategrey: '708090', snow: 'fffafa',
  springgreen: '00ff7f', steelblue: '4682b4', tan: 'd2b48c', teal: '008080', thistle: 'd8bfd8',
  tomato: 'ff6347', turquoise: '40e0d0', violet: 'ee82ee', wheat: 'f5deb3', white: 'ffffff',
  whitesmoke: 'f5f5f5', yellow: 'ffff00', yellowgreen: '9acd32',
};

/* ------------------------------------------------------------------ */
/* Small numeric helpers                                              */
/* ------------------------------------------------------------------ */

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const clamp255 = (v: number) => clamp(v, 0, 255);
const clamp01 = (v: number) => clamp(v, 0, 1);
const normHue = (h: number) => ((h % 360) + 360) % 360;

/** Round to `d` decimals and strip trailing zeros. */
export function round(v: number, d = 0): number {
  const p = 10 ** d;
  const r = Math.round(v * p) / p;
  return Object.is(r, -0) ? 0 : r;
}

const fmtAlpha = (a: number) => String(round(a, 3));

/* ------------------------------------------------------------------ */
/* Parsing                                                            */
/* ------------------------------------------------------------------ */

function parseHex(hex: string): RGBA | null {
  const h = hex.replace(/^#/, '');
  if (!/^[0-9a-f]+$/i.test(h)) return null;
  if (h.length === 3 || h.length === 4) {
    const [r, g, b, a] = h.split('').map((c) => parseInt(c + c, 16));
    return { r, g, b, a: h.length === 4 ? a / 255 : 1 };
  }
  if (h.length === 6 || h.length === 8) {
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  return null;
}

const NUM = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg|rad|grad|turn)?$/i;

interface Token {
  value: number;
  unit: string; // '' | '%' | angle unit | 'none'
}

function tokenize(raw: string): Token | null {
  if (raw.toLowerCase() === 'none') return { value: 0, unit: 'none' };
  const m = NUM.exec(raw);
  if (!m) return null;
  return { value: parseFloat(m[1]), unit: (m[2] ?? '').toLowerCase() };
}

function angle(t: Token): number | null {
  switch (t.unit) {
    case '':
    case 'deg':
    case 'none':
      return t.value;
    case 'rad':
      return (t.value * 180) / Math.PI;
    case 'grad':
      return t.value * 0.9;
    case 'turn':
      return t.value * 360;
    default:
      return null;
  }
}

/** Percentage or plain number scaled so that 100% == `scale`. */
const pct = (t: Token, scale: number) => (t.unit === '%' ? (t.value / 100) * scale : t.value);

function alphaOf(t: Token | undefined): number | null {
  if (!t) return 1;
  if (t.unit !== '' && t.unit !== '%' && t.unit !== 'none') return null;
  return clamp01(t.unit === '%' ? t.value / 100 : t.value);
}

function parseFunctional(input: string): ParsedColor | null {
  const m = /^([a-z]+)\(\s*(.*?)\s*\)$/i.exec(input);
  if (!m) return null;
  const fn = m[1].toLowerCase();
  const body = m[2];

  // Separate the alpha component (`/ a` in modern syntax, 4th comma arg in legacy syntax).
  let parts: string[];
  let alphaRaw: string | undefined;
  if (body.includes('/')) {
    const [main, a, ...rest] = body.split('/');
    if (rest.length) return null;
    parts = main.trim().split(/[\s,]+/).filter(Boolean);
    alphaRaw = a.trim();
  } else {
    parts = body.split(/\s*,\s*|\s+/).filter(Boolean);
    if (parts.length === 4) alphaRaw = parts.pop();
  }
  if (parts.length !== 3) return null;
  const toks = parts.map(tokenize);
  if (toks.some((t) => !t)) return null;
  const [t1, t2, t3] = toks as Token[];
  const aTok = alphaRaw !== undefined ? tokenize(alphaRaw) : undefined;
  if (aTok === null) return null;
  const a = alphaOf(aTok);
  if (a === null) return null;

  switch (fn) {
    case 'rgb':
    case 'rgba': {
      if ([t1, t2, t3].some((t) => t.unit !== '' && t.unit !== '%' && t.unit !== 'none')) return null;
      return {
        color: { r: clamp255(pct(t1, 255)), g: clamp255(pct(t2, 255)), b: clamp255(pct(t3, 255)), a },
        format: 'rgb',
      };
    }
    case 'hsl':
    case 'hsla': {
      const h = angle(t1);
      if (h === null) return null;
      const s = clamp(t2.value, 0, 100);
      const l = clamp(t3.value, 0, 100);
      return { color: { ...hslToRgb({ h, s, l }), a }, format: 'hsl' };
    }
    case 'hwb': {
      const h = angle(t1);
      if (h === null) return null;
      return { color: { ...hwbToRgb(h, clamp(t2.value, 0, 100), clamp(t3.value, 0, 100)), a }, format: 'hwb' };
    }
    case 'oklch': {
      const h = angle(t3);
      if (h === null) return null;
      const l = clamp01(pct(t1, 1));
      const c = Math.max(0, pct(t2, 0.4));
      return { color: oklchToRgb({ l, c, h }, a), format: 'oklch' };
    }
    case 'oklab': {
      const l = clamp01(pct(t1, 1));
      const lab = { l, a: pct(t2, 0.4), b: pct(t3, 0.4) };
      return { color: oklchToRgb(oklabToOklch(lab), a), format: 'oklab' };
    }
    default:
      return null;
  }
}

/** Parse any supported CSS colour string. Returns null when invalid. */
export function parseColor(input: string): ParsedColor | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (s.startsWith('#')) {
    const c = parseHex(s);
    return c ? { color: c, format: 'hex' } : null;
  }
  if (s === 'transparent') return { color: { r: 0, g: 0, b: 0, a: 0 }, format: 'named' };
  if (NAMED_COLORS[s]) return { color: parseHex(NAMED_COLORS[s])!, format: 'named' };
  // Bare hex without '#'
  if (/^[0-9a-f]{3,4}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/.test(s)) {
    const c = parseHex(s);
    return c ? { color: c, format: 'hex' } : null;
  }
  return parseFunctional(s);
}

/* ------------------------------------------------------------------ */
/* HSL / HWB / HSV                                                    */
/* ------------------------------------------------------------------ */

export function hslToRgb({ h, s, l }: HSL): Omit<RGBA, 'a'> {
  const sat = s / 100;
  const lig = l / 100;
  const f = (n: number) => {
    const k = (n + normHue(h) / 30) % 12;
    const a = sat * Math.min(lig, 1 - lig);
    return lig - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

export function rgbToHsl({ r, g, b }: RGBA): HSL {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d > 1e-9) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0);
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hwbToRgb(h: number, w: number, bl: number): Omit<RGBA, 'a'> {
  const wf = w / 100;
  const bf = bl / 100;
  if (wf + bf >= 1) {
    const gray = (wf / (wf + bf)) * 255;
    return { r: gray, g: gray, b: gray };
  }
  const base = hslToRgb({ h, s: 100, l: 50 });
  const k = 1 - wf - bf;
  const white = wf * 255;
  return { r: base.r * k + white, g: base.g * k + white, b: base.b * k + white };
}

export function rgbToHwb(c: RGBA): { h: number; w: number; b: number } {
  const { h } = rgbToHsl(c);
  const max = Math.max(c.r, c.g, c.b) / 255;
  const min = Math.min(c.r, c.g, c.b) / 255;
  return { h, w: min * 100, b: (1 - max) * 100 };
}

/* ------------------------------------------------------------------ */
/* OKLab / OKLCH (Björn Ottosson)                                     */
/* ------------------------------------------------------------------ */

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) * 255;

export function rgbToOklab(c: RGBA): OKLab {
  const r = toLinear(c.r);
  const g = toLinear(c.g);
  const b = toLinear(c.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/** OKLab → linear sRGB (may be out of [0,1]). */
function oklabToLinear({ l: L, a, b }: OKLab): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function oklabToOklch({ l, a, b }: OKLab): OKLCH {
  const c = Math.sqrt(a * a + b * b);
  const h = c < 1e-6 ? 0 : normHue((Math.atan2(b, a) * 180) / Math.PI);
  return { l, c, h };
}

export function oklchToOklab({ l, c, h }: OKLCH): OKLab {
  const rad = (h * Math.PI) / 180;
  return { l, a: c * Math.cos(rad), b: c * Math.sin(rad) };
}

export const rgbToOklch = (c: RGBA): OKLCH => oklabToOklch(rgbToOklab(c));

const inGamut = (lin: number[], eps = 1e-5) => lin.every((v) => v >= -eps && v <= 1 + eps);

/** Is the OKLCH colour representable in sRGB without clipping? */
export function isInSrgbGamut(lch: OKLCH): boolean {
  return inGamut(oklabToLinear(oklchToOklab(lch)));
}

const linToRgb = (lin: number[], alpha: number): RGBA => {
  const [r, g, b] = lin.map((v) => clamp255(fromLinear(clamp01(v))));
  return { r, g, b, a: clamp01(alpha) };
};

const deltaEOK = (x: OKLab, y: OKLab) => Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b);

/**
 * OKLCH → sRGB with CSS Color 4 gamut mapping: out-of-gamut colours have their chroma
 * reduced (binary search, lightness & hue kept) until clipping is below a just-noticeable
 * difference, then the result is clipped.
 */
export function oklchToRgb(lch: OKLCH, alpha = 1): RGBA {
  const l = clamp01(lch.l);
  const h = lch.h;
  const c0 = Math.max(0, lch.c);
  const origin = oklchToOklab({ l, c: c0, h });
  const lin = oklabToLinear(origin);
  if (inGamut(lin) || l <= 0 || l >= 1) return linToRgb(lin, alpha);

  const JND = 0.02;
  const EPS = 0.0001;
  const clipOf = (lab: OKLab) => linToRgb(oklabToLinear(lab), alpha);
  let clipped = clipOf(origin);
  if (deltaEOK(rgbToOklab(clipped), origin) < JND) return clipped;

  let min = 0;
  let max = c0;
  let minInGamut = true;
  while (max - min > EPS) {
    const chroma = (min + max) / 2;
    const current = oklchToOklab({ l, c: chroma, h });
    if (minInGamut && inGamut(oklabToLinear(current))) {
      min = chroma;
      continue;
    }
    clipped = clipOf(current);
    const e = deltaEOK(rgbToOklab(clipped), current);
    if (e < JND) {
      if (JND - e < EPS) return clipped;
      minInGamut = false;
      min = chroma;
    } else {
      max = chroma;
    }
  }
  return clipped;
}

/** Max in-gamut chroma for a given lightness/hue (useful for slider ranges). */
export function maxChroma(l: number, h: number): number {
  let lo = 0;
  let hi = 0.4;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (isInSrgbGamut({ l, c: mid, h })) lo = mid;
    else hi = mid;
  }
  return lo;
}

/* ------------------------------------------------------------------ */
/* Formatting                                                         */
/* ------------------------------------------------------------------ */

const hex2 = (v: number) => Math.round(clamp255(v)).toString(16).padStart(2, '0');

/** Rounded integer channels — what the colour actually renders as. */
export function quantize(c: RGBA): RGBA {
  return { r: Math.round(clamp255(c.r)), g: Math.round(clamp255(c.g)), b: Math.round(clamp255(c.b)), a: round(clamp01(c.a), 3) };
}

export function toHex(c: RGBA, forceAlpha = false): string {
  const base = `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
  return c.a < 1 || forceAlpha ? base + hex2(c.a * 255) : base;
}

export function toRgbString(c: RGBA): string {
  const { r, g, b } = quantize(c);
  return c.a < 1 ? `rgba(${r}, ${g}, ${b}, ${fmtAlpha(c.a)})` : `rgb(${r}, ${g}, ${b})`;
}

export function toHslString(c: RGBA): string {
  const { h, s, l } = rgbToHsl(c);
  const body = `${round(h)}, ${round(s)}%, ${round(l)}%`;
  return c.a < 1 ? `hsla(${body}, ${fmtAlpha(c.a)})` : `hsl(${body})`;
}

/** Space-separated HSL triplet, as used by shadcn/Tailwind CSS variables. */
export function toHslTriplet(c: RGBA): string {
  const { h, s, l } = rgbToHsl(c);
  return `${round(h)} ${round(s)}% ${round(l)}%`;
}

const slashAlpha = (a: number) => (a < 1 ? ` / ${fmtAlpha(a)}` : '');

export function toHwbString(c: RGBA): string {
  const { h, w, b } = rgbToHwb(c);
  return `hwb(${round(h)} ${round(w)}% ${round(b)}%${slashAlpha(c.a)})`;
}

export function toOklchString(c: RGBA): string {
  const { l, c: ch, h } = rgbToOklch(c);
  const chroma = round(ch, 3);
  return `oklch(${round(l * 100, 1)}% ${chroma} ${chroma === 0 ? 0 : round(h, 2)}${slashAlpha(c.a)})`;
}

export function toOklab(c: RGBA): string {
  const { l, a, b } = rgbToOklab(c);
  return `oklab(${round(l * 100, 1)}% ${round(a, 3)} ${round(b, 3)}${slashAlpha(c.a)})`;
}

export function toCmyk(c: RGBA): string {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 1 - 1e-9) return 'cmyk(0%, 0%, 0%, 100%)';
  const f = (v: number) => round(((1 - v - k) / (1 - k)) * 100);
  return `cmyk(${f(r)}%, ${f(g)}%, ${f(b)}%, ${round(k * 100)}%)`;
}

/** Find a CSS named colour that exactly matches (ignores alpha < 1). */
export function toNamed(c: RGBA): string | null {
  if (c.a < 1) return c.a === 0 ? 'transparent' : null;
  const hex = toHex(c).slice(1);
  for (const [name, value] of Object.entries(NAMED_COLORS)) if (value === hex) return name;
  return null;
}

export function formatColor(c: RGBA, format: ColorFormat): string {
  switch (format) {
    case 'rgb':
      return toRgbString(c);
    case 'hsl':
      return toHslString(c);
    case 'hwb':
      return toHwbString(c);
    case 'oklch':
      return toOklchString(c);
    case 'oklab':
      return toOklab(c);
    case 'named':
      return toNamed(c) ?? toHex(c);
    default:
      return toHex(c);
  }
}

/** CSS that the browser renders — rgb() keeps float precision and alpha. */
export function toCss(c: RGBA): string {
  return `rgb(${round(c.r, 2)} ${round(c.g, 2)} ${round(c.b, 2)} / ${fmtAlpha(c.a)})`;
}

/* ------------------------------------------------------------------ */
/* WCAG contrast + APCA                                               */
/* ------------------------------------------------------------------ */

/** Composite a translucent colour over an opaque background. */
export function blend(fg: RGBA, bg: RGBA): RGBA {
  const a = fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

export function relativeLuminance(c: RGBA): number {
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
}

/** WCAG 2.x contrast ratio (1–21). A translucent foreground is composited over the background. */
export function contrastRatio(fg: RGBA, bg: RGBA): number {
  const bgOpaque = bg.a < 1 ? blend(bg, { r: 255, g: 255, b: 255, a: 1 }) : bg;
  const fgOpaque = fg.a < 1 ? blend(fg, bgOpaque) : fg;
  const l1 = relativeLuminance(fgOpaque);
  const l2 = relativeLuminance(bgOpaque);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export interface WcagResult {
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
}

export const WCAG_THRESHOLDS = { aaNormal: 4.5, aaLarge: 3, aaaNormal: 7, aaaLarge: 4.5 } as const;

export function wcagLevels(ratio: number): WcagResult {
  // WCAG requires the unrounded ratio to meet the threshold.
  return {
    aaNormal: ratio >= WCAG_THRESHOLDS.aaNormal,
    aaLarge: ratio >= WCAG_THRESHOLDS.aaLarge,
    aaaNormal: ratio >= WCAG_THRESHOLDS.aaaNormal,
    aaaLarge: ratio >= WCAG_THRESHOLDS.aaaLarge,
  };
}

/** APCA-W3 (0.0.98G-4g) lightness contrast Lc, roughly −108…106. Text colour first. */
export function apcaContrast(text: RGBA, bg: RGBA): number {
  const bgOpaque = bg.a < 1 ? blend(bg, { r: 255, g: 255, b: 255, a: 1 }) : bg;
  const txt = text.a < 1 ? blend(text, bgOpaque) : text;
  const y = (c: RGBA) => 0.2126729 * (c.r / 255) ** 2.4 + 0.7151522 * (c.g / 255) ** 2.4 + 0.072175 * (c.b / 255) ** 2.4;
  const soft = (v: number) => (v < 0.022 ? v + (0.022 - v) ** 1.414 : v);
  const tY = soft(y(txt));
  const bY = soft(y(bgOpaque));
  if (Math.abs(bY - tY) < 0.0005) return 0;
  if (bY > tY) {
    const sapc = (bY ** 0.56 - tY ** 0.57) * 1.14;
    return sapc < 0.1 ? 0 : (sapc - 0.027) * 100;
  }
  const sapc = (bY ** 0.65 - tY ** 0.62) * 1.14;
  return sapc > -0.1 ? 0 : (sapc + 0.027) * 100;
}

/**
 * Black or white — whichever reads better on top of `c`. Uses APCA, which matches perceived
 * legibility of mid-tones (e.g. white on indigo) better than the WCAG 2 ratio does.
 */
export function readableTextColor(c: RGBA): '#000000' | '#ffffff' {
  const black = { r: 0, g: 0, b: 0, a: 1 };
  const white = { r: 255, g: 255, b: 255, a: 1 };
  const bg = c.a < 1 ? blend(c, white) : c;
  return Math.abs(apcaContrast(black, bg)) > Math.abs(apcaContrast(white, bg)) ? '#000000' : '#ffffff';
}

/* ------------------------------------------------------------------ */
/* Palettes                                                           */
/* ------------------------------------------------------------------ */

export interface ScaleStep {
  step: number;
  color: RGBA;
}

const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
// Target OKLCH lightness for each step (close to Tailwind v4's palettes).
const SCALE_L = [0.971, 0.936, 0.885, 0.808, 0.704, 0.637, 0.577, 0.505, 0.444, 0.396, 0.258];
// Chroma multipliers — chroma tapers off towards the very light / very dark ends.
const SCALE_C = [0.1, 0.2, 0.4, 0.68, 0.9, 1, 0.98, 0.88, 0.76, 0.64, 0.46];

/**
 * Tints & shades: an 11-step (50–950) scale that walks OKLCH lightness from near-white
 * to near-black, keeping the hue and tapering chroma. Alpha is preserved.
 */
export function tintShadeScale(c: RGBA): ScaleStep[] {
  const { c: chroma, h } = rgbToOklch(c);
  const baseC = Math.max(chroma, 0);
  return SCALE_STEPS.map((step, i) => ({
    step,
    color: oklchToRgb({ l: SCALE_L[i], c: baseC * SCALE_C[i], h }, c.a),
  }));
}

/** Index of the scale step closest in lightness to `c`. */
export function closestScaleIndex(c: RGBA): number {
  const { l } = rgbToOklch(c);
  let best = 0;
  SCALE_L.forEach((v, i) => {
    if (Math.abs(v - l) < Math.abs(SCALE_L[best] - l)) best = i;
  });
  return best;
}

/** Mix two colours in OKLab space. */
export function mixOklab(a: RGBA, b: RGBA, t: number): RGBA {
  const la = rgbToOklab(a);
  const lb = rgbToOklab(b);
  const mix = { l: la.l + (lb.l - la.l) * t, a: la.a + (lb.a - la.a) * t, b: la.b + (lb.b - la.b) * t };
  return oklchToRgb(oklabToOklch(mix), a.a + (b.a - a.a) * t);
}

/** Rotate hue in OKLCH space (perceptually even). */
export function rotateHue(c: RGBA, degrees: number): RGBA {
  const lch = rgbToOklch(c);
  return oklchToRgb({ ...lch, h: normHue(lch.h + degrees) }, c.a);
}

export interface Harmony {
  name: string;
  colors: RGBA[];
}

export function harmonies(c: RGBA): Harmony[] {
  return [
    { name: 'Complementary', colors: [c, rotateHue(c, 180)] },
    { name: 'Analogous', colors: [rotateHue(c, -30), c, rotateHue(c, 30)] },
    { name: 'Triadic', colors: [c, rotateHue(c, 120), rotateHue(c, 240)] },
    { name: 'Split complementary', colors: [c, rotateHue(c, 150), rotateHue(c, 210)] },
  ];
}

export function colorsEqual(a: RGBA, b: RGBA): boolean {
  const qa = quantize(a);
  const qb = quantize(b);
  return qa.r === qb.r && qa.g === qb.g && qa.b === qb.b && qa.a === qb.a;
}
