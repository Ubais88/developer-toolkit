import { useMemo } from 'react';
import { Binary, Code2, KeyRound, Link2 } from 'lucide-react';
import { CopyButton, SegmentedControl, Textarea } from '../../components/ui';
import { Editor } from '../../components/editor/Editor';
import { useSessionState } from '../../hooks/useSessionState';
import { base64Decode, base64Encode, decodeJWT, htmlDecode, htmlEncode, urlDecode, urlEncode } from '../../utils/dataUtils';
import { OutputBox, UtilityCard } from './UtilityCard';

type Direction = 'encode' | 'decode';

const DIRECTION_OPTIONS = [
  { value: 'encode' as const, label: 'Encode' },
  { value: 'decode' as const, label: 'Decode' },
];

/** Run a converter, turning thrown errors into an error message. */
function useConvert(input: string, fn: (s: string) => string) {
  return useMemo(() => {
    if (!input) return { value: '', error: null };
    try {
      return { value: fn(input), error: null };
    } catch (e) {
      return { value: '', error: e instanceof Error ? e.message : 'Conversion failed' };
    }
  }, [input, fn]);
}

export function Encoders({ highlight }: { highlight: string | null }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <EncodeCard
        id="base64"
        icon={<Binary />}
        title="Base64"
        description="UTF-8 safe · accepts URL-safe input"
        storageKey="data-base64"
        encode={base64Encode}
        decode={base64Decode}
        highlighted={highlight === 'base64'}
        fullTool={{ to: '/base64', label: 'Images & more' }}
      />
      <EncodeCard
        id="url"
        icon={<Link2 />}
        title="URL encode"
        description="Percent-encoding for query strings"
        storageKey="data-url"
        encode={urlEncode}
        decode={(s) => {
          try {
            return urlDecode(s);
          } catch {
            throw new Error('Malformed percent-encoding');
          }
        }}
        highlighted={highlight === 'url'}
      />
      <JwtCard highlighted={highlight === 'jwt'} />
      <EncodeCard
        id="html"
        icon={<Code2 />}
        title="HTML entities"
        description="Escape markup for safe embedding"
        storageKey="data-html"
        encode={htmlEncode}
        decode={htmlDecode}
        highlighted={highlight === 'html'}
      />
    </div>
  );
}

interface EncodeCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  storageKey: string;
  encode: (s: string) => string;
  decode: (s: string) => string;
  highlighted: boolean;
  fullTool?: { to: string; label: string };
}

function EncodeCard({ id, icon, title, description, storageKey, encode, decode, highlighted, fullTool }: EncodeCardProps) {
  const [input, setInput] = useSessionState(`${storageKey}-input`, '');
  const [direction, setDirection] = useSessionState<Direction>(`${storageKey}-direction`, 'encode');
  const { value, error } = useConvert(input, direction === 'encode' ? encode : decode);

  return (
    <UtilityCard
      id={id}
      icon={icon}
      title={title}
      description={description}
      highlighted={highlighted}
      fullTool={fullTool}
      actions={<SegmentedControl aria-label="Direction" value={direction} onChange={setDirection} options={DIRECTION_OPTIONS} />}
    >
      <Textarea
        mono
        value={input}
        onChange={(e) => setInput(e.target.value)}
        aria-label={`${title} input`}
        placeholder={direction === 'encode' ? 'Plain text…' : 'Encoded text…'}
        className="h-24 text-xs"
      />
      <OutputBox
        value={value}
        error={error}
        placeholder={direction === 'encode' ? 'Encoded output' : 'Decoded output'}
        copy={<CopyButton value={value} message="Output copied" />}
        className="max-h-48 overflow-y-auto"
      />
    </UtilityCard>
  );
}

function JwtCard({ highlighted }: { highlighted: boolean }) {
  const [input, setInput] = useSessionState('data-jwt-input', '');
  const { value, error } = useConvert(input, decodeJWT);

  return (
    <UtilityCard
      id="jwt"
      icon={<KeyRound />}
      title="JWT decode"
      description="Quick look at header & payload"
      highlighted={highlighted}
      fullTool={{
        to: '/jwt',
        label: 'Open in debugger',
        // Hand the token over to the JWT Debugger's session state
        onClick: () => input && sessionStorage.setItem('jwt-token', JSON.stringify(input.trim())),
      }}
    >
      <Textarea mono value={input} onChange={(e) => setInput(e.target.value)} aria-label="JWT" placeholder="eyJhbGciOi…" className="h-20 break-all text-xs" />
      {error ? (
        <OutputBox value="" error={error} />
      ) : value ? (
        <div className="relative h-56 overflow-hidden rounded-md border border-border">
          <Editor value={value} readOnly language="json" path="data-jwt" lineNumbers={false} />
          <div className="absolute right-2 top-2">
            <CopyButton value={value} message="Decoded JWT copied" variant="secondary" />
          </div>
        </div>
      ) : (
        <OutputBox value="" placeholder="Decoded header and payload" />
      )}
    </UtilityCard>
  );
}
