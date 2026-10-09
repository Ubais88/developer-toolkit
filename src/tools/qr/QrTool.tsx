import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  ClipboardCopy,
  Contact,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  Link,
  Mail,
  ScanLine,
  Phone,
  QrCode,
  RotateCcw,
  Settings2,
  Sparkles,
  Type,
  Wifi,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CopyButton,
  EmptyState,
  Field,
  IconButton,
  Input,
  SegmentedControl,
  Select,
  Tabs,
  Textarea,
  ToggleChip,
  ToolHeader,
  Tooltip,
  cn,
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { useSessionState } from '../../hooks/useSessionState';
import { contrastRatio, oklchToRgb, parseColor, relativeLuminance, rgbToOklch, toHex } from '../../lib/color';

/* ------------------------------------------------------------------ */
/* Types & payload builders                                           */
/* ------------------------------------------------------------------ */

type ContentType = 'text' | 'url' | 'wifi' | 'email' | 'phone' | 'vcard';
type Ecl = 'L' | 'M' | 'Q' | 'H';
type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

interface WifiData {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
}
interface EmailData {
  to: string;
  subject: string;
  body: string;
}
interface VCardData {
  name: string;
  phone: string;
  email: string;
  org: string;
}

const TYPE_ITEMS: { value: ContentType; label: string; icon: ReactNode }[] = [
  { value: 'text', label: 'Text', icon: <Type /> },
  { value: 'url', label: 'URL', icon: <Link /> },
  { value: 'wifi', label: 'Wi-Fi', icon: <Wifi /> },
  { value: 'email', label: 'Email', icon: <Mail /> },
  { value: 'phone', label: 'Phone', icon: <Phone /> },
  { value: 'vcard', label: 'vCard', icon: <Contact /> },
];

const ECL_OPTIONS: { value: Ecl; label: string; title: string }[] = [
  { value: 'L', label: 'L', title: 'Low — ~7% recovery' },
  { value: 'M', label: 'M', title: 'Medium — ~15% recovery' },
  { value: 'Q', label: 'Q', title: 'Quartile — ~25% recovery' },
  { value: 'H', label: 'H', title: 'High — ~30% recovery' },
];

const ECL_RECOVERY: Record<Ecl, string> = { L: '7%', M: '15%', Q: '25%', H: '30%' };

const ENCRYPTION_OPTIONS = [
  { value: 'WPA', label: 'WPA / WPA2 / WPA3' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: 'None (open)' },
];

/** Escape `\ ; , : "` for the Wi-Fi QR format. */
const wifiEscape = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');
/** Escape vCard text values. */
const vcardEscape = (s: string) => s.replace(/([\\;,])/g, '\\$1').replace(/\r?\n/g, '\\n');

function buildWifi({ ssid, password, encryption, hidden }: WifiData): string {
  if (!ssid) return '';
  let out = `WIFI:T:${encryption};S:${wifiEscape(ssid)};`;
  if (encryption !== 'nopass') out += `P:${wifiEscape(password)};`;
  if (hidden) out += 'H:true;';
  return `${out};`;
}

function buildEmail({ to, subject, body }: EmailData): string {
  if (!to && !subject && !body) return '';
  const params = [
    subject && `subject=${encodeURIComponent(subject)}`,
    body && `body=${encodeURIComponent(body)}`,
  ].filter(Boolean);
  return `mailto:${to.trim()}${params.length ? `?${params.join('&')}` : ''}`;
}

