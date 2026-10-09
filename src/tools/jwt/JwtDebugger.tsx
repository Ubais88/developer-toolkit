import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Braces,
  CalendarClock,
  Clock,
  Eraser,
  Eye,
  EyeOff,
  Fingerprint,
  Info,
  KeyRound,
  ListTree,
  ShieldCheck,
  ShieldX,
  Sparkles,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CopyButton,
  EmptyState,
  Field,
  IconButton,
  Input,
  Panel,
  ToggleChip,
  ToolHeader,
  cn,
} from '../../components/ui';
import { Editor } from '../../components/editor/Editor';
import { useToast } from '../../context/ToastContext';
import { useSessionState } from '../../hooks/useSessionState';
import { base64ToBytes, base64UrlDecodeToString, bytesToBase64, encodeBase64 } from '../../lib/base64';
import { formatRelative } from '../../lib/time';

const SPRING = { type: 'spring', stiffness: 460, damping: 36 } as const;
const SAMPLE_SECRET = 'your-256-bit-secret';

const SEGMENT_COLORS = {
  header: 'text-rose-500 dark:text-rose-400',
  payload: 'text-violet-600 dark:text-violet-400',
  signature: 'text-sky-600 dark:text-sky-400',
} as const;
const SEGMENT_DOTS = {
  header: 'bg-rose-500',
  payload: 'bg-violet-500',
  signature: 'bg-sky-500',
} as const;

type JsonObject = Record<string, unknown>;

type DecodeResult =
  | { ok: false; error: string; hint?: string }
  | {
      ok: true;
      parts: [string, string, string];
      header: JsonObject;
      payload: JsonObject;
      headerJson: string;
      payloadJson: string;
    };

/* ────────────────────────────── helpers ────────────────────────────── */

const isObject = (v: unknown): v is JsonObject => typeof v === 'object' && v !== null && !Array.isArray(v);

function decodeSegment(segment: string, name: 'Header' | 'Payload'): JsonObject {
  let text: string;
  try {
    text = base64UrlDecodeToString(segment);
  } catch (e) {
    throw new Error(`${name} is not valid Base64URL — ${e instanceof Error ? e.message.replace(/^Invalid Base64:\s*/, '') : 'decode failed'}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${name} decodes to text, but it isn't valid JSON.`);
  }
  if (!isObject(parsed)) throw new Error(`${name} must be a JSON object.`);
  return parsed;
}

function decodeJwt(raw: string): DecodeResult | null {
  const token = raw.trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length === 5) {
    return {
      ok: false,
      error: 'This looks like an encrypted token (JWE).',
      hint: 'JWE payloads can only be read with the recipient’s private key.',
    };
  }
  if (parts.length !== 3) {
    return {
      ok: false,
      error: `A JWT has 3 dot-separated segments — this one has ${parts.length}.`,
      hint: 'Expected format: header.payload.signature',
    };
  }
  try {
    const header = decodeSegment(parts[0], 'Header');
    const payload = decodeSegment(parts[1], 'Payload');
    return {
      ok: true,
      parts: parts as [string, string, string],
      header,
      payload,
      headerJson: JSON.stringify(header, null, 2),
      payloadJson: JSON.stringify(payload, null, 2),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Malformed token.' };
  }
}

/** "3h 2m", "45s", "2d 4h" — the two most significant units. */
function formatDuration(ms: number): string {
  let s = Math.max(0, Math.floor(Math.abs(ms) / 1000));
  const units: [string, number][] = [
    ['y', 31_536_000],
    ['d', 86_400],
    ['h', 3_600],
    ['m', 60],
    ['s', 1],
  ];
  const first = units.findIndex(([, n]) => s >= n);
  if (first === -1) return '0s';
  const out: string[] = [];
  for (const [u, n] of units.slice(first, first + 2)) {
    const v = Math.floor(s / n);
    s -= v * n;
    if (v > 0) out.push(`${v}${u}`);
  }
  return out.join(' ');
}

function useNow(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);
  return now;
}

const HMAC_HASH: Record<string, string> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };
const utf8 = (s: string) => new TextEncoder().encode(s);
const b64url = (data: string | Uint8Array) =>
  typeof data === 'string' ? encodeBase64(data, { urlSafe: true, padding: false }) : bytesToBase64(data, { urlSafe: true, padding: false });

