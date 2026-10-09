import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Fingerprint, Hash, RefreshCw, Type } from 'lucide-react';
import { Button, CopyButton, Input, SegmentedControl, Textarea, ToggleChip } from '../../components/ui';
import { useSessionState } from '../../hooks/useSessionState';
import { generateHash, generateLoremIpsum, generateUUID, type HashAlgorithm } from '../../utils/dataUtils';
import { generateUUIDv7 } from '../url-modifier/urlLogic';
import { OutputBox, UtilityCard } from './UtilityCard';

export function Generators({ highlight }: { highlight: string | null }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <UuidCard highlighted={highlight === 'uuid'} />
      <HashCard highlighted={highlight === 'hash'} />
      <LoremCard highlighted={highlight === 'lorem'} className="xl:col-span-2" />
    </div>
  );
}

function UuidCard({ highlighted }: { highlighted: boolean }) {
  const [uuids, setUuids] = useSessionState<string[]>('data-uuids', []);
  const [version, setVersion] = useSessionState<'v4' | 'v7'>('data-uuid-version', 'v4');
  const [count, setCount] = useSessionState<'1' | '5' | '10' | '25'>('data-uuid-count', '5');
  const [upper, setUpper] = useSessionState('data-uuid-upper', false);

  const generate = () =>
    setUuids(Array.from({ length: Number(count) }, () => (version === 'v7' ? generateUUIDv7() : generateUUID())));

  const shown = uuids.map((u) => (upper ? u.toUpperCase() : u));

  return (
    <UtilityCard
      id="uuid"
      icon={<Fingerprint />}
      title="UUID generator"
      description="v4 random or v7 time-ordered"
      highlighted={highlighted}
      actions={shown.length > 1 && <CopyButton value={shown.join('\n')} message={`${shown.length} UUIDs copied`} label="Copy all" size="xs" />}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl aria-label="UUID version" value={version} onChange={setVersion} options={[{ value: 'v4', label: 'v4' }, { value: 'v7', label: 'v7' }]} />
        <SegmentedControl
          aria-label="How many"
          value={count}
          onChange={setCount}
          options={(['1', '5', '10', '25'] as const).map((n) => ({ value: n, label: `×${n}` }))}
        />
        <ToggleChip checked={upper} onChange={setUpper}>
          UPPER
        </ToggleChip>
        <Button size="sm" className="ml-auto" onClick={generate}>
          <RefreshCw className="h-3.5 w-3.5" />
          Generate
        </Button>
      </div>
      {shown.length ? (
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((u, i) => (
              <motion.li
                key={u}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.015 } }}
                exit={{ opacity: 0 }}
                className="group flex items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface-2 py-1 pl-3 pr-1 font-mono text-xs"
              >
                <span className="truncate">{u}</span>
                <CopyButton value={u} message="UUID copied" className="opacity-60 group-hover:opacity-100" />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <OutputBox value="" placeholder="Press Generate to create UUIDs" />
      )}
    </UtilityCard>
  );
}

const ALGOS: HashAlgorithm[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

function HashCard({ highlighted }: { highlighted: boolean }) {
  const [input, setInput] = useSessionState('data-hash-input', '');
  const [algo, setAlgo] = useSessionState<HashAlgorithm>('data-hash-algo', 'SHA-256');
  const [upper, setUpper] = useSessionState('data-hash-upper', false);
  const [hash, setHash] = useState('');

  // Hash live as you type
  useEffect(() => {
    let cancelled = false;
    if (!input) {
      setHash('');
      return;
    }
    generateHash(input, algo).then((h) => !cancelled && setHash(h));
    return () => {
      cancelled = true;
    };
  }, [input, algo]);

  const shown = upper ? hash.toUpperCase() : hash;

  return (
    <UtilityCard id="hash" icon={<Hash />} title="Hash generator" description="Computed locally with Web Crypto" highlighted={highlighted}>
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl aria-label="Algorithm" value={algo} onChange={setAlgo} options={ALGOS.map((a) => ({ value: a, label: a }))} />
        <ToggleChip checked={upper} onChange={setUpper}>
          UPPER
        </ToggleChip>
      </div>
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Text to hash…" aria-label="Text to hash" className="h-24 text-xs" mono />
      <OutputBox value={shown} placeholder={`${algo} digest`} copy={<CopyButton value={shown} message="Hash copied" />} />
    </UtilityCard>
  );
}

function LoremCard({ highlighted, className }: { highlighted: boolean; className?: string }) {
  const [count, setCount] = useSessionState('data-lorem-count', '3');
  const [type, setType] = useSessionState<'paragraphs' | 'sentences' | 'words'>('data-lorem-type', 'paragraphs');
  const [output, setOutput] = useSessionState('data-lorem-output', '');

  return (
    <UtilityCard
      id="lorem"
      icon={<Type />}
      title="Lorem ipsum"
      description="Placeholder copy for mockups"
      highlighted={highlighted}
      className={className}
      actions={output && <CopyButton value={output} message="Placeholder text copied" label="Copy" size="xs" />}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          aria-label="Count"
          className="h-8 w-20 text-center"
        />
        <SegmentedControl
          aria-label="Unit"
          value={type}
          onChange={setType}
          options={[
            { value: 'paragraphs', label: 'Paragraphs' },
            { value: 'sentences', label: 'Sentences' },
            { value: 'words', label: 'Words' },
          ]}
        />
        <Button size="sm" className="ml-auto" onClick={() => setOutput(generateLoremIpsum(Math.min(100, Math.max(1, parseInt(count) || 3)), type))}>
          <RefreshCw className="h-3.5 w-3.5" />
          Generate
        </Button>
      </div>
      <OutputBox value={output} mono={false} placeholder="Press Generate" className="max-h-64 overflow-y-auto text-13" />
    </UtilityCard>
  );
}
