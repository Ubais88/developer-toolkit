import { useSessionState } from '../hooks/useSessionState';
import { Editor } from './Editor';
import { Button } from './Button';
import { Copy, FileJson, Minimize2, CheckCircle } from 'lucide-react';
import { formatJSON, minifyJSON, validateJSON } from '../utils/jsonUtils';

interface JSONToolsProps {
  onCopy: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const JSONTools = ({ onCopy }: JSONToolsProps) => {
  const [input, setInput] = useSessionState('json-tools-input', '');

  const handleFormat = () => {
    try {
      const formatted = formatJSON(input);
      setInput(formatted);
      onCopy('JSON formatted', 'success');
    } catch (error) {
      onCopy('Invalid JSON', 'error');
    }
  };

  const handleMinify = () => {
    try {
      const minified = minifyJSON(input);
      setInput(minified);
      onCopy('JSON minified', 'success');
    } catch (error) {
      onCopy('Invalid JSON', 'error');
    }
  };

  const handleValidate = () => {
    const result = validateJSON(input);
    if (result.valid) {
      onCopy('Valid JSON', 'success');
    } else {
      onCopy(`Invalid JSON: ${result.error}${result.line ? ` (Line ${result.line})` : ''}`, 'error');
    }
  };

  const handleCopy = () => {
    if (input) {
      navigator.clipboard.writeText(input);
      onCopy('JSON copied to clipboard', 'success');
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
            <CheckCircle className="w-4 h-4" />
            Validate
          </Button>
          <Button onClick={handleCopy} variant="ghost" size="sm">
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 m-0 p-0">
        <Editor
          value={input}
          onChange={setInput}
          language="json"
          className="border-0 rounded-none"
        />
      </div>
    </div>
  );
};
