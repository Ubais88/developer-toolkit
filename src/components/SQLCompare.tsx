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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 shadow-sm z-10">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={handleCompare} variant="primary" size="sm">
            <GitCompare className="w-4 h-4" />
            Compare & Format
          </Button>

          <div className="flex items-center gap-4 ml-4">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200">
              <input
                type="checkbox"
                checked={ignoreWhitespace}
                onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Ignore whitespace</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200">
              <input
                type="checkbox"
                checked={ignoreCase}
                onChange={(e) => setIgnoreCase(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Ignore case</span>
            </label>
          </div>
        </div>

        {result && (
          <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 border ${
            result.same
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          }`}>
            {result.same ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>SQL queries are identical</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>SQL queries differ</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 p-4">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b border-gray-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            SQL Query 1
          </div>
          <Editor
            value={sql1}
            onChange={setSql1}
            placeholder="Paste first SQL query..."
            language="sql"
            className="border-0 rounded-none"
          />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b border-gray-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            SQL Query 2
          </div>
          <Editor
            value={sql2}
            onChange={setSql2}
            placeholder="Paste second SQL query..."
            language="sql"
            className="border-0 rounded-none"
          />
        </div>
      </div>
    </div>
  );
};
