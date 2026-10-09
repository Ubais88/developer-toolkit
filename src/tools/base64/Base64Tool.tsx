import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeftRight,
  Binary,
  Download,
  Eraser,
  File as FileIcon,
  FileDown,
  FileUp,
  ImagePlus,
  Lock,
  Sparkles,
  Type,
  Unlock,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  CopyButton,
  EmptyState,
  IconButton,
  Kbd,
  Panel,
  SegmentedControl,
  Tabs,
  ToggleChip,
  ToolHeader,
  cn,
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useSessionState } from '../../hooks/useSessionState';
import {
  base64ToBytes,
  decodeBase64,
  detectMime,
  encodeBase64,
  extensionForMime,
  formatBytes,
  isLikelyBase64,
  parseDataUri,
  utf8ByteLength,
} from '../../lib/base64';

type Tab = 'text' | 'file';
type Direction = 'encode' | 'decode';

const SPRING = { type: 'spring', stiffness: 460, damping: 36 } as const;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Characters rendered for very long values — copying always uses the full string. */
const DISPLAY_LIMIT = 1200;

const SAMPLE_TEXT = 'héllo 👋 ünïcode — Base64 here is fully UTF-8 safe ✨';

const checkerboard: CSSProperties = {
  backgroundImage: 'repeating-conic-gradient(hsl(var(--surface-3)) 0% 25%, hsl(var(--surface-1)) 0% 50%)',
  backgroundSize: '14px 14px',
};