async function hmacKey(alg: string, secret: Uint8Array, usage: 'sign' | 'verify') {
  return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: HMAC_HASH[alg] }, false, [usage]);
}

async function createSampleToken(): Promise<string> {
  if (!crypto?.subtle) throw new Error('WebCrypto is unavailable in this context.');
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: 'https://auth.example.com',
    sub: '1234567890',
    aud: 'developer-toolkit',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    roles: ['admin', 'editor'],
    iat: now,
    nbf: now,
    exp: now + 3 * 3600 + 2 * 60,
    jti: crypto.randomUUID ? crypto.randomUUID() : String(now),
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const key = await hmacKey('HS256', utf8(SAMPLE_SECRET), 'sign');
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8(signingInput)));
  return `${signingInput}.${b64url(sig)}`;
}

/* ────────────────────────────── claims ────────────────────────────── */

const CLAIM_INFO: Record<string, string> = {
  iss: 'Issuer — who created and signed the token',
  sub: 'Subject — whom the token refers to',
  aud: 'Audience — intended recipient(s)',
  exp: 'Expiration time — not accepted after this',
  nbf: 'Not before — not accepted before this',
  iat: 'Issued at — when the token was created',
  jti: 'JWT ID — unique identifier for the token',
  name: 'Full name',
  given_name: 'Given name',
  family_name: 'Family name',
  preferred_username: 'Preferred username',
  email: 'Email address',
  email_verified: 'Whether the email has been verified',
  picture: 'Profile picture URL',
  locale: 'Locale',
  azp: 'Authorized party — client the token was issued to',
  scope: 'Granted scopes',
  scp: 'Granted scopes',
  roles: 'Assigned roles',
  groups: 'Group memberships',
  nonce: 'Nonce — binds the token to a client session',
  auth_time: 'Time the user authenticated',
  sid: 'Session ID',
  acr: 'Authentication context class',
  amr: 'Authentication methods used',
  at_hash: 'Access token hash',
  c_hash: 'Authorization code hash',
  client_id: 'OAuth client identifier',
  tid: 'Tenant ID',
  oid: 'Object ID',
  updated_at: 'Time the profile was last updated',
};

const TIME_CLAIMS = new Set(['exp', 'nbf', 'iat', 'auth_time', 'updated_at']);

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

function ClaimValue({ name, value, now }: { name: string; value: unknown; now: number }) {
  if (TIME_CLAIMS.has(name) && typeof value === 'number' && Number.isFinite(value)) {
    const ms = value * 1000;
    const past = ms <= now;
    const tone =
      name === 'exp' ? (past ? 'text-destructive' : 'text-success') : name === 'nbf' && !past ? 'text-warning' : 'text-muted-foreground';
    return (
      <div className="space-y-0.5">
        <div className="font-mono text-xs text-foreground">{value}</div>
        <div className="text-xs text-foreground/90">{dateFormatter.format(new Date(ms))}</div>
        <div className={cn('text-2xs font-medium', tone)}>{formatRelative(ms, now)}</div>
      </div>
    );
  }
  if (typeof value === 'string') return <span className="break-all font-mono text-xs text-foreground">{value}</span>;
  return (
    <span
      className={cn(
        'break-all font-mono text-xs',
        typeof value === 'boolean' || value === null ? 'text-primary' : typeof value === 'number' ? 'text-sky-600 dark:text-sky-400' : 'text-foreground',
      )}
    >
      {JSON.stringify(value)}
    </span>
  );
}

