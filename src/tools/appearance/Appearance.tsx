import { motion } from 'framer-motion';
import { Check, Layers, Monitor, Moon, Palette, RotateCcw, Search, Sparkles, Sun } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Input,
  Kbd,
  SegmentedControl,
  ToggleChip,
  ToolHeader,
  cn,
} from '../../components/ui';
import { useTheme, type BorderRadius, type ThemeMode } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { ACCENTS, ACCENT_ORDER, PALETTES, PRESETS, PRESET_ORDER, RADII, resolvePalette } from '../../theme/tokens';

const RADIUS_ORDER = Object.keys(RADII) as BorderRadius[];

export const Appearance = () => {
  const toast = useToast();
  const { mode, setMode, primaryColor, setPrimaryColor, radius, setRadius, glass, setGlass, preset, applyPreset } = useTheme();

  const reset = () => {
    setMode('dark');
    setPrimaryColor('indigo');
    setRadius('lg');
    setGlass(true);
    toast.success('Appearance reset to defaults');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-6">
        <ToolHeader
          icon={<Palette />}
          title="Appearance"
          description="Make the toolkit yours — changes apply instantly and are saved in this browser"
          actions={
            <Button size="sm" variant="secondary" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          }
        />

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            {/* Presets */}
            <Card>
              <CardHeader icon={<Sparkles />} title="Presets" description="A starting point you can tweak below" />
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                {PRESET_ORDER.map((id) => {
                  const p = PRESETS[id];
                  const resolved = p.mode === 'system' ? 'dark' : p.mode;
                  const pal = PALETTES[resolvePalette(resolved, id)];
                  const accent = `hsl(${ACCENTS[p.primary].hsl})`;
                  const active = preset === id;
                  return (
                    <motion.button
                      key={id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => applyPreset(id)}
                      className={cn(
                        'focus-ring group relative overflow-hidden rounded-lg border p-2 text-left transition-colors',
                        active ? 'border-primary/60 shadow-glow-sm' : 'border-border hover:border-border-strong',
                      )}
                    >
                      {/* Mini window preview */}
                      <div
                        className="relative h-16 overflow-hidden rounded-md border"
                        style={{ background: `hsl(${pal.background})`, borderColor: `hsl(${pal.border})` }}
                      >
                        <div className="absolute inset-y-0 left-0 w-1/4 border-r" style={{ background: `hsl(${pal.surface1})`, borderColor: `hsl(${pal.border})` }} />
                        <div className="absolute left-[32%] top-2.5 h-1.5 w-1/3 rounded-full" style={{ background: `hsl(${pal.foreground} / 0.7)` }} />
                        <div className="absolute left-[32%] top-6 h-1.5 w-1/2 rounded-full" style={{ background: `hsl(${pal.mutedForeground} / 0.5)` }} />
                        <div className="absolute bottom-2 left-[32%] h-3 w-8 rounded-sm" style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between px-0.5">
                        <div>
                          <div className="text-13 font-medium text-foreground">{p.label}</div>
                          <div className="text-2xs text-muted-foreground">{p.description}</div>
                        </div>
                        {active && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </Card>

            {/* Mode */}
            <Card>
              <CardHeader icon={<Moon />} title="Theme" description="Follow your OS or pick one" />
              <div className="p-4">
                <SegmentedControl<ThemeMode>
                  aria-label="Theme mode"
                  size="md"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: 'light', label: 'Light', icon: <Sun /> },
                    { value: 'dark', label: 'Dark', icon: <Moon /> },
                    { value: 'system', label: 'System', icon: <Monitor /> },
                  ]}
                />
              </div>
            </Card>

            {/* Accent */}
            <Card>
              <CardHeader icon={<Palette />} title="Accent colour" description={ACCENTS[primaryColor].label} />
              <div className="flex flex-wrap gap-3 p-4">
                {ACCENT_ORDER.map((c) => {
                  const active = primaryColor === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setPrimaryColor(c)}
                      aria-label={ACCENTS[c].label}
                      aria-pressed={active}
                      title={ACCENTS[c].label}
                      className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
                    >
                      {active && (
                        <motion.span
                          layoutId="accent-ring"
                          className="absolute -inset-1 rounded-full border-2"
                          style={{ borderColor: `hsl(${ACCENTS[c].hsl})` }}
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span
                        className="h-7 w-7 rounded-full shadow-inner"
                        style={{ background: `linear-gradient(135deg, hsl(${ACCENTS[c].hsl}), hsl(${ACCENTS[c].hsl} / 0.7))` }}
                      />
                      {active && <Check className="absolute h-3.5 w-3.5" style={{ color: `hsl(${ACCENTS[c].fg})` }} />}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Radius + chrome */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader title="Corner radius" description={RADII[radius].label} />
                <div className="grid grid-cols-5 gap-2 p-4">
                  {RADIUS_ORDER.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      aria-pressed={radius === r}
                      title={RADII[r].label}
                      className={cn(
                        'focus-ring flex aspect-square items-end justify-start rounded-md border p-2 transition-colors',
                        radius === r ? 'border-primary/60 bg-primary/10' : 'border-border hover:border-border-strong',
                      )}
                    >
                      <span
                        className={cn('h-5 w-5 border-l-2 border-t-2', radius === r ? 'border-primary' : 'border-muted-foreground')}
                        style={{ borderTopLeftRadius: `calc(${RADII[r].value} * 1.5)` }}
                      />
                    </button>
                  ))}
                </div>
              </Card>
              <Card>
                <CardHeader icon={<Layers />} title="Translucent chrome" description="Blur behind the sidebar, top bar and dialogs" />
                <div className="p-4">
                  <ToggleChip checked={glass} onChange={setGlass}>
                    {glass ? 'Enabled' : 'Disabled'}
                  </ToggleChip>
                </div>
              </Card>
            </div>
          </div>

          {/* Live preview */}
          <div className="lg:sticky lg:top-6">
            <div className="label-caps mb-2 px-1">Live preview</div>
            <Card className="overflow-hidden">
              <div className="bg-aurora border-b border-border-subtle p-5">
                <Badge tone="primary" className="mb-3">
                  <Sparkles />
                  New
                </Badge>
                <h3 className="text-base font-semibold">Ship faster, fiddle less</h3>
                <p className="mt-1 text-13 text-muted-foreground">Every tool in one keyboard-first workspace.</p>
              </div>
              <div className="space-y-4 p-5">
                <Input leading={<Search />} placeholder="Search tools…" trailing={<Kbd combo="mod+k" size="sm" />} readOnly />
                <div className="flex flex-wrap gap-2">
                  <ToggleChip checked onChange={() => undefined}>
                    Enabled
                  </ToggleChip>
                  <ToggleChip checked={false} onChange={() => undefined}>
                    Disabled
                  </ToggleChip>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success">Valid</Badge>
                  <Badge tone="warning">Expires soon</Badge>
                  <Badge tone="danger">Invalid</Badge>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm">Primary</Button>
                  <Button size="sm" variant="secondary">
                    Secondary
                  </Button>
                  <Button size="sm" variant="ghost">
                    Ghost
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