export function Base64Tool() {
  const [tab, setTab] = useSessionState<Tab>('b64-tab', 'text');

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <ToolHeader
        icon={<Binary />}
        title="Base64 & Images"
        description="Unicode-safe Base64 / Base64URL, plus image & file ↔ data URI conversion"
      />

      <div className="border-b border-border-subtle">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          items={[
            { value: 'text', label: 'Text', icon: <Type /> },
            { value: 'file', label: 'Image / File', icon: <ImagePlus /> },
          ]}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
          transition={SPRING}
          className="flex flex-1 flex-col gap-4"
        >
          {tab === 'text' ? <TextMode /> : <FileMode />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────── Text ────────────────────────────── */

function countMeta(text: string) {
  if (!text) return undefined;
  const chars = Array.from(text).length;
  const bytes = utf8ByteLength(text);
  return `${chars.toLocaleString()} chars · ${bytes.toLocaleString()} bytes`;
}

function TextMode() {
  const [input, setInput] = useSessionState('b64-input', '');
  const [direction, setDirection] = useSessionState<Direction>('b64-direction', 'encode');
  const [urlSafe, setUrlSafe] = useSessionState('b64-urlsafe', false);
  const [padding, setPadding] = useSessionState('b64-padding', true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const result = useMemo((): { output: string; error: string | null } => {
    if (!input) return { output: '', error: null };
    try {
      const output = direction === 'encode' ? encodeBase64(input, { urlSafe, padding }) : decodeBase64(input);
      return { output, error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'Could not convert input.' };
    }
  }, [input, direction, urlSafe, padding]);

  // Gentle hint when someone pastes Base64 while in Encode mode.
  const looksEncoded = useMemo(() => {
    if (direction !== 'encode' || input.length < 8 || !isLikelyBase64(input)) return false;
    try {
      decodeBase64(input);
      return true;
    } catch {
      return false;
    }
  }, [direction, input]);

  const loadSample = () => {
    setInput(direction === 'encode' ? SAMPLE_TEXT : encodeBase64(SAMPLE_TEXT, { urlSafe, padding }));
    inputRef.current?.focus();
  };

  const swap = () => {
    if (!result.output) return;
    setInput(result.output);
    setDirection(direction === 'encode' ? 'decode' : 'encode');
  };

  const clear = () => {
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl<Direction>
          aria-label="Conversion direction"
          size="md"
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'encode', label: 'Encode', icon: <Lock /> },
            { value: 'decode', label: 'Decode', icon: <Unlock /> },
          ]}
        />
        <div className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
        <AnimatePresence mode="popLayout" initial={false}>
          {direction === 'encode' ? (
            <motion.div
              key="enc-opts"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={SPRING}
              className="flex items-center gap-2"
            >
              <ToggleChip checked={urlSafe} onChange={setUrlSafe} title="Use - and _ instead of + and / (Base64URL)">
                URL-safe
              </ToggleChip>
              <ToggleChip checked={padding} onChange={setPadding} title="Append trailing = padding">
                Padding
              </ToggleChip>
            </motion.div>
          ) : (
            <motion.p
              key="dec-hint"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={SPRING}
              className="text-xs text-muted-foreground"
            >
              Accepts standard or URL-safe alphabet · padding optional · whitespace ignored
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title={direction === 'encode' ? 'Plain text' : 'Base64'}
          meta={countMeta(input)}
          className={cn('min-h-[280px] transition-colors', result.error && 'border-destructive/40')}
          bodyClassName="flex flex-col"
          actions={
            <>
              <Button variant="ghost" size="xs" onClick={loadSample}>
                <Sparkles className="h-3.5 w-3.5" />
                Sample
              </Button>
              <IconButton label="Clear input" size="sm" onClick={clear} disabled={!input}>
                <Eraser />
              </IconButton>
            </>
          }
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            aria-label={direction === 'encode' ? 'Text to encode' : 'Base64 to decode'}
            placeholder={direction === 'encode' ? 'Type or paste text to encode…' : 'Paste Base64 or Base64URL to decode…'}
            className={cn(
              'min-h-[240px] w-full flex-1 resize-none bg-transparent px-3.5 py-3 text-13 leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60',
              direction === 'decode' && 'break-all font-mono',
            )}
          />
          <AnimatePresence>
            {looksEncoded && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={SPRING}
                className="m-2 mt-0 flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/10 py-1 pl-3 pr-1 text-xs text-primary"
              >
                <span className="flex items-center gap-1.5">
                  <Wand2 className="h-3.5 w-3.5" />
                  This looks like Base64 already.
                </span>
                <Button variant="subtle" size="xs" onClick={() => setDirection('decode')}>
                  Decode instead
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>

        <Panel
          title={direction === 'encode' ? (urlSafe ? 'Base64URL' : 'Base64') : 'Decoded text'}
          meta={countMeta(result.output)}
          className="min-h-[280px]"
          bodyClassName="flex flex-col"
          actions={
            <>
              <IconButton label="Use output as input" size="sm" onClick={swap} disabled={!result.output}>
                <ArrowLeftRight />
              </IconButton>
              <CopyButton value={result.output} disabled={!result.output} />
            </>
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            {result.error ? (
              <motion.div
                key="error"
                role="alert"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
                className="m-3 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="min-w-0 space-y-0.5">
                  <p className="text-13 font-medium text-destructive">Can’t decode this input</p>
                  <p className="text-xs text-destructive/90">{result.error}</p>
                </div>
              </motion.div>
            ) : result.output ? (
              <motion.pre
                key="output"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className={cn(
                  'min-h-[240px] flex-1 select-text overflow-auto whitespace-pre-wrap px-3.5 py-3 text-13 leading-relaxed text-foreground',
                  direction === 'encode' ? 'break-all font-mono' : 'break-words font-sans',
                )}
              >
                {result.output}
              </motion.pre>
            ) : (
              <motion.div key="empty" className="flex flex-1" exit={{ opacity: 0 }}>
                <EmptyState
                  icon={direction === 'encode' ? <Lock /> : <Unlock />}
                  title={direction === 'encode' ? 'Nothing to encode yet' : 'Nothing to decode yet'}
                  hint={
                    direction === 'encode'
                      ? 'Type on the left — output updates as you type. Emoji and accents are handled as UTF-8.'
                      : 'Paste Base64 on the left to see the decoded UTF-8 text.'
                  }
                  action={
                    <Button variant="secondary" size="sm" onClick={loadSample}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Load sample
                    </Button>
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
      </div>
    </>
  );
}

/* ────────────────────────────── Image / File ────────────────────────────── */

interface LoadedFile {
  name: string;
  mime: string;
  size: number;
  dataUri: string;
  base64: string;
}

/** Draws a small branded PNG so the sample never depends on network assets. */
async function makeSampleImage(): Promise<File> {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#8b5cf6');
  g.addColorStop(1, '#0ea5e9');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(4, 4, size - 8, size - 8, 20);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 28px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B64', size / 2, size / 2 + 1);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not create sample image');
  return new File([blob], 'sample.png', { type: 'image/png' });
}

function FileMode() {
  return (
    <div className="grid flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-2">
      <FileToBase64 />
      <Base64ToFile />
    </div>
  );
}

function FileToBase64() {
  const toast = useToast();
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const readFile = useCallback(
    (f: File) => {
      if (f.size > MAX_FILE_BYTES) {
        toast.error(`That file is ${formatBytes(f.size)} — the limit is ${formatBytes(MAX_FILE_BYTES)}.`);
        return;
      }
      setLoading(true);
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result ?? '');
        const comma = raw.indexOf(',');
        const base64 = comma >= 0 ? raw.slice(comma + 1) : '';
        let mime = f.type;
        if (!mime) {
          try {
            mime = detectMime(base64ToBytes(base64.slice(0, 1024))) ?? '';
          } catch {
            mime = '';
          }
        }
        mime ||= 'application/octet-stream';
        setDims(null);
        setFile({ name: f.name || 'pasted-file', mime, size: f.size, base64, dataUri: `data:${mime};base64,${base64}` });
        setLoading(false);
      };
      reader.onerror = () => {
        setLoading(false);
        toast.error('Could not read that file.');
      };
      reader.readAsDataURL(f);
    },
    [toast],
  );

  // Paste an image/file from the clipboard while this tab is open.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const pasted = Array.from(e.clipboardData?.files ?? [])[0];
      if (!pasted) return;
      e.preventDefault();
      readFile(pasted);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [readFile]);

  const onDragEnter = (e: DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) readFile(f);
  };

  const loadSample = async () => {
    try {
      readFile(await makeSampleImage());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create sample');
    }
  };

  const isImage = !!file?.mime.startsWith('image/');
  const overhead = file && file.size > 0 ? ((file.base64.length / file.size - 1) * 100).toFixed(1) : null;

  const outputs = file
    ? [
        { label: 'Data URI', value: file.dataUri },
        { label: 'Base64', value: file.base64 },
        ...(isImage
          ? [
              { label: 'HTML <img>', value: `<img src="${file.dataUri}" alt="${file.name.replace(/"/g, '&quot;')}" />` },
              { label: 'CSS background', value: `background-image: url("${file.dataUri}");` },
            ]
          : []),
      ]
    : [];

  return (
    <Panel
      title="File → Base64"
      icon={<FileUp />}
      meta={file ? formatBytes(file.size) : undefined}
      className="min-h-[320px]"
      bodyClassName="flex flex-col"
      actions={
        file ? (
          <>
            <Button variant="ghost" size="xs" onClick={() => pickerRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              Replace
            </Button>
            <IconButton label="Remove file" size="sm" onClick={() => setFile(null)}>
              <X />
            </IconButton>
          </>
        ) : undefined
      }
    >
      <input
        ref={pickerRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) readFile(f);
          e.target.value = '';
        }}
      />
      <div
        className="relative flex flex-1 flex-col"
        onDragEnter={onDragEnter}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) e.preventDefault();
        }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!file ? (
            <motion.div
              key="drop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 flex-col p-3"
            >
              <button
                type="button"
                onClick={() => pickerRef.current?.click()}
                className={cn(
                  'focus-ring group flex min-h-[220px] flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center transition-[border-color,background-color,box-shadow] duration-200',
                  dragging
                    ? 'border-primary bg-primary/10 shadow-glow-sm'
                    : 'border-border-strong/70 bg-surface-2/40 hover:border-primary/50 hover:bg-primary/5',
                )}
              >
                <motion.div
                  animate={dragging ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }}
                  transition={SPRING}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl border transition-colors',
                    dragging
                      ? 'border-primary/40 bg-primary/15 text-primary'
                      : 'border-border bg-surface-2 text-muted-foreground group-hover:text-primary',
                  )}
                >
                  <Upload className="h-5 w-5" />
                </motion.div>
                <div className="space-y-1">
                  <p className="text-13 font-medium text-foreground">
                    {loading ? 'Reading file…' : dragging ? 'Drop to encode' : 'Drop an image or file here'}
                  </p>
                  <p className="flex flex-wrap items-center justify-center gap-1 text-xs text-muted-foreground">
                    or click to browse · paste with <Kbd combo="mod+v" size="sm" />
                  </p>
                </div>
                <p className="text-2xs text-muted-foreground/70">Up to {formatBytes(MAX_FILE_BYTES)} · never uploaded anywhere</p>
              </button>
              <div className="flex justify-center pt-2">
                <Button variant="ghost" size="xs" onClick={loadSample}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Try a sample image
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={file.dataUri.length + file.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              className="flex flex-col gap-4 p-3.5"
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <div
                  className="flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border sm:w-36"
                  style={isImage ? checkerboard : undefined}
                >
                  {isImage ? (
                    <img
                      src={file.dataUri}
                      alt={`Preview of ${file.name}`}
                      className="max-h-full max-w-full object-contain"
                      onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                    />
                  ) : (
                    <FileIcon className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <dl className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] content-start gap-x-4 gap-y-2 text-13">
                  <Meta label="Name">
                    <span className="truncate font-medium" title={file.name}>
                      {file.name}
                    </span>
                  </Meta>
                  <Meta label="Type">
                    <span className="truncate font-mono text-xs">{file.mime}</span>
                  </Meta>
                  {dims && (
                    <Meta label="Dimensions">
                      {dims.w} × {dims.h}px
                    </Meta>
                  )}
                  <Meta label="Original">{formatBytes(file.size)}</Meta>
                  <Meta label="Base64">
                    <span className="flex flex-wrap items-center gap-1.5">
                      {formatBytes(file.base64.length)}
                      {overhead && <Badge tone="warning">+{overhead}%</Badge>}
                    </span>
                  </Meta>
                </dl>
              </div>

              <div className="flex flex-col gap-2.5">
                {outputs.map((o, i) => (
                  <motion.div
                    key={o.label}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRING, delay: 0.03 * i }}
                    className="rounded-lg border border-border-subtle bg-surface-2/50"
                  >
                    <div className="flex items-center justify-between gap-2 py-1 pl-3 pr-1">
                      <span className="label-caps">{o.label}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-2xs text-muted-foreground/70">{o.value.length.toLocaleString()} chars</span>
                        <CopyButton value={o.value} message={`${o.label} copied`} />
                      </span>
                    </div>
                    <div className="border-t border-border-subtle px-3 py-2">
                      <p className="line-clamp-3 break-all font-mono text-xs leading-relaxed text-muted-foreground">
                        {o.value.length > DISPLAY_LIMIT ? `${o.value.slice(0, DISPLAY_LIMIT)}…` : o.value}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drop overlay when a file is already loaded */}
        <AnimatePresence>
          {file && dragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-2 flex items-center justify-center rounded-lg border border-dashed border-primary bg-background/80 text-13 font-medium text-primary backdrop-blur-sm"
            >
              Drop to replace
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Panel>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center text-foreground">{children}</dd>
    </>
  );
}

type Decoded =
  | { state: 'empty' }
  | { state: 'error'; message: string }
  | { state: 'ok'; bytes: Uint8Array; mime: string | null; declared: string | null; detected: string | null };

function Base64ToFile() {
  const toast = useToast();
  const [source, setSource] = useState('');

  const decoded = useMemo((): Decoded => {
    if (!source.trim()) return { state: 'empty' };
    try {
      const { mime: declared, base64 } = parseDataUri(source);
      const bytes = base64ToBytes(base64);
      if (bytes.length === 0) return { state: 'error', message: 'The Base64 data is empty.' };
      const detected = detectMime(bytes);
      return { state: 'ok', bytes, declared, detected, mime: detected ?? declared };
    } catch (e) {
      return { state: 'error', message: e instanceof Error ? e.message : 'Invalid Base64.' };
    }
  }, [source]);

  // Object URLs keep big payloads out of the DOM; revoke them when the data changes.
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (decoded.state !== 'ok') {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([decoded.bytes], { type: decoded.mime ?? 'application/octet-stream' }));
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [decoded]);

  const download = () => {
    if (decoded.state !== 'ok' || !objectUrl) return;
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `decoded.${extensionForMime(decoded.mime)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Downloaded ${a.download}`);
  };

  const loadSample = async () => {
    try {
      const f = await makeSampleImage();
      const reader = new FileReader();
      reader.onload = () => setSource(String(reader.result ?? ''));
      reader.readAsDataURL(f);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create sample');
    }
  };

  const isImage = decoded.state === 'ok' && !!decoded.mime?.startsWith('image/');

  return (
    <Panel
      title="Base64 → File"
      icon={<FileDown />}
      meta={decoded.state === 'ok' ? formatBytes(decoded.bytes.length) : undefined}
      className="min-h-[320px]"
      bodyClassName="flex flex-col"
      actions={
        <>
          <Button variant="ghost" size="xs" onClick={loadSample}>
            <Sparkles className="h-3.5 w-3.5" />
            Sample
          </Button>
          <IconButton label="Clear" size="sm" onClick={() => setSource('')} disabled={!source}>
            <Eraser />
          </IconButton>
        </>
      }
    >
      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
        aria-label="Data URI or Base64 to decode"
        placeholder="Paste a data URI (data:image/png;base64,…) or raw Base64…"
        className={cn(
          'h-32 w-full shrink-0 resize-none border-b border-border-subtle bg-transparent px-3.5 py-3 font-mono text-xs leading-relaxed text-foreground outline-none placeholder:font-sans placeholder:text-13 placeholder:text-muted-foreground/60',
          'break-all',
        )}
      />
      <div className="flex flex-1 flex-col">
        <AnimatePresence mode="wait" initial={false}>
          {decoded.state === 'empty' && (
            <motion.div key="empty" className="flex flex-1" exit={{ opacity: 0 }}>
              <EmptyState
                icon={<FileDown />}
                title="Turn Base64 back into a file"
                hint="The type is detected from the file’s magic bytes — PNG, JPEG, GIF, WebP, SVG and PDF."
              />
            </motion.div>
          )}
          {decoded.state === 'error' && (
            <motion.div
              key="error"
              role="alert"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              className="m-3 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-xs text-destructive">{decoded.message}</p>
            </motion.div>
          )}
          {decoded.state === 'ok' && (
            <motion.div
              key="ok"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              className="flex flex-col gap-3 p-3.5"
            >
              {isImage && objectUrl ? (
                <div
                  className="flex h-48 items-center justify-center overflow-hidden rounded-lg border border-border p-2"
                  style={checkerboard}
                >
                  <img src={objectUrl} alt="Decoded preview" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center gap-3 rounded-lg border border-border bg-surface-2/50 text-muted-foreground">
                  <FileIcon className="h-6 w-6" />
                  <span className="text-xs">{decoded.mime ? 'No inline preview for this type' : 'Unknown binary data'}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={decoded.mime ? 'primary' : 'neutral'}>{decoded.mime ?? 'unknown type'}</Badge>
                  <Badge>{formatBytes(decoded.bytes.length)}</Badge>
                  {decoded.declared && decoded.detected && decoded.declared !== decoded.detected && (
                    <Badge tone="warning" title={`Declared as ${decoded.declared}`}>
                      declared {decoded.declared}
                    </Badge>
                  )}
                </div>
                <Button size="sm" onClick={download}>
                  <Download className="h-4 w-4" />
                  Download file
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Panel>
  );
}