function ClaimsTable({ payload }: { payload: JsonObject }) {
  const keys = Object.keys(payload);
  const now = useNow(keys.some((k) => TIME_CLAIMS.has(k)));
  return (
    <Panel title="Claims" icon={<ListTree />} meta={`${keys.length} claim${keys.length === 1 ? '' : 's'}`}>
      {keys.length === 0 ? (
        <p className="px-3.5 py-4 text-xs text-muted-foreground">The payload has no claims.</p>
      ) : (
        <table className="w-full table-fixed text-left">
          <thead className="sr-only">
            <tr>
              <th scope="col">Claim</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {keys.map((k) => (
              <tr key={k} className="align-top transition-colors hover:bg-surface-2/50">
                <th scope="row" className="w-[42%] px-3.5 py-2.5 font-normal sm:w-[38%]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <code className="font-mono text-xs font-semibold text-violet-600 dark:text-violet-400">{k}</code>
                    {['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'].includes(k) && (
                      <span className="rounded border border-border px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        std
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-2xs leading-snug text-muted-foreground">{CLAIM_INFO[k] ?? 'Custom claim'}</p>
                </th>
                <td className="px-3.5 py-2.5">
                  <ClaimValue name={k} value={payload[k]} now={now} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

/* ────────────────────────────── status ────────────────────────────── */

function StatusBadges({ header, payload }: { header: JsonObject; payload: JsonObject }) {
  const exp = typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  const nbf = typeof payload.nbf === 'number' ? payload.nbf * 1000 : null;
  const iat = typeof payload.iat === 'number' ? payload.iat * 1000 : null;
  const now = useNow(exp !== null || nbf !== null || iat !== null);
  const alg = typeof header.alg === 'string' ? header.alg : 'unknown';

  const badges: ReactNode[] = [
    <Badge key="alg" tone={alg === 'none' ? 'warning' : 'primary'}>
      <Fingerprint />
      {alg}
    </Badge>,
  ];
  if (typeof header.typ === 'string') badges.push(<Badge key="typ">{header.typ}</Badge>);

  if (exp !== null && now >= exp) {
    badges.push(
      <Badge key="state" tone="danger">
        <ShieldX />
        Expired {formatDuration(now - exp)} ago
      </Badge>,
    );
  } else if (nbf !== null && now < nbf) {
    badges.push(
      <Badge key="state" tone="warning">
        <Clock />
        Not yet valid · in {formatDuration(nbf - now)}
      </Badge>,
    );
  } else {
    badges.push(
      <Badge key="state" tone="success">
        <ShieldCheck />
        Valid
      </Badge>,
    );
  }
  if (exp !== null && now < exp) {
    badges.push(
      <Badge key="exp" tone={exp - now < 5 * 60_000 ? 'warning' : 'neutral'}>
        <CalendarClock />
        <span className="tabular-nums">Expires in {formatDuration(exp - now)}</span>
      </Badge>,
    );
  } else if (exp === null) {
    badges.push(<Badge key="exp">No expiry</Badge>);
  }
  if (iat !== null) badges.push(<Badge key="iat">Issued {formatRelative(iat, now)}</Badge>);

  return <div className="flex flex-wrap items-center gap-1.5">{badges}</div>;
}

/* ────────────────────────────── signature ────────────────────────────── */

type VerifyState = { status: 'idle' } | { status: 'checking' } | { status: 'verified' } | { status: 'invalid' } | { status: 'error'; message: string };

function SignaturePanel({ alg, parts, secret, setSecret }: { alg: string; parts: [string, string, string]; secret: string; setSecret: (s: string) => void }) {
  const [secretIsB64, setSecretIsB64] = useSessionState('jwt-secret-b64', false);
  const [reveal, setReveal] = useState(false);
  const [state, setState] = useState<VerifyState>({ status: 'idle' });
  const isHmac = alg in HMAC_HASH;

  useEffect(() => {
    if (!isHmac || !secret) {
      setState({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setState({ status: 'checking' });
    (async () => {
      try {
        let keyBytes: Uint8Array;
        try {
          keyBytes = secretIsB64 ? base64ToBytes(secret) : utf8(secret);
        } catch {
          throw new Error('The secret is not valid Base64.');
        }
        if (keyBytes.length === 0) throw new Error('The secret is empty.');
        let sigBytes: Uint8Array;
        try {
          sigBytes = base64ToBytes(parts[2]);
        } catch {
          if (!cancelled) setState({ status: 'invalid' });
          return;
        }
        const key = await hmacKey(alg, keyBytes, 'verify');
        const ok = await crypto.subtle.verify('HMAC', key, sigBytes, utf8(`${parts[0]}.${parts[1]}`));
        if (!cancelled) setState({ status: ok ? 'verified' : 'invalid' });
      } catch (e) {
        if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : 'Verification failed.' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [alg, isHmac, parts, secret, secretIsB64]);

  const result =
    state.status === 'verified' ? (
      <Badge tone="success">
        <ShieldCheck />
        Signature verified
      </Badge>
    ) : state.status === 'invalid' ? (
      <Badge tone="danger">
        <ShieldX />
        Invalid signature
      </Badge>
    ) : state.status === 'error' ? (
      <Badge tone="danger">
        <AlertTriangle />
        {state.message}
      </Badge>
    ) : state.status === 'checking' ? (
      <Badge>Checking…</Badge>
    ) : (
      <Badge>Not verified</Badge>
    );

  return (
    <Panel
      title="Verify signature"
      icon={<span className={cn('h-2 w-2 rounded-full', SEGMENT_DOTS.signature)} />}
      actions={isHmac ? <div className="pr-1.5">{result}</div> : undefined}
    >
      {isHmac ? (
        <div className="flex flex-col gap-3 p-3.5">
          <Field
            label={`${alg} secret`}
            hint={
              <span className="font-mono text-2xs">
                HMAC{HMAC_HASH[alg].replace('SHA-', 'SHA')}(base64url(header) + "." + base64url(payload), secret)
              </span>
            }
          >
            <Input
              mono
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              type={reveal ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              placeholder="Enter the shared secret to verify"
              invalid={state.status === 'invalid' || state.status === 'error'}
              trailing={
                <IconButton label={reveal ? 'Hide secret' : 'Show secret'} size="sm" onClick={() => setReveal((r) => !r)}>
                  {reveal ? <EyeOff /> : <Eye />}
                </IconButton>
              }
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleChip checked={secretIsB64} onChange={setSecretIsB64} title="Decode the secret from Base64 before using it as the key">
              Secret is Base64 encoded
            </ToggleChip>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-3.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {alg === 'none' ? (
              <>
                This token is <span className="font-medium text-warning">unsigned</span> (<code className="font-mono">alg: none</code>) — there is no
                signature to verify, so it should never be trusted.
              </>
            ) : (
              <>
                <code className="font-mono text-foreground">{alg}</code> uses a public/private key pair. Only HMAC algorithms (HS256, HS384, HS512)
                can be verified locally here.
              </>
            )}
          </p>
        </div>
      )}
    </Panel>
  );
}

/* ────────────────────────────── token display ────────────────────────────── */

function TokenAnatomy({ parts }: { parts: string[] }) {
  const kinds = ['header', 'payload', 'signature'] as const;
  return (
    <p className="break-all font-mono text-xs leading-relaxed">
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="text-muted-foreground">.</span>}
          <span className={SEGMENT_COLORS[kinds[i] ?? 'signature']}>{p}</span>
        </span>
      ))}
    </p>
  );
}

const MIN_EDITOR_HEIGHT = 84;

function JsonPanel({ title, kind, json, path }: { title: string; kind: 'header' | 'payload'; json: string; path: string }) {
  const max = kind === 'payload' ? 440 : 240;
  // Start from a line-count estimate, then track Monaco's real content height (accounts for wrapping).
  const [contentHeight, setContentHeight] = useState(() => json.split('\n').length * 18 + 28);
  const height = Math.min(max, Math.max(MIN_EDITOR_HEIGHT, contentHeight));
  return (
    <Panel
      title={title}
      icon={<span className={cn('h-2 w-2 rounded-full', SEGMENT_DOTS[kind])} />}
      meta={kind === 'payload' ? 'Data' : 'Algorithm & token type'}
      actions={<CopyButton value={json} message={`${title} JSON copied`} />}
    >
      <div style={{ height }} className="transition-[height] duration-200">
        <Editor
          value={json}
          readOnly
          language="json"
          path={path}
          lineNumbers={false}
          wordWrap
          onMount={(editor) => {
            // getContentHeight() never drops below the viewport, so measure the last line instead.
            const update = () => {
              const lines = editor.getModel()?.getLineCount() ?? 1;
              setContentHeight(editor.getBottomForLineNumber(lines) + 14);
            };
            editor.onDidContentSizeChange(update);
            editor.onDidLayoutChange(update);
            update();
          }}
        />
      </div>
    </Panel>
  );
}

/* ────────────────────────────── main ────────────────────────────── */

export function JwtDebugger() {
  const toast = useToast();
  const [token, setToken] = useSessionState('jwt-token', '');
  const [secret, setSecret] = useState('');
  const [loadingSample, setLoadingSample] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const decoded = useMemo(() => decodeJwt(token), [token]);
  const displayParts = useMemo(() => token.trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, '').split('.'), [token]);
  const alg = decoded?.ok && typeof decoded.header.alg === 'string' ? decoded.header.alg : 'unknown';

  const loadSample = async () => {
    setLoadingSample(true);
    try {
      setToken(await createSampleToken());
      setSecret(SAMPLE_SECRET);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create a sample token');
    } finally {
      setLoadingSample(false);
    }
  };

  const clear = () => {
    setToken('');
    setSecret('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <ToolHeader
        icon={<KeyRound />}
        title="JWT Debugger"
        description="Decode, inspect and verify JSON Web Tokens"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={loadSample} isLoading={loadingSample}>
              {!loadingSample && <Sparkles className="h-3.5 w-3.5" />}
              Load sample
            </Button>
            <Button variant="ghost" size="sm" onClick={clear} disabled={!token}>
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Left: token + status + signature */}
        <div className="flex min-w-0 flex-col gap-4">
          <Panel
            title="Encoded token"
            icon={<KeyRound />}
            meta={token ? `${token.trim().length.toLocaleString()} chars` : undefined}
            className={cn('transition-colors', decoded && !decoded.ok && 'border-destructive/40')}
            actions={<CopyButton value={token.trim()} disabled={!token} message="Token copied" />}
          >
            <textarea
              ref={inputRef}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              spellCheck={false}
              aria-label="JSON Web Token"
              placeholder="Paste a JWT (eyJhbGciOi…) — a leading “Bearer ” is ignored"
              className="block min-h-[120px] w-full resize-y bg-transparent px-3.5 py-3 font-mono text-xs leading-relaxed text-foreground outline-none placeholder:font-sans placeholder:text-13 placeholder:text-muted-foreground/60"
            />
            <AnimatePresence initial={false}>
              {token.trim() && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={SPRING}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 border-t border-border-subtle bg-surface-2/40 px-3.5 py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground">
                      {(['header', 'payload', 'signature'] as const).map((k) => (
                        <span key={k} className="inline-flex items-center gap-1.5 capitalize">
                          <span className={cn('h-1.5 w-1.5 rounded-full', SEGMENT_DOTS[k])} />
                          {k}
                        </span>
                      ))}
                    </div>
                    <TokenAnatomy parts={displayParts} />
                    {decoded?.ok && <StatusBadges header={decoded.header} payload={decoded.payload} />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>

          {decoded?.ok && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
              <SignaturePanel alg={alg} parts={decoded.parts} secret={secret} setSecret={setSecret} />
            </motion.div>
          )}

          <p className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
            Tokens are decoded locally — nothing leaves your browser.
          </p>
        </div>

        {/* Right: decoded output */}
        <div className="flex min-w-0 flex-col gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {!decoded ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="min-h-[320px]">
                  <EmptyState
                    className="min-h-[320px]"
                    icon={<Braces />}
                    title="Paste a token to decode it"
                    hint="The header, payload and claims appear here. Expiry is tracked live and HMAC signatures can be verified."
                    action={
                      <Button variant="secondary" size="sm" onClick={loadSample} isLoading={loadingSample}>
                        {!loadingSample && <Sparkles className="h-3.5 w-3.5" />}
                        Load sample token
                      </Button>
                    }
                  />
                </Card>
              </motion.div>
            ) : !decoded.ok ? (
              <motion.div
                key="error"
                role="alert"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
                className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="min-w-0 space-y-1">
                  <p className="text-13 font-medium text-destructive">Can’t decode this token</p>
                  <p className="text-xs text-destructive/90">{decoded.error}</p>
                  {decoded.hint && <p className="text-xs text-muted-foreground">{decoded.hint}</p>}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="decoded"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
                className="flex flex-col gap-4"
              >
                <JsonPanel title="Header" kind="header" json={decoded.headerJson} path="jwt-header.json" />
                <JsonPanel title="Payload" kind="payload" json={decoded.payloadJson} path="jwt-payload.json" />
                <ClaimsTable payload={decoded.payload} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
