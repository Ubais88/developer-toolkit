import { useState } from 'react';
import { Editor } from './Editor';
import { Button } from './Button';
import { Copy, Wand2 } from 'lucide-react';
import { generateCommaSeparated } from '../utils/dataUtils';

interface CommaSeparatorProps {
  onCopy: (text: string) => void;
}

export const CommaSeparator = ({ onCopy }: CommaSeparatorProps) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [quoteType, setQuoteType] = useState<'none' | 'single' | 'double'>('none');
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [trimSpaces, setTrimSpaces] = useState(true);

  const handleGenerate = () => {
    try {
      const result = generateCommaSeparated(input, {
        quoteType,
        removeDuplicates,
        trimSpaces,
      });
      setOutput(result);
    } catch (error) {
      onCopy('Generation failed');
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      onCopy('Output copied to clipboard');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 shadow-sm z-10">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={handleGenerate} variant="primary" size="sm">
            <Wand2 className="w-4 h-4" />
            Generate
          </Button>
          <Button onClick={handleCopy} variant="ghost" size="sm" disabled={!output}>
            <Copy className="w-4 h-4" />
            Copy Output
          </Button>

          <div className="flex items-center gap-4 ml-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Quote type:</span>
              <select
                value={quoteType}
                onChange={(e) => setQuoteType(e.target.value as 'none' | 'single' | 'double')}
                className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="none">None</option>
                <option value="single">Single (')</option>
                <option value="double">Double (")</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200">
              <input
                type="checkbox"
                checked={removeDuplicates}
                onChange={(e) => setRemoveDuplicates(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Remove duplicates</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200">
              <input
                type="checkbox"
                checked={trimSpaces}
                onChange={(e) => setTrimSpaces(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Trim spaces</span>
            </label>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Input supports space, newline, or comma-separated values
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 p-4">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b border-gray-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Input
          </div>
          <Editor
            value={input}
            onChange={setInput}
            placeholder="1 2 3 4 5&#10;or&#10;a b c d&#10;or&#10;apple,banana,orange"
            language="text"
            className="border-0 rounded-none"
          />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b border-gray-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Output
          </div>
          <Editor
            value={output}
            onChange={() => {}}
            readOnly
            language="text"
            className="border-0 rounded-none"
          />
        </div>
      </div>
    </div>
  );
};
