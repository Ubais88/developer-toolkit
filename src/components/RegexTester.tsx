import { useState, useEffect } from 'react';
import { useSessionState } from '../hooks/useSessionState';
import { SearchCode, AlertCircle, Copy, Check, Play } from 'lucide-react';

interface MatchGroup {
    text: string;
    index: number;
    name?: string;
}

interface MatchResult {
    match: string;
    index: number;
    groups: MatchGroup[];
}

interface RegexTesterProps {
    onCopy: (text: string) => void;
}

export const RegexTester = ({ onCopy }: RegexTesterProps) => {
    const [pattern, setPattern] = useSessionState('regex-pattern', '(\\w+)\\s(\\d+)');
    const [testText, setTestText] = useSessionState('regex-test-text', 'hello 123\nworld 456\ntest 789');
    
    // Flags
    const [flagG, setFlagG] = useState(true);
    const [flagI, setFlagI] = useState(false);
    const [flagM, setFlagM] = useState(true);
    const [flagS, setFlagS] = useState(false);

    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Get active flags string
    const getFlagsString = () => {
        let f = '';
        if (flagG) f += 'g';
        if (flagI) f += 'i';
        if (flagM) f += 'm';
        if (flagS) f += 's';
        return f;
    };

    // Parse Regex and evaluate matches
    useEffect(() => {
        if (!pattern) {
            setMatches([]);
            setError(null);
            return;
        }

        try {
            setError(null);
            const flags = getFlagsString();
            const regex = new RegExp(pattern, flags);
            
            const results: MatchResult[] = [];
            
            if (flags.includes('g')) {
                let match;
                let lastIndex = -1;
                // Prevent infinite loop if regex matches empty string
                while ((match = regex.exec(testText)) !== null) {
                    if (regex.lastIndex === lastIndex) {
                        regex.lastIndex++;
                    }
                    lastIndex = regex.lastIndex;

                    const groups: MatchGroup[] = [];
                    for (let i = 1; i < match.length; i++) {
                        groups.push({
                            text: match[i],
                            index: i
                        });
                    }

                    results.push({
                        match: match[0],
                        index: match.index,
                        groups
                    });

                    if (regex.lastIndex === 0) break; // Safe break
                }
            } else {
                const match = regex.exec(testText);
                if (match) {
                    const groups: MatchGroup[] = [];
                    for (let i = 1; i < match.length; i++) {
                        groups.push({
                            text: match[i],
                            index: i
                        });
                    }
                    results.push({
                        match: match[0],
                        index: match.index,
                        groups
                    });
                }
            }
            
            setMatches(results);
        } catch (err: any) {
            setError(err.message || 'Invalid regular expression');
            setMatches([]);
        }
    }, [pattern, testText, flagG, flagI, flagM, flagS]);

    const handleCopyPattern = () => {
        const fullRegex = `/${pattern}/${getFlagsString()}`;
        navigator.clipboard.writeText(fullRegex);
        onCopy('Full Regex copied to clipboard');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Highlights matching segments inside testText
    const renderHighlightedText = () => {
        if (matches.length === 0 || error) {
            return <div className="whitespace-pre-wrap break-words text-muted-foreground">{testText || 'Type test text...'}</div>;
        }

        const elements: React.ReactNode[] = [];
        let lastIdx = 0;

        // Sort matches by index to render sequentially
        const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

        sortedMatches.forEach((m, idx) => {
            // Text before match
            if (m.index > lastIdx) {
                elements.push(testText.substring(lastIdx, m.index));
            }

            // The matched segment
            const matchLen = m.match.length;
            const matchText = testText.substring(m.index, m.index + matchLen);
            
            elements.push(
                <span 
                    key={`m-${idx}`} 
                    className="relative bg-primary/20 text-primary border-b border-primary font-semibold group cursor-pointer rounded px-0.5"
                    title={`Match ${idx + 1}: "${m.match}" (Index: ${m.index})`}
                >
                    {matchText}
                    {m.groups.length > 0 && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-card border border-border text-foreground text-[10px] py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                            {m.groups.map(g => `G${g.index}: ${g.text}`).join(' | ')}
                        </span>
                    )}
                </span>
            );

            lastIdx = m.index + matchLen;
        });

        // Remaining text after last match
        if (lastIdx < testText.length) {
            elements.push(testText.substring(lastIdx));
        }

        return <div className="whitespace-pre-wrap break-words leading-relaxed">{elements}</div>;
    };

    return (
        <div className="h-full w-full flex flex-col lg:flex-row bg-background overflow-hidden text-foreground font-sans transition-colors duration-150">
            
            {/* LEFT COLUMN - PATTERN & FLAGS */}
            <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-border transition-colors duration-150">
                
                {/* Header Strip */}
                <div className="h-14 flex items-center px-6 border-b border-border shrink-0 bg-background transition-colors duration-150">
                    <div className="flex items-center gap-2">
                        <SearchCode className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-semibold text-foreground tracking-wide">Regex Builder</h2>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-px bg-muted/10">
                    
                    {/* Pattern Input Area */}
                    <div className="flex flex-col bg-card/60 p-6 pb-5 border-b border-border transition-colors duration-150">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Regular Expression</label>
                            <button
                                onClick={handleCopyPattern}
                                className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground font-semibold transition-colors"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>Copy Expression</span>
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2.5 focus-within:ring-1 focus-within:ring-primary transition-all shadow-sm">
                            <span className="text-muted-foreground font-mono text-base select-none">/</span>
                            <input
                                type="text"
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                                className="flex-1 bg-transparent border-none focus:ring-0 p-0 font-mono text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
                                placeholder="Enter regex pattern (e.g., [a-zA-Z]+)"
                                spellCheck={false}
                            />
                            <span className="text-muted-foreground font-mono text-base select-none">/</span>
                            <span className="text-primary font-mono text-sm font-bold tracking-wider select-none">{getFlagsString() || '-'}</span>
                        </div>

                        {error && (
                            <div className="mt-3 flex items-start gap-2 text-rose-500 text-xs bg-rose-500/10 p-2.5 rounded-md border border-rose-500/20">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span className="font-mono text-[11px] leading-relaxed break-all">{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Flags Panel */}
                    <div className="flex flex-col bg-card/60 p-6 pb-4 border-b border-border transition-colors duration-150">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3.5">Regex Flags</label>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                                onClick={() => setFlagG(!flagG)}
                                className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all ${
                                    flagG ? 'bg-primary/5 border-primary/30 text-foreground' : 'bg-card border-border hover:border-muted-foreground/30 text-muted-foreground'
                                }`}
                            >
                                <span className="text-xs font-bold font-mono">g (global)</span>
                                <span className="text-[10px] leading-normal opacity-80">Find all matches</span>
                            </button>

                            <button
                                onClick={() => setFlagI(!flagI)}
                                className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all ${
                                    flagI ? 'bg-primary/5 border-primary/30 text-foreground' : 'bg-card border-border hover:border-muted-foreground/30 text-muted-foreground'
                                }`}
                            >
                                <span className="text-xs font-bold font-mono">i (insensitive)</span>
                                <span className="text-[10px] leading-normal opacity-80">Case-insensitive matching</span>
                            </button>

                            <button
                                onClick={() => setFlagM(!flagM)}
                                className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all ${
                                    flagM ? 'bg-primary/5 border-primary/30 text-foreground' : 'bg-card border-border hover:border-muted-foreground/30 text-muted-foreground'
                                }`}
                            >
                                <span className="text-xs font-bold font-mono">m (multiline)</span>
                                <span className="text-[10px] leading-normal opacity-80">^ and $ match lines</span>
                            </button>

                            <button
                                onClick={() => setFlagS(!flagS)}
                                className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all ${
                                    flagS ? 'bg-primary/5 border-primary/30 text-foreground' : 'bg-card border-border hover:border-muted-foreground/30 text-muted-foreground'
                                }`}
                            >
                                <span className="text-xs font-bold font-mono">s (single line)</span>
                                <span className="text-[10px] leading-normal opacity-80">Dot matches newline</span>
                            </button>
                        </div>
                    </div>

                    {/* Test Text Workspace */}
                    <div className="flex flex-col flex-1 bg-card/60 p-6 transition-colors duration-150">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Test String</label>
                        <div className="flex-1 min-h-[200px] relative">
                            <textarea
                                value={testText}
                                onChange={(e) => setTestText(e.target.value)}
                                className="w-full h-full bg-card border border-border rounded-lg p-4 font-mono text-[13px] text-foreground focus:ring-1 focus:ring-primary outline-none resize-none transition-all placeholder:text-muted-foreground shadow-sm leading-relaxed"
                                placeholder="Insert text to test your regular expression against..."
                                spellCheck={false}
                            />
                        </div>
                    </div>

                </div>
            </div>

            {/* RIGHT COLUMN - VISUAL HIGHLIGHT & MATCH DETAILS */}
            <div className="w-full lg:w-1/2 flex flex-col bg-background relative transition-colors duration-150">
                
                {/* Header Strip with Actions */}
                <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0 bg-background transition-colors duration-150">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                        <h2 className="text-sm font-semibold text-foreground tracking-wide">Matches & Analysis</h2>
                    </div>
                </div>

                <div className="flex-1 p-6 flex flex-col min-h-0 relative overflow-hidden">
                    {/* Top Static Content Area - Highlighted Output Preview */}
                    <div className="flex-shrink-0 flex flex-col min-h-0 max-h-[45%]">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Match Highlights</label>
                        <div className="flex-1 overflow-y-auto no-scrollbar border border-border bg-card rounded-xl p-5 shadow-sm font-mono text-[13.5px]">
                            {renderHighlightedText()}
                        </div>
                    </div>

                    {/* Matches List - Expands to occupy full remaining height */}
                    <div className="flex-1 flex flex-col min-h-0 mt-6 pt-5 border-t border-border overflow-hidden">
                        <div className="flex items-center justify-between mb-3 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <Play className="w-4 h-4 text-primary" />
                                <h3 className="text-xs font-bold text-foreground">Match List ({matches.length})</h3>
                            </div>
                        </div>

                        {matches.length > 0 ? (
                            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-3">
                                {matches.map((item, idx) => (
                                    <div key={idx} className="bg-card border border-border p-3.5 rounded-xl shadow-sm flex flex-col gap-2 relative group hover:border-primary/30 transition-all flex-shrink-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Match {idx + 1}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">index: {item.index}</span>
                                                </div>
                                                <div className="text-[13px] text-foreground font-semibold truncate block font-mono bg-muted/20 p-2 rounded border border-border mt-1.5">
                                                    {item.match}
                                                </div>
                                                
                                                {item.groups.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-border/60 space-y-1">
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Capture Groups</span>
                                                        {item.groups.map((g, gIdx) => (
                                                            <div key={gIdx} className="flex items-center gap-2 text-xs font-mono">
                                                                <span className="text-muted-foreground">Group {g.index}:</span>
                                                                <span className="text-foreground bg-primary/5 border border-primary/10 px-1 rounded truncate">{g.text || '""'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-xl p-6 text-center text-xs text-muted-foreground italic">
                                No regex matches found in test string.
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
};