function buildVCard({ name, phone, email, org }: VCardData): string {
  if (!name && !phone && !email && !org) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const last = parts.length > 1 ? parts[parts.length - 1] : (parts[0] ?? '');
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${vcardEscape(last)};${vcardEscape(first)};;;`, `FN:${vcardEscape(name.trim())}`];
  if (org) lines.push(`ORG:${vcardEscape(org)}`);
  if (phone) lines.push(`TEL;TYPE=CELL:${phone.trim()}`);
  if (email) lines.push(`EMAIL:${email.trim()}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

function normalizeUrl(url: string): string {
  const u = url.trim();
  if (!u) return '';
  return /^[a-z][a-z\d+.-]*:/i.test(u) ? u : `https://${u}`;
}

/* ------------------------------------------------------------------ */
/* Colour helpers                                                     */
/* ------------------------------------------------------------------ */

const BLACK = '#000000';
const WHITE = '#ffffff';

/** Current accent colour, darkened in OKLCH until it has ≥ 4.5:1 contrast on white. */
function readAccentHex(): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  const parsed = raw ? parseColor(`hsl(${raw})`) : null;
  if (!parsed) return BLACK;
  const lch = rgbToOklch(parsed.color);
  const white = { r: 255, g: 255, b: 255, a: 1 };
  let c = oklchToRgb(lch);
  while (contrastRatio(c, white) < 4.5 && lch.l > 0.05) {
    lch.l -= 0.02;
    c = oklchToRgb(lch);
  }
  return toHex(c);
}

const resolveHex = (value: string, fallback: string) => {
  const p = parseColor(value);
  return p ? toHex({ ...p.color, a: 1 }) : fallback;
};

const CHECKER: CSSProperties = {
  backgroundColor: 'hsl(var(--surface-1))',
  backgroundImage:
    'conic-gradient(hsl(var(--border-strong) / 0.55) 25%, transparent 0 50%, hsl(var(--border-strong) / 0.55) 0 75%, transparent 0)',
  backgroundSize: '14px 14px',
};

const spring = { type: 'spring', stiffness: 450, damping: 34 } as const;

/* ------------------------------------------------------------------ */
/* Small components                                                   */
/* ------------------------------------------------------------------ */

const RANGE_CLASS = cn(
  'h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none',
  'focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1',
  '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background',
  '[&::-webkit-slider-thumb]:shadow-glow-sm [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-110',
  '[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2',
  '[&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background',
);

