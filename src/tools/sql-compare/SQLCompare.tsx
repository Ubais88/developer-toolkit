import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Columns2, Database, FileDiff, GitCompare, XCircle } from 'lucide-react';
import { DiffEditor } from '../../components/editor/DiffEditor';
import { Editor } from '../../components/editor/Editor';
import { Button, Panel, SegmentedControl, ToggleChip, ToolHeader, cn } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useSessionState } from '../../hooks/useSessionState';
import { compareSQL } from '../../utils/sqlUtils';

type View = 'edit' | 'diff';

export const SQLCompare = () => {
  const toast = useToast();
  const [sql1, setSql1] = useSessionState('sql-compare-sql1', '');
  const [sql2, setSql2] = useSessionState('sql-compare-sql2', '');
  const [ignoreWhitespace, setIgnoreWhitespace] = useSessionState('sql-compare-ignore-whitespace', true);
  const [ignoreCase, setIgnoreCase] = useSessionState('sql-compare-ignore-case', true);
  const [result, setResult] = useState<{ same: boolean; formatted1: string; formatted2: string } | null>(null);
  const [view, setView] = useState<View>('edit');

  const handleCompare = () => {
    if (!sql1.trim() || !sql2.trim()) {
      toast.info('Paste both queries to compare');
      return;
    }
    try {
      const comparison = compareSQL(sql1, sql2, ignoreWhitespace, ignoreCase);
      setResult(comparison);
      setSql1(comparison.formatted1);
      setSql2(comparison.formatted2);
      if (!comparison.same) setView('diff');
    } catch {
      toast.error('Comparison failed');
    }
  };

  const invalidate = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setResult(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 md:p-6 lg:overflow-hidden">
      <ToolHeader
        icon={<Database />}
        title="SQL Compare"
        description="Normalise two queries and see exactly where they differ"
        actions={
          <>
            <ToggleChip checked={ignoreWhitespace} onChange={invalidate(setIgnoreWhitespace)}>
              Ignore whitespace
            </ToggleChip>
            <ToggleChip checked={ignoreCase} onChange={invalidate(setIgnoreCase)}>
              Ignore case
            </ToggleChip>
            <Button size="sm" onClick={handleCompare}>
              <GitCompare className="h-3.5 w-3.5" />
              Compare
            </Button>
          </>
        }
      />

      <AnimatePresence initial={false}>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 overflow-hidden"
          >
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-13',
                result.same ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive',
              )}
            >
              <span className="flex items-center gap-2 font-medium">
                {result.same ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {result.same ? 'Queries are identical' : 'Queries differ'}
                <span className="font-normal opacity-70">
                  {[ignoreWhitespace && 'ignoring whitespace', ignoreCase && 'ignoring case'].filter(Boolean).join(', ')}
                </span>
              </span>
              <SegmentedControl
                aria-label="View"
                value={view}
                onChange={setView}
                options={[
                  { value: 'edit', label: 'Edit', icon: <Columns2 /> },
                  { value: 'diff', label: 'Diff', icon: <FileDiff /> },
                ]}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {result && view === 'diff' ? (
        <Panel title="Differences" meta="formatted" className="min-h-[360px] flex-1">
          <DiffEditor original={result.formatted1} modified={result.formatted2} language="sql" readOnly ignoreTrimWhitespace={ignoreWhitespace} />
        </Panel>
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
          <Panel title="Query A" className="min-h-[300px]">
            <Editor value={sql1} onChange={invalidate(setSql1)} language="sql" path="sql-compare-a" placeholder="Paste the first query…" />
          </Panel>
          <Panel title="Query B" className="min-h-[300px]">
            <Editor value={sql2} onChange={invalidate(setSql2)} language="sql" path="sql-compare-b" placeholder="Paste the second query…" />
          </Panel>
        </div>
      )}
    </div>
  );
};
