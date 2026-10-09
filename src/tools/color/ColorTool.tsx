import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeftRight,
  Check,
  Contrast,
  Copy,
  History,
  Link2,
  Palette,
  Pipette,
  Shuffle,
  SlidersHorizontal,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, CopyButton, IconButton, Input, ToolHeader, Tooltip, cn } from '../../components/ui';
import { useSessionState } from '../../hooks/useSessionState';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useClipboard } from '../../hooks/useClipboard';
import {
  apcaContrast,
  closestScaleIndex,
  contrastRatio,
  formatColor,
  harmonies,
  maxChroma,
  oklchToRgb,
  parseColor,
  readableTextColor,
  rgbToOklch,
  round,
  tintShadeScale,
  toCmyk,
  toCss,
  toHex,
  toHslString,
  toHslTriplet,
  toHwbString,
  toNamed,
  toOklab,
  toOklchString,
  toRgbString,
  wcagLevels,
  type ColorFormat,
  type OKLCH,
  type RGBA,
} from '../../lib/color';

/* ------------------------------------------------------------------ */
/* Constants & small helpers                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_COLOR = '#6366f1';
const FALLBACK: RGBA = { r: 99, g: 102, b: 241, a: 1 };
const WHITE: RGBA = { r: 255, g: 255, b: 255, a: 1 };
const NEAR_BLACK: RGBA = { r: 10, g: 10, b: 12, a: 1 };
const MAX_HISTORY = 12;
const C_MAX = 0.37;

const FORMAT_LABEL: Record<ColorFormat, string> = {
  hex: 'HEX',
  rgb: 'RGB',
  hsl: 'HSL',
  hwb: 'HWB',
  oklch: 'OKLCH',
  oklab: 'OKLab',
  named: 'Named',
};

const spring = { type: 'spring', stiffness: 450, damping: 34 } as const;

/** Theme-aware transparency checkerboard. */
const CHECKER: CSSProperties = {
  backgroundColor: 'hsl(var(--surface-1))',
  backgroundImage:
    'conic-gradient(hsl(var(--border-strong) / 0.55) 25%, transparent 0 50%, hsl(var(--border-strong) / 0.55) 0 75%, transparent 0)',
  backgroundSize: '12px 12px',
};

const opaque = (c: RGBA): RGBA => ({ ...c, a: 1 });

function gradient(samples: number, fn: (t: number) => RGBA): string {
  const stops = Array.from({ length: samples }, (_, i) => toCss(fn(i / (samples - 1))));
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

function randomColor(): string {
  const l = 0.5 + Math.random() * 0.3;
  const c = 0.08 + Math.random() * 0.14;
  return toHex(oklchToRgb({ l, c, h: Math.random() * 360 }));
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                    */
/* ------------------------------------------------------------------ */

const RANGE_CLASS = cn(
  'h-3 w-full cursor-pointer appearance-none rounded-full outline-none ring-1 ring-inset ring-border',
  'focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1',
  '[&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
  '[&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent',
  '[&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_2px_6px_rgb(0_0_0/0.35)] [&::-webkit-slider-thumb]:transition-transform',
  'active:[&::-webkit-slider-thumb]:scale-110',
  '[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px]',
  '[&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_2px_6px_rgb(0_0_0/0.35)]',
);

interface GradientSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  background: string;
  onChange: (value: number) => void;
  extra?: ReactNode;
}

function GradientSlider({ label, value, min, max, step, display, background, onChange, extra }: GradientSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="label-caps flex items-center gap-1.5">
          {label}
          {extra}
        </span>
        <span className="font-mono text-xs tabular-nums text-foreground">{display}</span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={RANGE_CLASS}
        style={{ background, backgroundSize: '100% 100%, 8px 8px' }}
      />
    </div>
  );
}

