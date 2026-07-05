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
      onCopy('Formatting failed');
    }
  };

  const handleUppercase = () => {
    const formatted = uppercaseSQL(input);
    setInput(formatted);
  };

  const handleLowercase = () => {
    const formatted = lowercaseSQL(input);
    setInput(formatted);
  };

  const handleRemoveComments = () => {
    const formatted = removeComments(input);
    setInput(formatted);
    onCopy('Comments removed');
  };

  const handleCopy = () => {
    if (input) {
      navigator.clipboard.writeText(input);
      onCopy('SQL copied to clipboard');
    }
  };

  const handleGenerateInClause = () => {
    const output = generateInClause(inClauseInput, inClauseQuoteType);
    setInClauseOutput(output);
  };

  const handleCopyInClause = () => {
    if (inClauseOutput) {
      navigator.clipboard.writeText(inClauseOutput);
      onCopy('IN clause copied to clipboard');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Action Toolbar */}
      <div className="flex-shrink-0 border-b border-border p-4 bg-card/40 backdrop-blur-sm z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">SQL Helper Utilities</h2>
            <p className="text-[10px] text-muted-foreground">Format queries, adjust keyword casing, and generate SQL IN clauses</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button onClick={handleFormat} variant="primary" size="none" className="px-3 h-8 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm">
            <FileCode className="w-3.5 h-3.5" />
            Format
          </Button>
          <Button onClick={handleUppercase} variant="secondary" size="none" className="px-3 h-8 text-xs font-semibold border border-border text-foreground hover:bg-muted/50 rounded-lg flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" />
            Uppercase
          </Button>
          <Button onClick={handleLowercase} variant="secondary" size="none" className="px-3 h-8 text-xs font-semibold border border-border text-foreground hover:bg-muted/50 rounded-lg flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" />
            Lowercase
          </Button>
          <Button onClick={handleRemoveComments} variant="secondary" size="none" className="px-3 h-8 text-xs font-semibold border border-border text-foreground hover:bg-muted/50 rounded-lg flex items-center gap-1.5">
            <Eraser className="w-3.5 h-3.5" />
            Strip Comments
          </Button>
          <Button onClick={handleCopy} variant="ghost" size="none" className="px-3 h-8 text-xs font-semibold border border-border text-muted-foreground rounded-lg flex items-center gap-1.5" disabled={!input}>
            <Copy className="w-3.5 h-3.5" />
            Copy Query
          </Button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* SQL Editor Area */}
        <div 
          className="lg:col-span-2 bg-card border border-border overflow-hidden flex flex-col shadow-sm"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <div className="bg-muted/30 px-4 py-2.5 border-b border-border flex items-center gap-2">
            <FileCode className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">SQL Query Workspace</span>
          </div>
          <div className="flex-1 min-h-0 relative">
            <Editor
              value={input}
              onChange={setInput}
              placeholder="Paste your raw SQL query here..."
              language="sql"
              className="border-0 rounded-none h-full"
            />
          </div>
        </div>

        {/* IN Clause Generator Sidebar Widget */}
        <div 
          className="bg-card border border-border p-5 shadow-sm space-y-4 flex flex-col justify-between"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2 pb-2.5 border-b border-border">
              <ListOrdered className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground">IN Clause Generator</h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Values (One per line)</label>
                <textarea
                  value={inClauseInput}
                  onChange={(e) => setInClauseInput(e.target.value)}
                  placeholder="value1&#10;value2&#10;value3"
                  className="w-full h-36 px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Quote Type</label>
                <select
                  value={inClauseQuoteType}
                  onChange={(e) => setInClauseQuoteType(e.target.value as 'none' | 'single' | 'double')}
                  className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="none">None</option>
                  <option value="single">Single Quote (')</option>
                  <option value="double">Double Quote (")</option>
                </select>
              </div>

              <Button onClick={handleGenerateInClause} variant="primary" size="sm" className="w-full">
                Generate Clause
              </Button>
            </div>
          </div>

          {inClauseOutput && (
            <div className="space-y-2 mt-4 pt-4 border-t border-border">
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Output IN Clause</label>
              <div className="p-3 bg-muted/20 border border-border rounded-lg min-h-16 relative">
                <code className="text-xs text-foreground font-mono break-all pr-8 block">{inClauseOutput}</code>
                <div className="absolute top-2 right-2">
                  <Button onClick={handleCopyInClause} variant="ghost" size="none" className="p-1 bg-card border border-border rounded hover:bg-muted">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
