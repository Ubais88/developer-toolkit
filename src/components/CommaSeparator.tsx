import { useEffect } from 'react';
import { useSessionState } from '../hooks/useSessionState';
import { Editor } from './Editor';
import { Button } from './Button';
import { Copy, Trash2, SlidersHorizontal, ArrowRightLeft } from 'lucide-react';
import { generateCommaSeparated } from '../utils/dataUtils';

interface CommaSeparatorProps {
  onCopy: (text: string) => void;
}

export const CommaSeparator = ({ onCopy }: CommaSeparatorProps) => {
  const [input, setInput] = useSessionState('comma-input', '');
  const [output, setOutput] = useSessionState('comma-output', '');
  const [quoteType, setQuoteType] = useSessionState<'none' | 'single' | 'double'>('comma-quote-type', 'none');
  const [removeDuplicates, setRemoveDuplicates] = useSessionState('comma-remove-duplicates', false);
  const [trimSpaces, setTrimSpaces] = useSessionState('comma-trim-spaces', true);

  // Live output generation whenever inputs or configs change
  useEffect(() => {
    try {
      const result = generateCommaSeparated(input, {
        quoteType,
        removeDuplicates,
        trimSpaces,
      });
      setOutput(result);
    } catch (error) {
      // Keep previous output or clear silently on partial edits
    }
  }, [input, quoteType, removeDuplicates, trimSpaces, setOutput]);

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      onCopy('Output copied to clipboard');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    onCopy('Cleared input');
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Premium Toolbar */}
      <div className="flex-shrink-0 border-b border-border p-4 bg-card/40 backdrop-blur-sm z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Comma Separator Tool</h2>
            <p className="text-[10px] text-muted-foreground">Format text lists into delimited values dynamically</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quote Option */}
          <div className="flex items-center gap-1.5 bg-background border border-border px-2.5 py-1 rounded-lg">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground">Quotes:</span>
            <select
              value={quoteType}
              onChange={(e) => setQuoteType(e.target.value as 'none' | 'single' | 'double')}
              className="bg-transparent border-0 text-[11px] font-bold text-foreground focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="none" className="bg-card">None</option>
              <option value="single" className="bg-card">Single (')</option>
              <option value="double" className="bg-card">Double (")</option>
            </select>
          </div>

          {/* Toggle buttons */}
          <button
            onClick={() => setRemoveDuplicates(!removeDuplicates)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
              removeDuplicates
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                : 'border-border bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Unique List
          </button>

          <button
            onClick={() => setTrimSpaces(!trimSpaces)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
              trimSpaces
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                : 'border-border bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Trim Spaces
          </button>

          <span className="h-6 w-[1px] bg-border hidden sm:inline" />

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button onClick={handleCopy} variant="primary" size="none" className="px-3 h-8 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm" disabled={!output}>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </Button>
            <Button onClick={handleClear} variant="ghost" size="none" className="px-3 h-8 text-xs font-semibold border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/20 rounded-lg flex items-center gap-1.5" disabled={!input}>
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Input / Output Editors */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Input Card */}
        <div 
          className="bg-card border border-border overflow-hidden flex flex-col shadow-sm transition-all duration-300"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <div className="bg-muted/30 px-4 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Source List</span>
            <span className="text-[10px] text-muted-foreground font-mono">Supports spaces, tabs, or newlines</span>
          </div>
          <div className="flex-1 min-h-0 relative">
            <Editor
              value={input}
              onChange={setInput}
              placeholder="1 2 3 4 5&#10;or&#10;a b c d&#10;or&#10;apple, banana, orange"
              language="text"
              className="border-0 rounded-none h-full"
            />
          </div>
        </div>

        {/* Output Card */}
        <div 
          className="bg-card border border-border overflow-hidden flex flex-col shadow-sm transition-all duration-300 relative"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <div className="bg-muted/30 px-4 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Delimited Output</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-emerald-500 font-semibold">Live Preview</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            <Editor
              value={output}
              onChange={() => {}}
              readOnly
              language="text"
              className="border-0 rounded-none h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
