import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CaseSensitive, Clock, Code, ListOrdered } from 'lucide-react';
import { CopyButton, Input, SegmentedControl, Textarea, ToggleChip } from '../../components/ui';
import { useSessionState } from '../../hooks/useSessionState';
import { formatRelative } from '../../lib/time';
import { convertCase, dateToTimestamp, escapeString, generateCommaSeparated, timestampToDate, unescapeString, type CaseType } from '../../utils/dataUtils';
import { OutputBox, UtilityCard } from './UtilityCard';

export function TextTools({ highlight }: { highlight: string | null }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <EscapeCard highlighted={highlight === 'escape'} />
      <CaseCard highlighted={highlight === 'case'} />
      <DelimiterCard highlighted={highlight === 'delimiter'} />
      <EpochCard highlighted={highlight === 'epoch'} />
    </div>
  );
}

function EscapeCard({ highlighted }: { highlighted: boolean }) {
  const [input, setInput] = useSessionState('data-escape-input', '');
  const [type, setType] = useSessionState<'sql' | 'json'>('data-escape-type', 'sql');
  const [direction, setDirection] = useSessionState<'escape' | 'unescape'>('data-escape-direction', 'escape');
  const output = useMemo(
    () => (input ? (direction === 'escape' ? escapeString(input, type) : unescapeString(input, type)) : ''),
    [input, type, direction],
  );

  return (
    <UtilityCard
      id="escape"
      icon={<Code />}
      title="Escape / unescape"
      description="String literals for SQL or JSON"
      highlighted={highlighted}
      actions={
        <SegmentedControl
          aria-label="Format"
          value={type}
          onChange={setType}
          options={[
            { value: 'sql', label: 'SQL' },
            { value: 'json', label: 'JSON' },
          ]}
        />
      }
    >
      <SegmentedControl
        aria-label="Direction"
        value={direction}
        onChange={setDirection}
        options={[
          { value: 'escape', label: 'Escape' },
          { value: 'unescape', label: 'Unescape' },
        ]}
      />
      <Textarea mono value={input} onChange={(e) => setInput(e.target.value)} aria-label="String" placeholder={`It's a "quoted"\nstring`} className="h-24 text-xs" />
      <OutputBox value={output} placeholder="Result" copy={<CopyButton value={output} message="Copied" />} />
    </UtilityCard>
  );
}

const CASES: { type: CaseType; label: string }[] = [
  { type: 'camel', label: 'camelCase' },
  { type: 'pascal', label: 'PascalCase' },
  { type: 'snake', label: 'snake_case' },
  { type: 'constant', label: 'CONSTANT_CASE' },
  { type: 'kebab', label: 'kebab-case' },
  { type: 'dot', label: 'dot.case' },
  { type: 'title', label: 'Title Case' },
  { type: 'upper', label: 'UPPERCASE' },
  { type: 'lower', label: 'lowercase' },
];

function CaseCard({ highlighted }: { highlighted: boolean }) {
  const [input, setInput] = useSessionState('data-case-input', '');

  return (
    <UtilityCard id="case" icon={<CaseSensitive />} title="Case converter" description="Every case at once — click to copy" highlighted={highlighted}>
      <Input mono value={input} onChange={(e) => setInput(e.target.value)} aria-label="Text" placeholder="user account id" />
      <ul className="grid gap-1 sm:grid-cols-2">
        {CASES.map(({ type, label }, i) => {
          const value = input ? convertCase(input, type) : '';
          return (
            <motion.li
              key={type}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: i * 0.02 } }}
              className="group flex min-w-0 items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface-2 py-1 pl-2.5 pr-1"
            >
              <div className="min-w-0">
                <div className="text-2xs text-muted-foreground">{label}</div>
                <div className="truncate font-mono text-xs text-foreground">{value || <span className="text-muted-foreground/50">—</span>}</div>
              </div>
              {value && <CopyButton value={value} message={`${label} copied`} className="opacity-50 group-hover:opacity-100" />}
            </motion.li>
          );
        })}
      </ul>
    </UtilityCard>
  );
}

