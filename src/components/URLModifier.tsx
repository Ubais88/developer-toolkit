import { useState, useEffect } from 'react';
import { Copy, ExternalLink, RefreshCw, Plus, Trash2, ArrowRight, Link as LinkIcon, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface ReplacementRule {
    id: string;
    find: string;
    replace: string;
    active: boolean;
}

export const URLModifier = () => {
    const [inputUrl, setInputUrl] = useState('');
    const [outputUrl, setOutputUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    const [rules, setRules] = useState<ReplacementRule[]>([
        { id: 'default-1', find: 'https://dc.biobrain.io', replace: 'http://localhost:5173', active: true },
        { id: 'default-2', find: 'https://bb-dc-app.azurewebsites.net', replace: 'http://localhost:5173', active: true },
    ]);

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

    const processUrl = (url: string) => {
        setError(null);
        let newUrl = url.trim();

        // Apply Active Rules
        rules.forEach(rule => {
            if (rule.active && rule.find) {
                newUrl = newUrl.split(rule.find).join(rule.replace);
            }
        });

        // Apply Random ID Tags
        const idTags = ['[#token#]', '[#ltid#]', '[#ltuid#]'];
        idTags.forEach(tag => {
            if (newUrl.includes(tag)) {
                const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                newUrl = newUrl.replace(regex, () => generateUUIDv7());
            }
        });

        setOutputUrl(newUrl);

        try {
            if (newUrl) {
                new URL(newUrl);
            }
        } catch (e) {
            setError('Invalid URL format');
        }

        return newUrl;
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        setInputUrl(text);
        processUrl(text);
        showToast('URL pasted and processed', 'info');
    };

    const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputUrl(e.target.value);
        processUrl(e.target.value);
    };

    const handleCopy = () => {
        if (!outputUrl) return;
        navigator.clipboard.writeText(outputUrl);
        showToast('Modified URL copied to clipboard', 'success');
    };

    const handleOpen = () => {
        if (!outputUrl) return;
        try {
            const urlObj = new URL(outputUrl);
            window.open(urlObj.toString(), '_blank');
        } catch {
            showToast('Cannot open invalid URL', 'error');
        }
    };

    const addRule = () => {
        setRules([...rules, { id: crypto.randomUUID(), find: '', replace: '', active: true }]);
    };

    const removeRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
    };

    const updateRule = (id: string, field: keyof ReplacementRule, value: any) => {
        setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    useEffect(() => {
        processUrl(inputUrl);
    }, [rules]);

    // Parsing for output preview
    let parsedParams: {key: string, val: string}[] = [];
    let parsedHost = '';
    let parsedPath = '';
    let parsedProtocol = '';
    try {
        if(outputUrl && !error) {
            const u = new URL(outputUrl);
            parsedHost = u.host;
            parsedPath = u.pathname;
            parsedProtocol = u.protocol;
            u.searchParams.forEach((val, key) => {
                parsedParams.push({key, val});
            });
        }
    } catch (e) {}

    return (
        <div className="h-full w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-300 font-sans transition-colors duration-150">
            
            {/* LEFT COLUMN - SOURCE & RULES */}
            <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/5 transition-colors duration-150">
                
                {/* Header Strip */}
                <div className="h-14 flex items-center px-6 border-b border-slate-200 dark:border-white/5 shrink-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-150">
                    <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-primary dark:text-violet-500" />
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-wide">Source Workspace</h2>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-px bg-slate-100 dark:bg-white/[0.02]">
                    
                    {/* URL Input Area (Editor Style) */}
                    <div className="flex flex-col bg-slate-50 dark:bg-slate-950 p-6 pb-4 transition-colors duration-150">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Original URL</label>
                        <div className="relative group">
                            <textarea
                                className="w-full min-h-[120px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-lg p-4 font-mono text-[13px] text-slate-900 dark:text-slate-300 focus:ring-1 focus:ring-primary/50 dark:focus:ring-violet-500/50 outline-none resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm dark:shadow-inner leading-relaxed"
                                placeholder="Paste source URL here (e.g., https://api.example.com/v1?token=[#token#])"
                                value={inputUrl}
                                onChange={handleManualChange}
                                onPaste={handlePaste}
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Replacement Rules Workflow */}
                    <div className="flex flex-col flex-1 bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-150">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Transformation Pipeline</label>
                        
                        <div className="flex flex-col gap-1">
                            {rules.map((rule) => (
                                <div key={rule.id} className="group flex items-center gap-3 py-1.5 px-3 -mx-3 rounded-md hover:bg-slate-200 dark:hover:bg-white/[0.02] transition-colors border border-transparent focus-within:bg-slate-200 dark:focus-within:bg-white/[0.03] focus-within:border-slate-300 dark:focus-within:border-white/[0.06]">
                                    <div className="flex items-center justify-center w-5">
                                        <input
                                            type="checkbox"
                                            checked={rule.active}
                                            onChange={(e) => updateRule(rule.id, 'active', e.target.checked)}
                                            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-white/20 bg-white dark:bg-transparent text-primary dark:text-violet-500 focus:ring-offset-0 focus:ring-1 focus:ring-primary/50 dark:focus:ring-violet-500/50 cursor-pointer"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Find string..."
                                        value={rule.find}
                                        onChange={(e) => updateRule(rule.id, 'find', e.target.value)}
                                        className={`flex-1 h-8 px-2 bg-transparent border-none text-[13px] font-mono focus:ring-0 outline-none ${rule.active ? 'text-slate-900 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700'} placeholder:text-slate-400 dark:placeholder:text-slate-700`}
                                        spellCheck={false}
                                    />
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Replace with..."
                                        value={rule.replace}
                                        onChange={(e) => updateRule(rule.id, 'replace', e.target.value)}
                                        className={`flex-1 h-8 px-2 bg-transparent border-none text-[13px] font-mono focus:ring-0 outline-none ${rule.active ? 'text-blue-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700'} placeholder:text-slate-400 dark:placeholder:text-slate-700`}
                                        spellCheck={false}
                                    />
                                    <button
                                        onClick={() => removeRule(rule.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded hover:bg-white/50 dark:hover:bg-white/5 transition-all"
                                        title="Remove rule"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            
                            {/* Add Rule Button */}
                            <button 
                                onClick={addRule}
                                className="mt-2 flex items-center gap-2 py-2 px-3 -mx-3 rounded-md text-[13px] text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 transition-colors border border-dashed border-transparent hover:border-slate-300 dark:hover:border-white/10"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add new rule</span>
                            </button>
                        </div>

                        {/* Snippet Info */}
                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 flex items-start gap-3 opacity-80 dark:opacity-60 transition-colors">
                            <Info className="w-4 h-4 text-primary dark:text-violet-400 shrink-0 mt-0.5" />
                            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                <span className="text-slate-700 dark:text-slate-300">Magic Tokens:</span> Use <code className="text-blue-600 dark:text-sky-300 font-mono">{'[#token#]'}</code>, <code className="text-blue-600 dark:text-sky-300 font-mono">{'[#ltid#]'}</code>, or <code className="text-blue-600 dark:text-sky-300 font-mono">{'[#ltuid#]'}</code> to auto-generate unique UUIDv7 strings on every paste.
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN - OUTPUT & LIVE PREVIEW */}
            <div className="w-full lg:w-1/2 flex flex-col bg-slate-50 dark:bg-slate-950 relative transition-colors duration-150">
                
                {/* Header Strip with Actions */}
                <div className="h-14 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5 shrink-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-150">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-wide">Live Output</h2>
                    </div>

                    {outputUrl && !error && (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                            <button onClick={() => processUrl(inputUrl)} className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors" title="Regenerate Magic Tokens">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button onClick={handleCopy} className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors" title="Copy URL">
                                <Copy className="w-4 h-4" />
                            </button>
                            <button onClick={handleOpen} className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors" title="Open in New Tab">
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
                    {/* Glowing Final URL Area */}
                    <div className={`relative w-full rounded-xl p-5 mb-8 border transition-all duration-300 shadow-md dark:shadow-2xl
                        ${error ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20' : outputUrl ? 'bg-primary/5 dark:bg-violet-500/[0.03] border-primary/20 dark:border-violet-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5'}
                    `}>
                        {outputUrl && !error && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/50 dark:via-violet-500/50 to-transparent"></div>
                        )}
                        
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">
                            {error ? 'Parsing Error' : 'Generated URL'}
                        </label>
                        
                        {outputUrl ? (
                            <textarea
                                value={outputUrl}
                                onChange={(e) => setOutputUrl(e.target.value)}
                                className={`w-full bg-transparent border-none focus:ring-0 p-0 m-0 font-mono text-[14px] leading-relaxed resize-none outline-none overflow-hidden ${error ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-slate-200'}`}
                                spellCheck={false}
                                rows={Math.max(1, Math.ceil(outputUrl.length / 50))} // Auto-size roughly
                            />
                        ) : (
                            <div className="font-mono text-[14px] leading-relaxed text-slate-500 dark:text-slate-600 italic">
                                Waiting for input...
                            </div>
                        )}

                        {error && (
                            <div className="mt-3 flex items-center gap-2 text-red-500 dark:text-red-400 text-xs">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Parsed Structure Area (Only show if valid URL exists) */}
                    {outputUrl && !error && (
                        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                            
                            {/* Host & Path */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-lg p-4 shadow-sm dark:shadow-none">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Protocol & Host</label>
                                    <div className="font-mono text-sm text-slate-900 dark:text-slate-300 truncate">
                                        <span className="text-slate-400 dark:text-slate-500">{parsedProtocol}//</span>{parsedHost}
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-lg p-4 shadow-sm dark:shadow-none">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Pathname</label>
                                    <div className="font-mono text-sm text-emerald-600 dark:text-emerald-400 truncate">{parsedPath || '/'}</div>
                                </div>
                            </div>

                            {/* Query Parameters Table */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-lg overflow-hidden shadow-sm dark:shadow-none">
                                <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01]">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Query Parameters ({parsedParams.length})</label>
                                </div>
                                
                                {parsedParams.length > 0 ? (
                                    <div className="flex flex-col">
                                        {parsedParams.map((p, i) => (
                                            <div key={i} className="flex items-start border-b border-slate-200 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                                <div className="w-1/3 py-2.5 px-4 font-mono text-[13px] text-blue-600 dark:text-sky-400 border-r border-slate-200 dark:border-white/5 break-all">
                                                    {p.key}
                                                </div>
                                                <div className="w-2/3 py-2.5 px-4 font-mono text-[13px] text-slate-900 dark:text-slate-300 break-all">
                                                    {p.val}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-600 italic">
                                        No query parameters found in URL.
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>

            </div>

        </div>
    );
};
