import { useEffect, useMemo } from 'react';
import { CaseLower, CaseUpper, Eraser, FileCode, ListOrdered, Sparkles, Trash2 } from 'lucide-react';
import { Editor } from '../../components/editor/Editor';
import { Button, Card, CardHeader, CopyButton, Field, IconButton, Panel, SegmentedControl, Textarea, ToolHeader } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useSessionState } from '../../hooks/useSessionState';
import { formatSQL, generateInClause, lowercaseSQL, removeComments, uppercaseSQL } from '../../utils/sqlUtils';

type QuoteType = 'none' | 'single' | 'double';

export const SQLHelper = () => {
  const toast = useToast();
  const [input, setInput] = useSessionState('sql-helper-input', '');
  const [inClauseInput, setInClauseInput] = useSessionState('sql-helper-in-clause-input', '');
  const [inClauseOutput, setInClauseOutput] = useSessionState('sql-helper-in-clause-output', '');
  const [quoteType, setQuoteType] = useSessionState<QuoteType>('sql-helper-quote-type', 'single');

  // IN clause updates live as you type
  useEffect(() => {
    setInClauseOutput(inClauseInput.trim() ? generateInClause(inClauseInput, quoteType) : '');
  }, [inClauseInput, quoteType, setInClauseOutput]);

  const valueCount = useMemo(() => inClauseInput.split('\n').filter((l) => l.trim()).length, [inClauseInput]);
  const lineCount = input ? input.split('\n').length : 0;

  const apply = (fn: (sql: string) => string, message?: string) => {
    if (!input.trim()) {
      toast.info('Paste a query first');
      return;
    }
    try {
      setInput(fn(input));
      if (message) toast.success(message);
    } catch {
      toast.error('Could not process this query');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 md:p-6 lg:overflow-hidden">
      <ToolHeader
        icon={<FileCode />}
        title="SQL Helper"
        description="Format queries, change keyword case, strip comments and build IN clauses"
        actions={
          <>
            <Button size="sm" onClick={() => apply(formatSQL, 'SQL formatted')}>
              <Sparkles className="h-3.5 w-3.5" />
              Format
            </Button>
            <Button size="sm" variant="secondary" onClick={() => apply(uppercaseSQL)}>
              <CaseUpper className="h-3.5 w-3.5" />
              UPPER
            </Button>
            <Button size="sm" variant="secondary" onClick={() => apply(lowercaseSQL)}>
              <CaseLower className="h-3.5 w-3.5" />
              lower
            </Button>
            <Button size="sm" variant="secondary" onClick={() => apply(removeComments, 'Comments removed')}>
              <Eraser className="h-3.5 w-3.5" />
              Strip comments
            </Button>
          </>
        }
      />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_340px]">
        <Panel
          title="Query"
          meta={lineCount ? `${lineCount} line${lineCount === 1 ? '' : 's'}` : undefined}
          className="min-h-[320px]"
          actions={
            <>
              <CopyButton value={input} message="SQL copied" disabled={!input} />
              <IconButton label="Clear" size="sm" onClick={() => setInput('')} disabled={!input}>
                <Trash2 />
              </IconButton>
            </>
          }
        >
          <Editor value={input} onChange={setInput} language="sql" path="sql-helper" placeholder="Paste your SQL query here…" />
        </Panel>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader icon={<ListOrdered />} title="IN clause generator" description="One value per line" />
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <Field label="Values" hint={valueCount ? `${valueCount} value${valueCount === 1 ? '' : 's'}` : undefined}>
              <Textarea
                mono
                value={inClauseInput}
                onChange={(e) => setInClauseInput(e.target.value)}
                placeholder={'value1\nvalue2\nvalue3'}
                className="h-40 resize-none text-xs"
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <span className="label-caps">Quotes</span>
              <SegmentedControl
                aria-label="Quote style"
                value={quoteType}
                onChange={setQuoteType}
                className="w-full [&>button]:flex-1"
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'single', label: "'Single'" },
                  { value: 'double', label: '"Double"' },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="label-caps">Output</span>
                <CopyButton value={inClauseOutput} message="IN clause copied" disabled={!inClauseOutput} />
              </div>
              <div className="min-h-[72px] rounded-md border border-border bg-surface-2 p-3">
                {inClauseOutput ? (
                  <code className="block break-all font-mono text-xs leading-relaxed text-foreground">{inClauseOutput}</code>
                ) : (
                  <span className="text-xs text-muted-foreground">Your IN clause appears here</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
