import { useState, useEffect } from 'react';
import { Copy, ExternalLink, RefreshCw, Plus, Trash2, ArrowRight, ShieldCheck, ShieldAlert, Zap } from 'lucide-react';
import { Button } from './Button';
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

        // Set timestamp (48 bits)
        value[0] = (timestamp / 0x10000000000) & 0xff;
        value[1] = (timestamp / 0x100000000) & 0xff;
        value[2] = (timestamp / 0x1000000) & 0xff;
        value[3] = (timestamp / 0x10000) & 0xff;
        value[4] = (timestamp / 0x100) & 0xff;
        value[5] = timestamp & 0xff;

        // Set version (0111 for v7)
        value[6] = (value[6] & 0x0f) | 0x70;

        // Set variant (10xx)
        value[8] = (value[8] & 0x3f) | 0x80;

        return [...value]
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
    };

    const processUrl = (url: string) => {
        setError(null);
        // Trim whitespace and newlines from start/end
        let newUrl = url.trim();

        // Apply Active Rules
        rules.forEach(rule => {
            if (rule.active && rule.find) {
                // Simple string replaceAll
                newUrl = newUrl.split(rule.find).join(rule.replace);
            }
        });

        // Apply Random ID Tags
        const idTags = ['[#token#]', '[#ltid#]', '[#ltuid#]'];
        idTags.forEach(tag => {
            if (newUrl.includes(tag)) {
                // Replace each occurrence with a unique ID
                const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                newUrl = newUrl.replace(regex, () => generateUUIDv7());
            }
        });

        setOutputUrl(newUrl);

        // Validate
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
        // Debounce processing could be nice, but instant is fine for now
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
        // Re-process current input when rules change
        // Using setTimeout to allow state update or just call process with current input
        // The effect below handles re-processing
    };

    useEffect(() => {
        processUrl(inputUrl);
    }, [rules]);

    return (
        <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-6 h-6 text-primary" />
                    URL Modifier
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                    Paste a URL to automatically apply replacement rules and generate UUIDs.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Left Column: Input and Rules */}
                <div className="flex flex-col gap-6">

                    {/* Input Area */}
                    <div className="glass-panel p-4 rounded-xl flex flex-col gap-3 shadow-sm">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Input URL</label>
                        <textarea
                            className="flex-1 min-h-[120px] w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all placeholder:text-slate-400"
                            placeholder="Paste URL here (e.g., https://dc.biobrain.io/api?token=[#token#])"
                            value={inputUrl}
                            onChange={handleManualChange}
                            onPaste={handlePaste}
                        />
                        <div className="flex justify-end">
                            <span className="text-xs text-slate-400">Paste triggers auto-replace</span>
                        </div>
                    </div>

                    {/* Rules Configuration */}
                    <div className="glass-panel p-4 rounded-xl flex flex-col gap-4 flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Replacement Rules
                            </label>
                            <Button onClick={addRule} variant="outline" size="sm" className="h-8">
                                <Plus className="w-3 h-3 mr-1" /> Add Rule
                            </Button>
                        </div>

                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
                            {rules.map(rule => (
                                <div key={rule.id} className="flex items-center gap-2 group">
                                    <div className="flex items-center h-8 px-2 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={rule.active}
                                            onChange={(e) => updateRule(rule.id, 'active', e.target.checked)}
                                            className="rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Find"
                                        value={rule.find}
                                        onChange={(e) => updateRule(rule.id, 'find', e.target.value)}
                                        className="flex-1 h-8 px-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:border-primary outline-none"
                                    />
                                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Replace"
                                        value={rule.replace}
                                        onChange={(e) => updateRule(rule.id, 'replace', e.target.value)}
                                        className="flex-1 h-8 px-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:border-primary outline-none"
                                    />
                                    <button
                                        onClick={() => removeRule(rule.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {/* Built-in Tags Info */}
                            <div className="mt-2 p-3 bg-primary/5 border border-primary/10 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                                <p className="font-semibold text-primary mb-1">Built-in Random ID Generators (10-char):</p>
                                <div className="flex gap-2 flex-wrap font-mono">
                                    <span className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-primary/20">[#token#]</span>
                                    <span className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-primary/20">[#ltid#]</span>
                                    <span className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-primary/20">[#ltuid#]</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Output */}
                <div className="flex flex-col h-full">
                    <div className={`glass-panel p-6 rounded-xl flex flex-col h-full gap-4 shadow-md transition-all duration-300 ${error ? 'border-red-300 dark:border-red-900/50' : 'border-emerald-300/50 dark:border-emerald-900/50'}`}>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Final URL</label>
                            {/* Validation Badge */}
                            {outputUrl && (
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${error ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'}`}>
                                    {error ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                    {error ? 'Invalid Format' : 'Valid URL'}
                                </div>
                            )}
                        </div>

                        <div className="relative flex-1">
                            <textarea
                                readOnly
                                className={`w-full h-full bg-slate-50 dark:bg-slate-900/50 border rounded-lg p-4 font-mono text-sm resize-none outline-none focus:ring-0 transition-colors
                    ${error ? 'border-red-200 dark:border-red-900' : 'border-slate-200 dark:border-slate-700'}
                  `}
                                value={outputUrl}
                                placeholder="Modified URL will appear here..."
                            />
                            {outputUrl && (
                                <div className="absolute bottom-4 right-4 flex gap-2">
                                    <Button onClick={() => processUrl(inputUrl)} size="sm" variant="secondary" className="shadow-sm" title="Regenerate Random IDs">
                                        <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh Ids
                                    </Button>
                                    <Button onClick={handleCopy} size="sm" variant="secondary" className="shadow-sm">
                                        <Copy className="w-4 h-4 mr-1.5" /> Copy
                                    </Button>
                                    <Button onClick={handleOpen} size="sm" variant="primary" className="shadow-sm">
                                        <ExternalLink className="w-4 h-4 mr-1.5" /> Open
                                    </Button>
                                </div>
                            )}
                        </div>

                        {error && (
                            <p className="text-xs text-red-500">{error}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
