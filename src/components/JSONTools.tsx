import { useSessionState } from '../hooks/useSessionState';
import { Editor } from './Editor';
import { Button } from './Button';
import { Copy, Minimize2, CheckCircle, Wand2 } from 'lucide-react';
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
    <div className="flex flex-col h-full relative group">
      {/* Floating Toolbar */}
      <div className="absolute top-4 right-6 z-20 flex gap-2 p-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-opacity opacity-100">
        <Button onClick={handleFormat} variant="ghost" size="sm" title="Format JSON" className="gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Format</span>
        </Button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto"></div>
        <Button onClick={handleMinify} variant="ghost" size="sm" title="Minify JSON">
          <Minimize2 className="w-4 h-4" />
        </Button>
        <Button onClick={handleValidate} variant="ghost" size="sm" title="Validate JSON">
          <CheckCircle className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto"></div>
        <Button onClick={handleCopy} variant="primary" size="sm" className="shadow-none">
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">Copy</span>
        </Button>
      </div>

      <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden">
        <Editor
          value={input}
          onChange={setInput}
          language="json"
          className="h-full font-mono text-sm"
        />
      </div>
    </div>
  );
};
