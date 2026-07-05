import { useState, useEffect } from 'react';
import { useSessionState } from '../hooks/useSessionState';
import { Link as LinkIcon, Trash2, Plus, Info, RefreshCw, Copy, ExternalLink, AlertCircle, ArrowRight, History } from 'lucide-react';

interface Rule {
    id: string;
    find: string;
    replace: string;
    active: boolean;
}

interface HistoryItem {
    id: string;
    original: string;
    modified: string;
    timestamp: string;
}

interface URLModifierProps {
    onCopy: (text: string) => void;
}

export const URLModifier = ({ onCopy }: URLModifierProps) => {
    const [inputUrl, setInputUrl] = useSessionState('url-mod-input', '');
    const [outputUrl, setOutputUrl] = useSessionState('url-mod-output', '');
    const [rules, setRules] = useSessionState<Rule[]>('url-mod-rules', [
        { id: 'default-1', find: 'https://dc.biobrain.io', replace: 'http://localhost:5173', active: true },
        { id: 'default-2', find: 'https://bb-dc-app.azurewebsites.net', replace: 'http://localhost:5173', active: true }
    ]);
    const [history, setHistory] = useSessionState<HistoryItem[]>('url-mod-history', []);
    const [error, setError] = useState<string | null>(null);

    // Parsed states
    const [parsedProtocol, setParsedProtocol] = useState('');
    const [parsedHost, setParsedHost] = useState('');
    const [parsedPath, setParsedPath] = useState('');
    const [parsedParams, setParsedParams] = useState<{ key: string; val: string }[]>([]);

    useEffect(() => {
        if (!inputUrl) {
            setOutputUrl('');
            setError(null);
            return;
        }
        processUrl(inputUrl);
    }, [inputUrl, rules]);

    // Auto-save history after 1.2s of inactivity
    useEffect(() => {
        if (!inputUrl || !outputUrl || error) return;
        const handler = setTimeout(() => {
            addToHistory(inputUrl, outputUrl);
        }, 1200);
        return () => clearTimeout(handler);
    }, [inputUrl, outputUrl, error]);

    // Helper to generate UUID v7 (Timestamp-based)
    const generateUUIDv7 = () => {
        const timestamp = Date.now();
        const value = new Uint8Array(16);
        crypto.getRandomValues(value);

        value[0] = (timestamp / 0x10000000000) & 0xff;
        value[1] = (timestamp / 0x100000000) & 0xff;
        value[2] = (timestamp / 0x1000000) & 0xff;
        value[3] = (timestamp / 0x10000) & 0xff;
        value[4] = (timestamp / 0x100) & 0xff;
        value[5] = timestamp & 0xff;
        value[6] = (value[6] & 0x0f) | 0x70;
        value[8] = (value[8] & 0x3f) | 0x80;

        return [...value]
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
    };

    // Replace magic tokens with dynamic values
    const replaceMagicTokens = (val: string) => {
        const idTags = ['[#token#]', '[#ltid#]', '[#ltuid#]'];
        let result = val;
        idTags.forEach((tag) => {
            if (result.includes(tag)) {
                const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                result = result.replace(regex, () => generateUUIDv7());
            }
        });
        return result;
    };

    const processUrl = (urlStr: string) => {
        try {
            setError(null);
            let targetUrl = urlStr.trim();
            if (!targetUrl) return;

            // Simple validation prep
            if (!/^https?:\/\//i.test(targetUrl)) {
                targetUrl = 'http://' + targetUrl;
            }

            // Apply rules
            let modified = targetUrl;
            rules.forEach((r) => {
                if (r.active && r.find) {
                    modified = modified.split(r.find).join(r.replace);
                }
            });

            // Process tokens
            modified = replaceMagicTokens(modified);

            // Parse URL components
            const parsed = new URL(modified);
            setParsedProtocol(parsed.protocol);
            setParsedHost(parsed.host);
            setParsedPath(parsed.pathname);

            const params: { key: string; val: string }[] = [];
            parsed.searchParams.forEach((val, key) => {
                params.push({ key, val });
            });
            setParsedParams(params);
            setOutputUrl(modified);
        } catch (e) {
            setError('Invalid URL format. Please check protocol or domain structure.');
            setOutputUrl('');
        }
    };

    const addToHistory = (orig: string, mod: string) => {
        if (!orig || !mod) return;
        
        // Remove previous item with same original URL to avoid duplicates in the history
        const filtered = history.filter((h) => h.original !== orig);
        
        // Avoid adding if same original and modified is already at the top
        if (history.length > 0 && history[0].original === orig && history[0].modified === mod) return;

        const newItem: HistoryItem = {
            id: Date.now().toString(),
            original: orig,
            modified: mod,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        // Keep max 10 entries in history
        setHistory([newItem, ...filtered.slice(0, 9)]);
    };

    const handleParamChange = (index: number, newKey: string, newVal: string) => {
        try {
            // Update search params on outputUrl
            const urlObj = new URL(outputUrl);
            const params = Array.from(urlObj.searchParams.entries());
            
            urlObj.search = '';
            params.forEach(([k, v], idx) => {
                const finalKey = idx === index ? newKey : k;
                const finalVal = idx === index ? newVal : v;
                if (finalKey) {
                    urlObj.searchParams.append(finalKey, finalVal);
                }
            });

            const newOutput = urlObj.toString();
            setOutputUrl(newOutput);

            // Write back search params changes directly into inputUrl to keep editors synchronized
            try {
                const inputUrlObj = new URL(inputUrl);
                inputUrlObj.search = urlObj.search;
                setInputUrl(inputUrlObj.toString());
            } catch (err) {
                setInputUrl(newOutput);
            }
        } catch (e) {}
    };

    const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputUrl(e.target.value);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        setInputUrl(text);
    };

    const addRule = () => {
        const newRule: Rule = {
            id: Date.now().toString(),
            find: '',
            replace: '',
            active: true
        };
        setRules([...rules, newRule]);
    };

    const updateRule = (id: string, key: keyof Rule, val: any) => {
        setRules(rules.map((r) => (r.id === id ? { ...r, [key]: val } : r)));
    };

    const removeRule = (id: string) => {
        setRules(rules.filter((r) => r.id !== id));
    };

    const handleCopy = () => {
        if (outputUrl) {
            navigator.clipboard.writeText(outputUrl);
            addToHistory(inputUrl, outputUrl);
            onCopy('Modified URL copied');
        }
    };

    const handleOpen = () => {
        if (outputUrl) {
            addToHistory(inputUrl, outputUrl);
            window.open(outputUrl, '_blank');
        }
    };

    return (
        <div className="h-full w-full flex flex-col lg:flex-row bg-background overflow-hidden text-foreground font-sans transition-colors duration-150">
            
            {/* LEFT COLUMN - SOURCE & RULES */}
            <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-border transition-colors duration-150">
                
                {/* Header Strip */}
                <div className="h-14 flex items-center px-6 border-b border-border shrink-0 bg-background transition-colors duration-150">
                    <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-semibold text-foreground tracking-wide">Source Workspace</h2>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-px bg-muted/10">
                    
                    {/* URL Input Area */}
                    <div className="flex flex-col bg-card/60 p-6 pb-4 border-b border-border transition-colors duration-150">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Original URL</label>
                        <div className="relative group">
                            <textarea
                                className="w-full min-h-[120px] bg-card border border-border rounded-lg p-4 font-mono text-[13px] text-foreground focus:ring-1 focus:ring-primary outline-none resize-none transition-all placeholder:text-muted-foreground shadow-sm leading-relaxed"
                                placeholder="Paste source URL here (e.g., https://api.example.com/v1?token=[#token#])"
                                value={inputUrl}
                                onChange={handleManualChange}
                                onPaste={handlePaste}
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Replacement Rules Workflow */}
                    <div className="flex flex-col flex-1 bg-card/60 p-6 transition-colors duration-150">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Transformation Pipeline</label>
                        
                        <div className="flex flex-col gap-1">
                            {rules.map((rule) => (
                                <div key={rule.id} className="group flex items-center gap-3 py-1.5 px-3 -mx-3 rounded-md hover:bg-muted/50 transition-colors border border-transparent focus-within:bg-muted/80 focus-within:border-border">
                                    <div className="flex items-center justify-center w-5">
                                        <input
                                            type="checkbox"
                                            checked={rule.active}
                                            onChange={(e) => updateRule(rule.id, 'active', e.target.checked)}
                                            className="w-3.5 h-3.5 rounded border-border bg-card text-primary focus:ring-offset-0 focus:ring-1 focus:ring-primary cursor-pointer"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Find string..."
                                        value={rule.find}
                                        onChange={(e) => updateRule(rule.id, 'find', e.target.value)}
                                        className={`flex-1 h-8 px-2 bg-transparent border-none text-[13px] font-mono focus:ring-0 outline-none ${rule.active ? 'text-foreground' : 'text-muted-foreground line-through decoration-border'} placeholder:text-muted-foreground`}
                                        spellCheck={false}
                                    />
                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Replace with..."
                                        value={rule.replace}
                                        onChange={(e) => updateRule(rule.id, 'replace', e.target.value)}
                                        className={`flex-1 h-8 px-2 bg-transparent border-none text-[13px] font-mono focus:ring-0 outline-none ${rule.active ? 'text-primary' : 'text-muted-foreground line-through decoration-border'} placeholder:text-muted-foreground`}
                                        spellCheck={false}
                                    />
                                    <button
                                        onClick={() => removeRule(rule.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 rounded hover:bg-muted transition-all"
                                        title="Remove rule"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            
                            {/* Add Rule Button */}
                            <button 
                                onClick={addRule}
                                className="mt-2 flex items-center gap-2 py-2 px-3 -mx-3 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-dashed border-border"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add new rule</span>
                            </button>
                        </div>

                        {/* Snippet Info */}
                        <div className="mt-8 pt-6 border-t border-border flex items-start gap-3 opacity-80 leading-relaxed">
                            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div className="text-xs text-muted-foreground leading-relaxed">
                                <span className="text-foreground font-semibold">Magic Tokens:</span> Use <code className="text-primary font-mono">{'[#token#]'}</code>, <code className="text-primary font-mono">{'[#ltid#]'}</code>, or <code className="text-primary font-mono">{'[#ltuid#]'}</code> to auto-generate unique UUIDv7 strings.
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN - OUTPUT & LIVE PREVIEW */}
            <div className="w-full lg:w-1/2 flex flex-col bg-background relative transition-colors duration-150">
                
                {/* Header Strip with Actions */}
                <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0 bg-background transition-colors duration-150">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                        <h2 className="text-sm font-semibold text-foreground tracking-wide">Live Output</h2>
                    </div>

                    {outputUrl && !error && (
                        <div className="flex items-center gap-1 bg-card p-1 rounded-md border border-border shadow-sm">
                            <button onClick={() => processUrl(inputUrl)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" title="Regenerate Magic Tokens">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button onClick={handleCopy} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" title="Copy URL">
                                <Copy className="w-4 h-4" />
                            </button>
                            <button onClick={handleOpen} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" title="Open in New Tab">
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 p-6 flex flex-col min-h-0 relative overflow-hidden">
                    {/* Top Static Content Area */}
                    <div className="flex-shrink-0 space-y-4">
                        {/* Glowing Final URL Area */}
                        <div className={`relative w-full rounded-xl p-5 border transition-all duration-300 shadow-md
                            ${error ? 'bg-rose-500/10 border-rose-500/20' : outputUrl ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'}
                        `}>
                            {outputUrl && !error && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                            )}
                            
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
                                {error ? 'Parsing Error' : 'Generated URL'}
                            </label>
                            
                            {outputUrl ? (
                                <textarea
                                    value={outputUrl}
                                    onChange={(e) => setOutputUrl(e.target.value)}
                                    className={`w-full bg-transparent border-none focus:ring-0 p-0 m-0 font-mono text-[14px] leading-relaxed resize-none outline-none overflow-hidden ${error ? 'text-rose-500' : 'text-foreground'}`}
                                    spellCheck={false}
                                    rows={Math.max(1, Math.ceil(outputUrl.length / 50))}
                                />
                            ) : (
                                <div className="font-mono text-[14px] leading-relaxed text-muted-foreground italic">
                                    Waiting for input...
                                </div>
                            )}

                            {error && (
                                <div className="mt-3 flex items-center gap-2 text-rose-500 text-xs">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Parsed Structure Area */}
                        {outputUrl && !error && (
                            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                                
                                {/* Host & Path */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Protocol & Host</label>
                                        <div className="font-mono text-sm text-foreground truncate">
                                            <span className="text-muted-foreground">{parsedProtocol}//</span>{parsedHost}
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Pathname</label>
                                        <div className="font-mono text-sm text-emerald-500 truncate">{parsedPath || '/'}</div>
                                    </div>
                                </div>

                                {/* Query Parameters Table */}
                                <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                                    <div className="p-3 border-b border-border bg-muted/20">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Query Parameters ({parsedParams.length})</label>
                                    </div>
                                    
                                    {parsedParams.length > 0 ? (
                                        <div className="flex flex-col max-h-[110px] overflow-y-auto no-scrollbar">
                                            {parsedParams.map((p, i) => (
                                                <div key={i} className="flex items-center border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                                    <div className="w-1/3 py-2 px-3 border-r border-border flex items-center">
                                                        <input 
                                                            type="text" 
                                                            value={p.key} 
                                                            onChange={(e) => handleParamChange(i, e.target.value, p.val)} 
                                                            className="bg-transparent border-none w-full focus:ring-0 focus:outline-none p-0 font-mono text-[13px] text-primary"
                                                            spellCheck={false}
                                                        />
                                                    </div>
                                                    <div className="w-2/3 py-2 px-3 flex items-center">
                                                        <input 
                                                            type="text" 
                                                            value={p.val} 
                                                            onChange={(e) => handleParamChange(i, p.key, e.target.value)} 
                                                            className="bg-transparent border-none w-full focus:ring-0 focus:outline-none p-0 font-mono text-[13px] text-foreground"
                                                            spellCheck={false}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-xs text-muted-foreground italic">
                                            No query parameters found in URL.
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}
                    </div>

                    {/* History Pipeline - Expands to occupy full remaining height */}
                    <div className="flex-1 flex flex-col min-h-0 mt-6 pt-5 border-t border-border overflow-hidden">
                        <div className="flex items-center justify-between mb-3 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4 text-primary" />
                                <h3 className="text-xs font-bold text-foreground">Transformation History</h3>
                            </div>
                            {history.length > 0 && (
                                <button 
                                    onClick={() => setHistory([])}
                                    className="text-[10px] text-muted-foreground hover:text-red-500 font-semibold"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {history.length > 0 ? (
                            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-2.5">
                                {history.map((item) => (
                                    <div key={item.id} className="bg-card border border-border p-3.5 rounded-xl shadow-sm flex flex-col gap-2 relative group hover:border-primary/30 transition-all flex-shrink-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Original:</span>
                                                    <span className="text-[11px] text-muted-foreground truncate block font-mono">{item.original}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Modified:</span>
                                                    <span className="text-[11px] text-foreground font-semibold truncate block font-mono">{item.modified}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(item.modified);
                                                        onCopy('Copied from history');
                                                    }}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted bg-background border border-border"
                                                    title="Copy modified URL"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setInputUrl(item.original);
                                                        onCopy('Restored to editor');
                                                    }}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted bg-background border border-border"
                                                    title="Restore to editor"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <span className="text-[9px] text-muted-foreground/60 font-mono block text-right">{item.timestamp}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-xl p-6 text-center text-xs text-muted-foreground italic">
                                No transformations saved in history yet. URLs auto-save here after a brief pause in editing.
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
};