/** Colour swatch that opens the native picker (the real input sits invisibly on top). */
function SwatchPicker({
  color,
  onPick,
  label,
  className,
}: {
  color: RGBA;
  onPick: (hex: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <Tooltip content={label}>
      <span
        className={cn(
          'relative inline-flex h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border-strong shadow-sm transition-transform',
          'hover:scale-[1.04] focus-within:ring-2 focus-within:ring-ring/70 focus-within:ring-offset-1 focus-within:ring-offset-background',
          className,
        )}
        style={CHECKER}
      >
        <span className="absolute inset-0" style={{ backgroundColor: toCss(color) }} />
        <input
          type="color"
          aria-label={label}
          value={toHex(opaque(color))}
          onChange={(e) => onPick(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </span>
    </Tooltip>
  );
}

function FormatRow({ label, value }: { label: string; value: string }) {
  const { copy } = useClipboard();
  return (
    <div className="group flex items-center gap-1 rounded-lg pr-1 transition-colors hover:bg-surface-2">
      <button
        type="button"
        onClick={() => copy(value, `Copied ${label}`)}
        aria-label={`Copy ${label} value ${value}`}
        className="focus-ring flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-left"
      >
        <span className="label-caps w-16 shrink-0">{label}</span>
        <motion.span
          key={value}
          initial={{ opacity: 0.45 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="min-w-0 flex-1 truncate font-mono text-13 tabular-nums text-foreground"
        >
          {value}
        </motion.span>
      </button>
      <CopyButton
        value={value}
        message={`Copied ${label}`}
        className="opacity-60 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      />
    </div>
  );
}

function LevelBadge({ pass, label, threshold }: { pass: boolean; label: string; threshold: number }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors',
        pass ? 'border-success/30 bg-success/10' : 'border-destructive/30 bg-destructive/10',
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-foreground">{label}</p>
        <p className="font-mono text-2xs tabular-nums text-muted-foreground">≥ {threshold} : 1</p>
      </div>
      <Badge tone={pass ? 'success' : 'danger'}>
        {pass ? <Check /> : <X />}
        <span className="sr-only sm:not-sr-only">{pass ? 'Pass' : 'Fail'}</span>
      </Badge>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tool                                                               */
/* ------------------------------------------------------------------ */

export function ColorTool() {
  const [input, setInput] = useSessionState('color-input', DEFAULT_COLOR);
  const [history, setHistory] = useLocalStorage<string[]>('color-history', []);
  const [fgInput, setFgInput] = useSessionState<string | null>('color-contrast-fg', null);
  const [bgInput, setBgInput] = useSessionState('color-contrast-bg', '#ffffff');
  // Exact OKLCH slider positions, valid only while `input` is still what the sliders produced
  // (avoids hue/chroma jitter from re-deriving them out of a rounded colour string).
  const [sliderState, setSliderState] = useState<{ lch: OKLCH; input: string } | null>(null);
  const { copy } = useClipboard();

  const parsed = useMemo(() => parseColor(input), [input]);
  const lastValid = useRef<RGBA>(parsed?.color ?? FALLBACK);
  useEffect(() => {
    if (parsed) lastValid.current = parsed.color;
  }, [parsed]);
  const color = parsed?.color ?? lastValid.current;
  const invalid = !parsed && input.trim() !== '';
  const outFormat: ColorFormat = parsed && parsed.format !== 'named' ? parsed.format : 'hex';

  const lch = sliderState && sliderState.input === input ? sliderState.lch : rgbToOklch(color);
  const outOfGamut = lch.c > maxChroma(lch.l, lch.h) + 0.002;

  const hex = toHex(color);
  const css = toCss(color);
  const textOn = readableTextColor(color);
  const name = toNamed(color);

  /* --- updates ---------------------------------------------------- */

  const applyColor = (next: RGBA, nextLch?: OKLCH, format: ColorFormat = outFormat) => {
    const str = formatColor(next, format);
    setInput(str);
    setSliderState(nextLch ? { lch: nextLch, input: str } : null);
  };

  const setLch = (patch: Partial<OKLCH>) => {
    const next = { ...lch, ...patch };
    applyColor(oklchToRgb(next, color.a), next);
  };

  const setAlpha = (a: number) => applyColor({ ...color, a }, lch);

  const pickHex = (value: string) => {
    const picked = parseColor(value);
    if (picked) applyColor({ ...picked.color, a: color.a });
  };

  const selectColor = (c: RGBA) => applyColor(c);

  /* --- history: commit after 800ms idle (or on blur) --------------- */

  const lastCommitted = useRef(hex);
  const commit = (value: string) => {
    if (value === lastCommitted.current) return;
    lastCommitted.current = value;
    setHistory((prev) => [value, ...prev.filter((h) => h !== value)].slice(0, MAX_HISTORY));
  };
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    if (!parsed) return;
    const value = toHex(parsed.color);
    const t = setTimeout(() => commitRef.current(value), 800);
    return () => clearTimeout(t);
  }, [parsed]);

  /* --- derived data ----------------------------------------------- */

  const formats = useMemo(
    () => [
      { label: 'HEX', value: toHex(color) },
      { label: 'RGB', value: toRgbString(color) },
      { label: 'HSL', value: toHslString(color) },
      { label: 'HWB', value: toHwbString(color) },
      { label: 'OKLCH', value: toOklchString(color) },
      { label: 'OKLab', value: toOklab(color) },
      { label: 'CMYK', value: toCmyk(color) },
      { label: 'CSS var', value: `--color: ${toHslTriplet(color)};` },
    ],
    [color],
  );

  const tracks = useMemo(() => {
    const { l, c, h } = lch;
    const checker =
      'conic-gradient(hsl(var(--border-strong) / 0.55) 25%, hsl(var(--surface-1)) 0 50%, hsl(var(--border-strong) / 0.55) 0 75%, hsl(var(--surface-1)) 0)';
    return {
      l: gradient(14, (t) => oklchToRgb({ l: t, c, h })),
      c: gradient(10, (t) => oklchToRgb({ l, c: t * C_MAX, h })),
      h: gradient(19, (t) => oklchToRgb({ l, c: Math.max(c, 0.02), h: t * 360 })),
      a: `linear-gradient(to right, ${toCss({ ...color, a: 0 })}, ${toCss(opaque(color))}), ${checker}`,
    };
  }, [lch, color]);

  const scale = useMemo(() => tintShadeScale(color), [color]);
  const activeStep = useMemo(() => closestScaleIndex(color), [color]);
  const harmonySets = useMemo(() => harmonies(color), [color]);

  /* --- contrast --------------------------------------------------- */

  const fgParsed = fgInput === null ? null : parseColor(fgInput);
  const fg = fgInput === null ? color : (fgParsed?.color ?? color);
  const bgParsed = parseColor(bgInput);
  const bg = bgParsed?.color ?? WHITE;
  const ratio = contrastRatio(fg, bg);
  const levels = wcagLevels(ratio);
  const apca = apcaContrast(fg, bg);
  const onWhite = contrastRatio(color, WHITE);
  const onBlack = contrastRatio(color, NEAR_BLACK);

  const swapContrast = () => {
    const fgStr = fgInput === null ? hex : fgInput;
    setFgInput(bgInput);
    setBgInput(fgStr);
  };

  /* --- render ----------------------------------------------------- */

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <ToolHeader
          icon={<Pipette />}
          title="Color Converter"
          description="Convert between HEX, RGB, HSL, HWB, OKLCH & more — with contrast and palettes"
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => setInput(randomColor())}>
                <Shuffle className="h-3.5 w-3.5" />
                Random
              </Button>
              <CopyButton value={hex} label="Copy HEX" variant="secondary" message={`Copied ${hex}`} />
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* ---------------- Picker ---------------- */}
          <Card className="min-w-0 overflow-hidden">
            <div className="p-4">
              <div className="relative h-40 overflow-hidden rounded-xl border border-border sm:h-44" style={CHECKER}>
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: css, boxShadow: 'inset 0 1px 0 0 rgb(255 255 255 / 0.12)' }}
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4" style={{ color: textOn }}>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{hex}</p>
                    <p className="truncate text-xs opacity-75">
                      {name ? `${name} · ` : ''}
                      {toOklchString(color)}
                    </p>
                  </div>
                  {color.a < 1 && (
                    <span className="shrink-0 rounded-full border border-current px-2 py-0.5 font-mono text-2xs opacity-80">
                      α {round(color.a * 100)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2">
                <SwatchPicker color={color} onPick={pickHex} label="Open color picker" />
                <div className="min-w-0 flex-1">
                  <Input
                    mono
                    value={input}
                    invalid={invalid}
                    onChange={(e) => setInput(e.target.value)}
                    onBlur={() => parsed && commit(toHex(parsed.color))}
                    spellCheck={false}
                    autoComplete="off"
                    aria-label="Color value"
                    placeholder="#6366f1, rgb(), hsl(), oklch(), tomato…"
                    className="pr-20"
                    trailing={
                      <AnimatePresence mode="popLayout" initial={false}>
                        {parsed && (
                          <motion.span
                            key={parsed.format}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={spring}
                            className="mr-1 inline-flex"
                          >
                            <Badge tone="primary">{FORMAT_LABEL[parsed.format]}</Badge>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    }
                  />
                  <AnimatePresence initial={false}>
                    {invalid && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.16 }}
                        className="flex items-center gap-1.5 overflow-hidden pt-1.5 text-xs text-destructive"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        Unrecognised color — try HEX, rgb(), hsl(), hwb(), oklch(), oklab() or a CSS name.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="border-t border-border-subtle p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-13 font-semibold">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  Adjust in OKLCH
                </span>
                <AnimatePresence initial={false}>
                  {outOfGamut && (
                    <motion.span initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={spring}>
                      <Tooltip content="Chroma exceeds sRGB — the color is gamut-mapped">
                        <Badge tone="warning">Out of sRGB gamut</Badge>
                      </Tooltip>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <GradientSlider
                  label="Lightness"
                  value={round(lch.l, 3)}
                  min={0}
                  max={1}
                  step={0.001}
                  display={`${round(lch.l * 100, 1)}%`}
                  background={tracks.l}
                  onChange={(l) => setLch({ l })}
                />
                <GradientSlider
                  label="Chroma"
                  value={round(Math.min(lch.c, C_MAX), 3)}
                  min={0}
                  max={C_MAX}
                  step={0.001}
                  display={round(lch.c, 3).toFixed(3)}
                  background={tracks.c}
                  onChange={(c) => setLch({ c })}
                />
                <GradientSlider
                  label="Hue"
                  value={round(lch.h, 1)}
                  min={0}
                  max={360}
                  step={0.5}
                  display={`${round(lch.h, 1)}°`}
                  background={tracks.h}
                  onChange={(h) => setLch({ h })}
                />
                <GradientSlider
                  label="Alpha"
                  value={round(color.a, 2)}
                  min={0}
                  max={1}
                  step={0.01}
                  display={`${round(color.a * 100)}%`}
                  background={tracks.a}
                  onChange={setAlpha}
                />
              </div>
            </div>

            <div className="border-t border-border-subtle p-4">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="label-caps flex items-center gap-1.5">
                  <History className="h-3 w-3" />
                  Recent
                </span>
                {history.length > 0 && (
                  <IconButton label="Clear recent colors" size="sm" onClick={() => setHistory([])}>
                    <Trash2 />
                  </IconButton>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">Colors you use will show up here.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  <AnimatePresence initial={false}>
                    {history.map((h) => {
                      const c = parseColor(h)?.color;
                      if (!c) return null;
                      const active = h === hex;
                      return (
                        <motion.div
                          key={h}
                          layout
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={spring}
                        >
                          <Tooltip content={h}>
                            <button
                              type="button"
                              aria-label={`Use ${h}`}
                              onClick={() => selectColor(c)}
                              className={cn(
                                'focus-ring relative h-7 w-7 overflow-hidden rounded-md border transition-transform hover:scale-110',
                                active ? 'border-primary ring-2 ring-primary/40' : 'border-border-strong',
                              )}
                              style={CHECKER}
                            >
                              <span className="absolute inset-0" style={{ backgroundColor: toCss(c) }} />
                            </button>
                          </Tooltip>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </Card>

          {/* ---------------- Formats ---------------- */}
          <Card className="flex min-w-0 flex-col">
            <CardHeader
              icon={<Copy />}
              title="Formats"
              description="Click any row to copy"
              actions={name ? <Badge tone="neutral">{name}</Badge> : undefined}
            />
            <div className="flex flex-col gap-0.5 p-2">
              {formats.map((f) => (
                <FormatRow key={f.label} label={f.label} value={f.value} />
              ))}
            </div>
            <div className="mt-auto border-t border-border-subtle p-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'On white', bg: WHITE, ratio: onWhite },
                  { label: 'On near-black', bg: NEAR_BLACK, ratio: onBlack },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      setFgInput(null);
                      setBgInput(toHex(s.bg));
                    }}
                    className="focus-ring group flex items-center gap-3 rounded-lg border border-border p-2 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
                    aria-label={`Check contrast ${s.label.toLowerCase()}`}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-sm font-semibold"
                      style={{ backgroundColor: toCss(s.bg), color: toCss(color) }}
                    >
                      Aa
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-2xs text-muted-foreground">{s.label}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-13 font-semibold tabular-nums">{round(s.ratio, 2).toFixed(2)}</span>
                        <Badge tone={s.ratio >= 4.5 ? 'success' : s.ratio >= 3 ? 'warning' : 'danger'}>
                          {s.ratio >= 7 ? 'AAA' : s.ratio >= 4.5 ? 'AA' : s.ratio >= 3 ? 'AA Large' : 'Fail'}
                        </Badge>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* ---------------- Contrast ---------------- */}
          <Card className="min-w-0">
            <CardHeader
              icon={<Contrast />}
              title="Contrast checker"
              description="WCAG 2.x ratio with APCA reference"
              actions={
                <IconButton label="Swap foreground and background" size="sm" onClick={swapContrast}>
                  <ArrowLeftRight />
                </IconButton>
              }
            />
            <div className="flex flex-col gap-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex h-5 items-center justify-between">
                    <span className="label-caps">Foreground</span>
                    {fgInput === null ? (
                      <Badge tone="primary">
                        <Link2 />
                        Current
                      </Badge>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFgInput(null)}
                        className="focus-ring rounded text-2xs font-medium text-primary hover:underline"
                      >
                        Use current
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <SwatchPicker color={fg} onPick={(v) => setFgInput(v)} label="Pick foreground color" />
                    <Input
                      mono
                      aria-label="Foreground color"
                      value={fgInput ?? hex}
                      invalid={fgInput !== null && !fgParsed}
                      onChange={(e) => setFgInput(e.target.value)}
                      spellCheck={false}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex h-5 items-center">
                    <span className="label-caps">Background</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SwatchPicker color={bg} onPick={setBgInput} label="Pick background color" />
                    <Input
                      mono
                      aria-label="Background color"
                      value={bgInput}
                      invalid={!bgParsed}
                      onChange={(e) => setBgInput(e.target.value)}
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border" style={CHECKER}>
                <div className="p-5" style={{ backgroundColor: toCss(bg), color: toCss(fg) }}>
                  <p className="text-2xl font-semibold tracking-tight">The quick brown fox</p>
                  <p className="mt-1.5 text-sm leading-relaxed">
                    Jumps over the lazy dog. Body text at 14px needs a ratio of at least 4.5 : 1 to meet AA.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="label-caps">Contrast ratio</span>
                  <motion.p
                    key={round(ratio, 2)}
                    initial={{ opacity: 0.5, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring}
                    className={cn(
                      'font-mono text-3xl font-semibold tabular-nums tracking-tight',
                      levels.aaNormal ? 'text-success' : levels.aaLarge ? 'text-warning' : 'text-destructive',
                    )}
                  >
                    {round(ratio, 2).toFixed(2)}
                    <span className="text-lg text-muted-foreground"> : 1</span>
                  </motion.p>
                </div>
                <Tooltip content="APCA lightness contrast (Lc) — WCAG 3 draft">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-xs tabular-nums text-muted-foreground">
                    <Type className="h-3 w-3" />
                    APCA Lc {round(apca, 1)}
                  </span>
                </Tooltip>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <LevelBadge pass={levels.aaNormal} label="AA · Normal" threshold={4.5} />
                <LevelBadge pass={levels.aaLarge} label="AA · Large" threshold={3} />
                <LevelBadge pass={levels.aaaNormal} label="AAA · Normal" threshold={7} />
                <LevelBadge pass={levels.aaaLarge} label="AAA · Large" threshold={4.5} />
              </div>
            </div>
          </Card>

          {/* ---------------- Palette ---------------- */}
          <Card className="min-w-0">
            <CardHeader
              icon={<Palette />}
              title="Palette"
              description="Click to select · Shift-click to copy"
              actions={
                <CopyButton
                  value={() => scale.map((s) => `--color-${s.step}: ${toHex(s.color)};`).join('\n')}
                  message="Copied scale as CSS variables"
                />
              }
            />
            <div className="flex flex-col gap-5 p-4">
              <div>
                <span className="label-caps">Tints & shades</span>
                <div className="mt-2 flex gap-1">
                  {scale.map((s, i) => {
                    const h = toHex(s.color);
                    const active = i === activeStep;
                    return (
                      <div key={s.step} className="group relative flex min-w-0 flex-1 flex-col items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Select ${s.step} ${h}`}
                          onClick={(e) => (e.shiftKey ? copy(h, `Copied ${h}`) : selectColor(s.color))}
                          className={cn(
                            'focus-ring relative h-12 w-full overflow-hidden rounded-md border border-foreground/10 transition-transform duration-150 hover:-translate-y-0.5 sm:h-14',
                            active && 'ring-2 ring-primary ring-offset-2 ring-offset-surface-1',
                          )}
                          style={CHECKER}
                        >
                          <span className="absolute inset-0" style={{ backgroundColor: toCss(s.color) }} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Copy ${h}`}
                          onClick={() => copy(h, `Copied ${h}`)}
                          className="focus-ring absolute right-0.5 top-0.5 hidden h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 sm:flex"
                          style={{ color: readableTextColor(s.color) }}
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <span
                          className={cn(
                            'font-mono text-[10px] tabular-nums',
                            active ? 'font-semibold text-primary' : 'text-muted-foreground',
                          )}
                        >
                          {s.step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="label-caps">Harmonies</span>
                {harmonySets.map((set) => (
                  <div key={set.name} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground sm:w-32">{set.name}</span>
                    <div className="flex min-w-0 flex-1 gap-1.5">
                      {set.colors.map((c, i) => {
                        const h = toHex(c);
                        return (
                          <Tooltip key={i} content={`${h} — shift-click to copy`}>
                            <button
                              type="button"
                              aria-label={`Select ${set.name.toLowerCase()} color ${h}`}
                              onClick={(e) => (e.shiftKey ? copy(h, `Copied ${h}`) : selectColor(c))}
                              className="focus-ring relative flex h-9 min-w-0 flex-1 items-end overflow-hidden rounded-md border border-foreground/10 px-2 pb-1 text-left transition-transform duration-150 hover:-translate-y-0.5"
                              style={CHECKER}
                            >
                              <span className="absolute inset-0" style={{ backgroundColor: toCss(c) }} />
                              <span
                                className="relative hidden truncate font-mono text-[10px] opacity-80 sm:block"
                                style={{ color: readableTextColor(c) }}
                              >
                                {h}
                              </span>
                            </button>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
