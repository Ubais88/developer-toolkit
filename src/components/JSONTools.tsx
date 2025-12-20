import { useState } from 'react';
import { Editor } from './Editor';
import { Button } from './Button';
import { Copy, FileJson, Minimize2, CheckCircle, XCircle } from 'lucide-react';
import { formatJSON, minifyJSON, validateJSON } from '../utils/jsonUtils';

interface JSONToolsProps {
  onCopy: (text: string) => void;
}

export const JSONTools = ({ onCopy }: JSONToolsProps) => {
  const [input, setInput] = useState('');
  const [validation, setValidation] = useState<{ valid: boolean; error?: string; line?: number } | null>(null);

  const handleFormat = () => {
    try {
      const formatted = formatJSON(input);
      setInput(formatted);
      onCopy('JSON formatted');
    } catch (error) {
      onCopy('Invalid JSON');
    }
  };

  const handleMinify = () => {
    try {
      const minified = minifyJSON(input);
      setInput(minified);
      onCopy('JSON minified');
    } catch (error) {
      onCopy('Invalid JSON');
    }
  };

  const handleValidate = () => {
    const result = validateJSON(input);
    setValidation(result);
  };

  const handleCopy = () => {
    if (input) {
      navigator.clipboard.writeText(input);
      onCopy('JSON copied to clipboard');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 shadow-sm z-10">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={handleFormat} variant="primary" size="sm">
            <FileJson className="w-4 h-4" />
            Format
          </Button>
          <Button onClick={handleMinify} variant="secondary" size="sm">
            <Minimize2 className="w-4 h-4" />
            Minify
          </Button>
          <Button onClick={handleValidate} variant="secondary" size="sm">
            {validation?.valid ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : validation?.valid === false ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Validate
          </Button>
          <Button onClick={handleCopy} variant="ghost" size="sm">
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        </div>

        {validation && (
          <div className={`mt-3 p-3 rounded-lg text-sm border ${
            validation.valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          }`}>
            {validation.valid ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Valid JSON</span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 mt-0.5" />
                <div>
                  <div className="font-semibold">Invalid JSON</div>
                  <div className="text-xs mt-1">{validation.error}</div>
                  {validation.line && <div className="text-xs mt-1">Line: {validation.line}</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 m-0 p-0">
        <Editor
          value={input}
          onChange={setInput}
          language="json"
          highlightError={validation?.line}
          className="border-0 rounded-none"
        />
      </div>
    </div>
  );
};