function RangeField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="label-caps">{label}</span>
        <span className="font-mono text-xs tabular-nums text-foreground">
          {value}
          {unit && <span className="text-muted-foreground">{unit}</span>}
        </span>
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
        style={{
          background: `linear-gradient(to right, hsl(var(--primary)) ${pct}%, hsl(var(--surface-3)) ${pct}%)`,
        }}
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  resolved,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  resolved: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const invalid = !parseColor(value);
  return (
    <div className={cn('flex flex-col gap-1.5 transition-opacity', disabled && 'pointer-events-none opacity-50')}>
      <span className="label-caps">{label}</span>
      <div className="flex items-center gap-2">
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border-strong shadow-sm transition-transform hover:scale-[1.04] focus-within:ring-2 focus-within:ring-ring/70 focus-within:ring-offset-1 focus-within:ring-offset-background">
          <span className="absolute inset-0" style={{ backgroundColor: resolved }} />
          <input
            type="color"
            aria-label={`Pick ${label.toLowerCase()} color`}
            value={resolved}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
        <Input
          mono
          aria-label={`${label} color`}
          value={value}
          invalid={invalid}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tool                                                               */
/* ------------------------------------------------------------------ */

interface QrResult {
  dataUrl: string;
  version: number;
  modules: number;
}

export function QrTool() {
  const toast = useToast();
  const { primaryColor } = useTheme();

  const [type, setType] = useSessionState<ContentType>('qr-type', 'url');
  const [text, setText] = useSessionState('qr-text', 'Hello from the developer toolkit 👋');
  const [url, setUrl] = useSessionState('qr-url', 'https://github.com');
  const [wifi, setWifi] = useSessionState<WifiData>('qr-wifi', { ssid: '', password: '', encryption: 'WPA', hidden: false });
  const [email, setEmail] = useSessionState<EmailData>('qr-email', { to: '', subject: '', body: '' });
  const [phone, setPhone] = useSessionState('qr-phone', '');
  const [vcard, setVcard] = useSessionState<VCardData>('qr-vcard', { name: '', phone: '', email: '', org: '' });

  const [ecl, setEcl] = useSessionState<Ecl>('qr-ecl', 'M');
  const [size, setSize] = useSessionState('qr-size', 512);
  const [margin, setMargin] = useSessionState('qr-margin', 2);
  // `null` foreground = follow the app accent colour.
  const [fgInput, setFgInput] = useSessionState<string | null>('qr-fg', null);
  const [bgInput, setBgInput] = useSessionState('qr-bg', WHITE);
  const [transparent, setTransparent] = useSessionState('qr-transparent', false);
  const [showPassword, setShowPassword] = useState(false);

  // Read the accent after the theme provider has applied its CSS variables.
  const [accent, setAccent] = useState(BLACK);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setAccent(readAccentHex()));
    return () => cancelAnimationFrame(raf);
  }, [primaryColor]);

  const fg = fgInput === null ? accent : resolveHex(fgInput, BLACK);
  const bg = resolveHex(bgInput, WHITE);

  const payload = useMemo(() => {
    switch (type) {
      case 'text':
        return text;
      case 'url':
        return normalizeUrl(url);
      case 'wifi':
        return buildWifi(wifi);
      case 'email':
        return buildEmail(email);
      case 'phone': {
        const p = phone.replace(/[^\d+*#]/g, '');
        return p ? `tel:${p}` : '';
      }
      case 'vcard':
        return buildVCard(vcard);
    }
  }, [type, text, url, wifi, email, phone, vcard]);

  const options = useMemo(
    () => ({
      errorCorrectionLevel: ecl,
      margin,
      width: size,
      color: { dark: fg, light: transparent ? '#00000000' : bg },
    }),
    [ecl, margin, size, fg, bg, transparent],
  );

  /* --- generation (debounced) ------------------------------------- */

  const [result, setResult] = useState<QrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!payload) {
      setResult(null);
      setError(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const qr = QRCode.create(payload, { errorCorrectionLevel: options.errorCorrectionLevel });
        const dataUrl = await QRCode.toDataURL(payload, options);
        if (cancelled) return;
        setResult({ dataUrl, version: qr.version, modules: qr.modules.size });
        setError(null);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setError(/too big|amount of data/i.test(msg) ? 'Content is too long to fit in a QR code at this error-correction level.' : msg);
        setResult(null);
      }
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [payload, options]);

  /* --- actions ---------------------------------------------------- */

  const fileBase = `qr-${type}`;

  const downloadPng = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = `${fileBase}.png`;
    a.click();
    toast.success('Downloaded PNG');
  };

  const downloadSvg = async () => {
    if (!payload) return;
    try {
      const svg = await QRCode.toString(payload, { ...options, type: 'svg' });
      const href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      const a = document.createElement('a');
      a.href = href;
      a.download = `${fileBase}.svg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      toast.success('Downloaded SVG');
    } catch {
      toast.error('Could not generate SVG');
    }
  };

  const copyImage = async () => {
    if (!result) return;
    try {
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) throw new Error('unsupported');
      const blob = await (await fetch(result.dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast.success('QR image copied to clipboard');
    } catch {
      toast.error('Copying images isn’t supported here — download the PNG instead');
    }
  };

  const resetColors = () => {
    setFgInput(BLACK);
    setBgInput(WHITE);
    setTransparent(false);
  };

  /* --- warnings --------------------------------------------------- */

  const fgRgb = parseColor(fg)!.color;
  const bgRgb = parseColor(bg)!.color;
  const ratio = contrastRatio(fgRgb, bgRgb);
  const inverted = !transparent && relativeLuminance(fgRgb) > relativeLuminance(bgRgb);
  const lowContrast = !transparent && ratio < 3;
  const bytes = useMemo(() => new TextEncoder().encode(payload).length, [payload]);
  const dense = (result?.version ?? 0) >= 15;

  /* --- content forms ---------------------------------------------- */

  const contentForm = (() => {
    switch (type) {
      case 'text':
        return (
          <Field label="Text">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Any text…"
              className="min-h-[120px]"
            />
          </Field>
        );
      case 'url':
        return (
          <Field
            label="URL"
            hint={url.trim() && !/^[a-z][a-z\d+.-]*:/i.test(url.trim()) ? 'https:// will be added automatically.' : undefined}
          >
            <Input
              mono
              leading={<Link />}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              inputMode="url"
              spellCheck={false}
            />
          </Field>
        );
      case 'wifi':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Network name (SSID)">
              <Input value={wifi.ssid} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} placeholder="MyNetwork" />
            </Field>
            <Field label="Encryption">
              <Select
                options={ENCRYPTION_OPTIONS}
                value={wifi.encryption}
                onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as WifiEncryption })}
              />
            </Field>
            <div className={cn('sm:col-span-2', wifi.encryption === 'nopass' && 'opacity-50')}>
              <Field label="Password">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={wifi.password}
                  disabled={wifi.encryption === 'nopass'}
                  onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                  placeholder={wifi.encryption === 'nopass' ? 'Not required' : '••••••••'}
                  autoComplete="off"
                  trailing={
                    <IconButton
                      size="sm"
                      label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={wifi.encryption === 'nopass'}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </IconButton>
                  }
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <ToggleChip checked={wifi.hidden} onChange={(hidden) => setWifi({ ...wifi, hidden })}>
                Hidden network
              </ToggleChip>
            </div>
          </div>
        );
      case 'email':
        return (
          <div className="grid gap-4">
            <Field label="To">
              <Input
                type="email"
                value={email.to}
                onChange={(e) => setEmail({ ...email, to: e.target.value })}
                placeholder="someone@example.com"
              />
            </Field>
            <Field label="Subject">
              <Input value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} placeholder="Hello!" />
            </Field>
            <Field label="Body">
              <Textarea value={email.body} onChange={(e) => setEmail({ ...email, body: e.target.value })} placeholder="Message…" />
            </Field>
          </div>
        );
      case 'phone':
        return (
          <Field label="Phone number" hint="Include the country code, e.g. +1 555 123 4567.">
            <Input
              type="tel"
              leading={<Phone />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              inputMode="tel"
            />
          </Field>
        );
      case 'vcard':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={vcard.name} onChange={(e) => setVcard({ ...vcard, name: e.target.value })} placeholder="Ada Lovelace" />
            </Field>
            <Field label="Organization">
              <Input value={vcard.org} onChange={(e) => setVcard({ ...vcard, org: e.target.value })} placeholder="Analytical Engines Ltd" />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                value={vcard.phone}
                onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                placeholder="+44 20 7946 0000"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={vcard.email}
                onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                placeholder="ada@example.com"
              />
            </Field>
          </div>
        );
    }
  })();

  /* --- render ----------------------------------------------------- */

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <ToolHeader
          icon={<QrCode />}
          title="QR Code"
          description="Generate QR codes for text, links, Wi-Fi, email, phone and contacts"
          actions={
            <CopyButton
              value={payload}
              label="Copy content"
              variant="secondary"
              message="Copied QR content"
              disabled={!payload}
            />
          }
        />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="contents min-w-0 lg:flex lg:flex-col lg:gap-4">
            {/* ---------------- Content ---------------- */}
            <Card className="order-1 min-w-0 lg:order-none">
              <div className="border-b border-border-subtle px-2 pt-1">
                <Tabs value={type} onChange={setType} items={TYPE_ITEMS} />
              </div>
              <div className="p-4">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.14 }}
                  >
                    {contentForm}
                  </motion.div>
                </AnimatePresence>

                {payload && type !== 'text' && !(type === 'url' && payload === url.trim()) && (
                  <div className="mt-4 rounded-lg border border-border-subtle bg-surface-2">
                    <div className="flex items-center justify-between gap-2 py-1 pl-3 pr-1">
                      <span className="label-caps">Encoded payload</span>
                      <CopyButton value={payload} message="Copied payload" />
                    </div>
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all border-t border-border-subtle px-3 py-2 font-mono text-xs text-muted-foreground">
                      {payload}
                    </pre>
                  </div>
                )}
              </div>
            </Card>

            {/* ---------------- Options ---------------- */}
            <Card className="order-3 min-w-0 lg:order-none">
              <CardHeader icon={<Settings2 />} title="Options" description="Error correction, size and colors" />
              <div className="flex flex-col gap-5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="label-caps">Error correction</span>
                    <p className="text-xs text-muted-foreground">
                      Recovers up to {ECL_RECOVERY[ecl]} damage — higher is denser.
                    </p>
                  </div>
                  <SegmentedControl
                    aria-label="Error correction level"
                    value={ecl}
                    onChange={setEcl}
                    options={ECL_OPTIONS}
                    size="md"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <RangeField label="Size" value={size} min={128} max={1024} step={32} unit="px" onChange={setSize} />
                  <RangeField label="Margin" value={margin} min={0} max={8} step={1} unit=" mod" onChange={setMargin} />
                </div>

                <div className="h-px bg-border-subtle" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorField label="Foreground" value={fgInput ?? accent} resolved={fg} onChange={setFgInput} />
                  <ColorField
                    label="Background"
                    value={bgInput}
                    resolved={bg}
                    onChange={setBgInput}
                    disabled={transparent}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ToggleChip checked={transparent} onChange={setTransparent}>
                    Transparent background
                  </ToggleChip>
                  <div className="ml-auto flex flex-wrap gap-1">
                    <Button variant="ghost" size="xs" onClick={() => setFgInput(null)} disabled={fgInput === null}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Use accent
                    </Button>
                    <Button variant="ghost" size="xs" onClick={resetColors}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset to black/white
                    </Button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {(lowContrast || inverted) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          {lowContrast
                            ? `Low contrast (${ratio.toFixed(2)} : 1) — many scanners need a strong dark-on-light difference.`
                            : 'Light modules on a dark background (inverted) — some scanners can’t read these.'}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </div>

          {/* ---------------- Preview ---------------- */}
          <Card className="order-2 min-w-0 lg:sticky lg:top-0 lg:order-none">
            <CardHeader
              icon={<ScanLine />}
              title="Preview"
              description={result ? `${size} × ${size}px PNG` : 'Live preview'}
              actions={
                <AnimatePresence initial={false}>
                  {(error || dense) && (
                    <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={spring}>
                      <Badge tone={error ? 'danger' : 'warning'}>
                        <AlertTriangle />
                        {error ? 'Too long' : 'Dense'}
                      </Badge>
                    </motion.span>
                  )}
                </AnimatePresence>
              }
            />
            <div className="flex flex-col gap-4 p-4">
              <div
                className="relative mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center overflow-hidden rounded-xl border border-border p-3"
                style={transparent ? CHECKER : { backgroundColor: 'hsl(var(--surface-2))' }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {result ? (
                    <motion.img
                      key={result.dataUrl}
                      src={result.dataUrl}
                      alt="Generated QR code"
                      initial={{ opacity: 0.4, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={spring}
                      className="h-full w-full rounded-md object-contain [image-rendering:pixelated]"
                    />
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                      <EmptyState
                        icon={error ? <AlertTriangle /> : <QrCode />}
                        title={error ? 'Can’t generate' : 'Nothing to encode'}
                        hint={error ?? 'Fill in the content on the left to generate a QR code.'}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <Badge tone="neutral" className="font-mono tabular-nums">
                  {payload.length} chars · {bytes} B
                </Badge>
                {result && (
                  <Tooltip content={`${result.modules} × ${result.modules} modules`}>
                    <Badge tone="primary" className="font-mono tabular-nums">
                      v{result.version} · {ecl}
                    </Badge>
                  </Tooltip>
                )}
              </div>

              <AnimatePresence initial={false}>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden text-center text-xs text-destructive"
                  >
                    {error} {ecl !== 'L' && 'Try a lower error-correction level.'}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" size="sm" onClick={downloadPng} disabled={!result}>
                  <Download className="h-3.5 w-3.5" />
                  PNG
                </Button>
                <Button variant="secondary" size="sm" onClick={downloadSvg} disabled={!result}>
                  <FileCode2 className="h-3.5 w-3.5" />
                  SVG
                </Button>
                <Button variant="secondary" size="sm" onClick={copyImage} disabled={!result} className="col-span-2">
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  Copy image
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
