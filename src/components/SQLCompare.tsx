import { useState } from 'react';
import { useSessionState } from '../hooks/useSessionState';
import { Editor } from './Editor';
import { Button } from './Button';
import { FileCode, GitCompare, CheckCircle, XCircle } from 'lucide-react';
import { compareSQL } from '../utils/sqlUtils';

interface SQLCompareProps {
  onCopy: (text: string) => void;
}

export const SQLCompare = ({ onCopy }: SQLCompareProps) => {
  const [sql1, setSql1] = useSessionState('sql-compare-sql1', '');
  const [sql2, setSql2] = useSessionState('sql-compare-sql2', '');
  const [ignoreWhitespace, setIgnoreWhitespace] = useSessionState('sql-compare-ignore-whitespace', true);
  const [ignoreCase, setIgnoreCase] = useSessionState('sql-compare-ignore-case', true);
  const [result, setResult] = useState<{ same: boolean; formatted1: string; formatted2: string } | null>(null);

  const handleCompare = () => {
    try {
      const comparison = compareSQL(sql1, sql2, ignoreWhitespace, ignoreCase);
      setResult(comparison);
      setSql1(comparison.formatted1);
      setSql2(comparison.formatted2);
      onCopy(comparison.same ? 'SQL queries are identical' : 'SQL queries differ');
    } catch (error) {
      onCopy('Comparison failed');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Action Toolbar */}
      <div className="flex-shrink-0 border-b border-border p-4 bg-card/40 backdrop-blur-sm z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">SQL Difference Compare</h2>
            <p className="text-[10px] text-muted-foreground">Compare structures and highlight casing/formatting variations</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Ignorance Chips */}
          <button
            onClick={() => setIgnoreWhitespace(!ignoreWhitespace)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
              ignoreWhitespace
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                : 'border-border bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Ignore Whitespace
          </button>

          <button
            onClick={() => setIgnoreCase(!ignoreCase)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
              ignoreCase
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                : 'border-border bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Ignore Case
          </button>

          <span className="h-6 w-[1px] bg-border hidden sm:inline" />

          <Button onClick={handleCompare} variant="primary" size="none" className="px-3 h-8 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm">
            <GitCompare className="w-3.5 h-3.5" />
            Compare Queries
          </Button>
        </div>
      </div>

      {result && (
        <div className="px-4 pt-4">
          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            result.same
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}>
            {result.same ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold">SQL queries are identical</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                <span className="font-semibold">SQL queries differ</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Editor Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Editor 1 */}
        <div 
          className="bg-card border border-border overflow-hidden flex flex-col shadow-sm"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <div className="bg-muted/30 px-4 py-2.5 border-b border-border flex items-center gap-2">
            <FileCode className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">SQL Query 1</span>
          </div>
          <div className="flex-1 min-h-0 relative">
            <Editor
              value={sql1}
              onChange={setSql1}
              placeholder="Paste first SQL query..."
              language="sql"
              className="border-0 rounded-none h-full"
            />
          </div>
        </div>

        {/* Editor 2 */}
        <div 
          className="bg-card border border-border overflow-hidden flex flex-col shadow-sm"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <div className="bg-muted/30 px-4 py-2.5 border-b border-border flex items-center gap-2">
            <FileCode className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">SQL Query 2</span>
          </div>
          <div className="flex-1 min-h-0 relative">
            <Editor
              value={sql2}
              onChange={setSql2}
              placeholder="Paste second SQL query..."
              language="sql"
              className="border-0 rounded-none h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
