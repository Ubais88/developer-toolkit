import { useSessionState } from '../hooks/useSessionState';
import { Editor } from './Editor';
import { Button } from './Button';
import { Copy, FileCode, Type, Eraser, ListOrdered } from 'lucide-react';
import { formatSQL, uppercaseSQL, lowercaseSQL, removeComments, generateInClause } from '../utils/sqlUtils';

interface SQLHelperProps {
  onCopy: (text: string) => void;
}

export const SQLHelper = ({ onCopy }: SQLHelperProps) => {
  const [input, setInput] = useSessionState('sql-helper-input', '');
  const [inClauseInput, setInClauseInput] = useSessionState('sql-helper-in-clause-input', '');
  const [inClauseOutput, setInClauseOutput] = useSessionState('sql-helper-in-clause-output', '');
  const [inClauseQuoteType, setInClauseQuoteType] = useSessionState<'none' | 'single' | 'double'>('sql-helper-quote-type', 'single');

  const handleFormat = () => {
    try {
      const formatted = formatSQL(input);
      setInput(formatted);
      onCopy('SQL formatted');
    } catch (error) {
      onCopy('');
    }
  };

  const handleUppercase = () => {
    const result = uppercaseSQL(input);
    setInput(result);
    onCopy('Keywords uppercased');
  };

  const handleLowercase = () => {
    const result = lowercaseSQL(input);
    setInput(result);
    onCopy('Keywords lowercased');
  };

  const handleRemoveComments = () => {
    const result = removeComments(input);
    setInput(result);
    onCopy('Comments removed');
  };

  const handleCopy = () => {
    if (input) {
      navigator.clipboard.writeText(input);
      onCopy('SQL copied to clipboard');
    }
  };

  const handleGenerateInClause = () => {
    const result = generateInClause(inClauseInput, inClauseQuoteType);
    setInClauseOutput(result);
  };

  const handleCopyInClause = () => {
    if (inClauseOutput) {
      navigator.clipboard.writeText(inClauseOutput);
      onCopy('IN clause copied to clipboard');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 shadow-sm z-10">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={handleFormat} variant="primary" size="sm">
            <FileCode className="w-4 h-4" />
            Format
          </Button>
          <Button onClick={handleUppercase} variant="secondary" size="sm">
            <Type className="w-4 h-4" />
            Uppercase
          </Button>
          <Button onClick={handleLowercase} variant="secondary" size="sm">
            <Type className="w-4 h-4" />
            Lowercase
          </Button>
          <Button onClick={handleRemoveComments} variant="secondary" size="sm">
            <Eraser className="w-4 h-4" />
            Remove Comments
          </Button>
          <Button onClick={handleCopy} variant="ghost" size="sm">
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-3 gap-4 p-4">
        <div className="col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b border-gray-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            SQL Editor
          </div>
          <Editor
            value={input}
            onChange={setInput}
            placeholder="Paste your SQL query here..."
            language="sql"
            className="border-0 rounded-none"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ListOrdered className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">IN Clause Generator</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">Values (one per line)</label>
                <textarea
                  value={inClauseInput}
                  onChange={(e) => setInClauseInput(e.target.value)}
                  placeholder="value1&#10;value2&#10;value3"
                  className="w-full h-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">Quote type</label>
                <select
                  value={inClauseQuoteType}
                  onChange={(e) => setInClauseQuoteType(e.target.value as 'none' | 'single' | 'double')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">None</option>
                  <option value="single">Single (')</option>
                  <option value="double">Double (")</option>
                </select>
              </div>

              <Button onClick={handleGenerateInClause} variant="primary" size="sm" className="w-full">
                Generate
              </Button>

              {inClauseOutput && (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg">
                    <code className="text-xs text-slate-700 dark:text-slate-300 break-all">{inClauseOutput}</code>
                  </div>
                  <Button onClick={handleCopyInClause} variant="ghost" size="sm" className="w-full">
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