function DelimiterCard({ highlighted }: { highlighted: boolean }) {
  const [input, setInput] = useSessionState('data-delim-input', '');
  const [quote, setQuote] = useSessionState<'none' | 'single' | 'double'>('data-delim-quote', 'none');
  const [dups, setDups] = useSessionState<boolean>('data-delim-dups', false);
  const [trim, setTrim] = useSessionState<boolean>('data-delim-trim', true);
  const output = useMemo(
    () => (input ? generateCommaSeparated(input, { quoteType: quote, removeDuplicates: dups, trimSpaces: trim }) : ''),
    [input, quote, dups, trim],
  );

  return (
    <UtilityCard
      id="delimiter"
      icon={<ListOrdered />}
      title="List delimiter"
      description="Join lines into one delimited list"
      highlighted={highlighted}
      fullTool={{ to: '/comma', label: 'Full tool' }}
    >
      <div className="flex flex-wrap gap-2">
        <SegmentedControl
          aria-label="Quotes"
          value={quote}
          onChange={setQuote}
          options={[
            { value: 'none', label: 'None' },
            { value: 'single', label: "'" },
            { value: 'double', label: '"' },
          ]}
        />
        <ToggleChip checked={dups} onChange={setDups}>
          Unique
        </ToggleChip>
        <ToggleChip checked={trim} onChange={setTrim}>
          Trim
        </ToggleChip>
      </div>
      <Textarea mono value={input} onChange={(e) => setInput(e.target.value)} aria-label="List" placeholder={'apple\nbanana\ncherry'} className="h-24 text-xs" />
      <OutputBox value={output} placeholder="apple,banana,cherry" copy={<CopyButton value={output} message="List copied" />} />
    </UtilityCard>
  );
}

function EpochCard({ highlighted }: { highlighted: boolean }) {
  const [tsInput, setTsInput] = useSessionState('data-timestamp-input', '');
  const [dateInput, setDateInput] = useSessionState('data-date-input', '');

  const fromTs = useMemo(() => {
    if (!tsInput.trim()) return { value: '', hint: '', error: null };
    try {
      const iso = timestampToDate(tsInput);
      return { value: iso, hint: formatRelative(new Date(iso).getTime()), error: null };
    } catch {
      return { value: '', hint: '', error: 'Not a valid epoch timestamp' };
    }
  }, [tsInput]);

  const fromDate = useMemo(() => {
    if (!dateInput.trim()) return { value: '', error: null };
    try {
      const ms = dateToTimestamp(dateInput);
      return { value: `${Math.floor(ms / 1000)}  ·  ${ms} ms`, seconds: String(Math.floor(ms / 1000)), error: null };
    } catch {
      return { value: '', error: 'Not a recognisable date' };
    }
  }, [dateInput]);

  return (
    <UtilityCard
      id="epoch"
      icon={<Clock />}
      title="Epoch converter"
      description="Seconds or milliseconds, auto-detected"
      highlighted={highlighted}
      fullTool={{ to: '/time', label: 'Timezones & more' }}
    >
      <div className="space-y-1.5">
        <span className="label-caps">Epoch → date</span>
        <Input mono value={tsInput} onChange={(e) => setTsInput(e.target.value)} aria-label="Epoch timestamp" placeholder={String(Math.floor(Date.now() / 1000))} />
        <OutputBox
          value={fromTs.value && `${fromTs.value}   (${fromTs.hint})`}
          error={fromTs.error}
          placeholder="ISO 8601"
          copy={<CopyButton value={fromTs.value} message="Date copied" />}
        />
      </div>
      <div className="space-y-1.5">
        <span className="label-caps">Date → epoch</span>
        <Input mono value={dateInput} onChange={(e) => setDateInput(e.target.value)} aria-label="Date" placeholder={new Date().toISOString()} />
        <OutputBox
          value={fromDate.value}
          error={fromDate.error}
          placeholder="Unix seconds · milliseconds"
          copy={<CopyButton value={'seconds' in fromDate ? (fromDate.seconds ?? '') : ''} message="Seconds copied" />}
        />
      </div>
    </UtilityCard>
  );
}
