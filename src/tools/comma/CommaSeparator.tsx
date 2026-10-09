import { useEffect, useMemo } from 'react';
import { Split, Trash2 } from 'lucide-react';
import { Editor } from '../../components/editor/Editor';
import { CopyButton, IconButton, Panel, SegmentedControl, ToggleChip, ToolHeader } from '../../components/ui';
import { useSessionState } from '../../hooks/useSessionState';
import { generateCommaSeparated } from '../../utils/dataUtils';

type QuoteType = 'none' | 'single' | 'double';

export const CommaSeparator = () => {
  const [input, setInput] = useSessionState('comma-input', '');
  const [output, setOutput] = useSessionState('comma-output', '');
  const [quoteType, setQuoteType] = useSessionState<QuoteType>('comma-quote-type', 'none');
  const [removeDuplicates, setRemoveDuplicates] = useSessionState('comma-remove-duplicates', false);
  const [trimSpaces, setTrimSpaces] = useSessionState('comma-trim-spaces', true);

  // Live output whenever input or options change
  useEffect(() => {
    try {
      setOutput(generateCommaSeparated(input, { quoteType, removeDuplicates, trimSpaces }));
    } catch {
      // Keep the previous output on partial edits
    }
  }, [input, quoteType, removeDuplicates, trimSpaces, setOutput]);

  const itemCount = useMemo(() => (output ? output.split(',').filter((s) => s.trim()).length : 0), [output]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 md:p-6 lg:overflow-hidden">
      <ToolHeader
        icon={<Split />}
        title="Comma Separator"
        description="Turn lists separated by newlines, spaces or tabs into delimited values"
        actions={
          <>
            <SegmentedControl
              aria-label="Quote style"
              value={quoteType}
              onChange={setQuoteType}
              options={[
                { value: 'none', label: 'No quotes' },
                { value: 'single', label: "'Single'" },
                { value: 'double', label: '"Double"' },
              ]}
            />
            <ToggleChip checked={removeDuplicates} onChange={setRemoveDuplicates}>
              Unique
            </ToggleChip>
            <ToggleChip checked={trimSpaces} onChange={setTrimSpaces}>
              Trim spaces
            </ToggleChip>
          </>
        }
      />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Source list"
          meta="spaces, tabs or newlines"
          className="min-h-[300px]"
          actions={
            <IconButton label="Clear" size="sm" onClick={() => setInput('')} disabled={!input}>
              <Trash2 />
            </IconButton>
          }
        >
          <Editor
            value={input}
            onChange={setInput}
            placeholder={'1 2 3 4 5\nor\napple, banana, orange'}
            language="plaintext"
            path="comma-input"
          />
        </Panel>

        <Panel
          title="Delimited output"
          meta={
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-success" />
              {itemCount} item{itemCount === 1 ? '' : 's'}
            </span>
          }
          className="min-h-[300px]"
          actions={<CopyButton value={output} message="Output copied" label="Copy" variant="subtle" size="xs" disabled={!output} />}
        >
          <Editor value={output} readOnly language="plaintext" path="comma-output" />
        </Panel>
      </div>
    </div>
  );
};
