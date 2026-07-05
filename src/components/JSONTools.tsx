import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { JSONTabs, TabData } from './JSONTabs';
import { Editor } from './Editor';
import { Button } from './Button';
import { 
  Copy, 
  Minimize2, 
  CheckCircle, 
  Wand2, 
  Wrench, 
  Download, 
  Trash2, 
  Network, 
  Maximize, 
  Minimize,
  Palette,
  Check,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { formatJSON, minifyJSON, validateJSON, repairJSON } from '../utils/jsonUtils';
import { JsonView, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { useTheme } from '../context/ThemeContext';

interface JSONToolsProps {
  onCopy: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const JSONTools = ({ onCopy }: JSONToolsProps) => {
  const defaultTab: TabData = {
    id: 'tab-1',
    name: 'Untitled-1.json',
    content: '',
    isPinned: false,
    isUnsaved: false
  };

  const [tabs, setTabs] = useLocalStorage<TabData[]>('json-tools-tabs', [defaultTab]);
  const [activeTabId, setActiveTabId] = useLocalStorage<string>('json-tools-active-tab', 'tab-1');

  const [isTreeView, setIsTreeView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  
  const { 
    mode, 
    setMode, 
    primaryColor, 
    setPrimaryColor, 
    radius, 
    setRadius, 
    glass, 
    setGlass, 
    preset, 
    applyPreset 
  } = useTheme();

  // Safety fallback if tabs are ever empty
  useEffect(() => {
    if (!tabs || tabs.length === 0) {
      const newTab = { ...defaultTab, id: `tab-${Date.now()}` };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
    } else if (!tabs.find(t => t.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId, setTabs, setActiveTabId]);

  // Reset cursor position when changing tabs
  useEffect(() => {
    setCursorPos({ line: 1, column: 1 });
  }, [activeTabId]);

  const activeTab = tabs?.find(t => t.id === activeTabId) || tabs?.[0] || defaultTab;
  const input = activeTab.content;

  const jsonStats = useMemo(() => {
    if (!input) return { valid: true, error: null, line: null, keys: 0, depth: 0 };
    const validation = validateJSON(input);
    if (!validation.valid) {
      return { valid: false, error: validation.error, line: validation.line, keys: 0, depth: 0 };
    }
    try {
      const parsed = JSON.parse(input);
      
      const countKeys = (obj: any): number => {
        if (obj === null || typeof obj !== 'object') return 0;
        let count = 0;
        if (Array.isArray(obj)) {
          for (const item of obj) {
            count += countKeys(item);
          }
        } else {
          const keys = Object.keys(obj);
          count += keys.length;
          for (const key of keys) {
            count += countKeys(obj[key]);
          }
        }
        return count;
      };

      const getJsonDepth = (obj: any): number => {
        if (obj === null || typeof obj !== 'object') return 0;
        if (Array.isArray(obj)) {
          if (obj.length === 0) return 1;
          return 1 + Math.max(...obj.map(getJsonDepth));
        }
        const keys = Object.keys(obj);
        if (keys.length === 0) return 1;
        return 1 + Math.max(...keys.map(k => getJsonDepth(obj[k])));
      };

      return {
        valid: true,
        error: null,
        line: null,
        keys: countKeys(parsed),
        depth: getJsonDepth(parsed)
      };
    } catch (_e) {
      return { valid: false, error: 'Invalid JSON structure', line: null, keys: 0, depth: 0 };
    }
  }, [input]);

  const setInput = (newContent: string) => {
    setTabs(prev => prev.map(t => 
      t.id === activeTabId ? { ...t, content: newContent, isUnsaved: true } : t
    ));
  };

  const handleNewTab = () => {
    const id = `tab-${Date.now()}`;
    const newTab: TabData = {
      id,
      name: `Untitled-${tabs.length + 1}.json`,
      content: '',
      isPinned: false,
      isUnsaved: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);
  };

  const handleCloseTab = (id: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (newTabs.length > 0 && id === activeTabId) {
        const index = prev.findIndex(t => t.id === id);
        const nextIndex = index === prev.length - 1 ? index - 1 : index;
        setActiveTabId(newTabs[nextIndex].id);
      }
      return newTabs;
    });
  };

  const handleCloseOthers = (id: string) => {
    setTabs(prev => prev.filter(t => t.id === id || t.isPinned));
    setActiveTabId(id);
  };

  const handleDuplicateTab = (id: string) => {
    const tabToDuplicate = tabs.find(t => t.id === id);
    if (!tabToDuplicate) return;
    
    const newId = `tab-${Date.now()}`;
    const newTab: TabData = {
      ...tabToDuplicate,
      id: newId,
      name: `${tabToDuplicate.name} (Copy)`,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handlePinToggle = (id: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));
  };

  const handleRenameTab = (id: string, newName: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const saveTab = () => {
    setTabs(prev => prev.map(t => 
      t.id === activeTabId ? { ...t, isUnsaved: false } : t
    ));
    onCopy('Saved', 'success');
  };

  const handleFormat = () => {
    try {
      const formatted = formatJSON(input);
      setInput(formatted);
      onCopy('JSON formatted', 'success');
    } catch (_error) {
      onCopy('Invalid JSON', 'error');
    }
  };

  const handleMinify = () => {
    try {
      const minified = minifyJSON(input);
      setInput(minified);
      onCopy('JSON minified', 'success');
    } catch (_error) {
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

  const handleRepair = () => {
    try {
      const repaired = repairJSON(input);
      setInput(repaired);
      onCopy('JSON auto-repaired', 'success');
    } catch (_error) {
      onCopy('Could not auto-repair JSON', 'error');
    }
  };

  const handleCopy = () => {
    if (input) {
      navigator.clipboard.writeText(input);
      onCopy('JSON copied to clipboard', 'success');
    }
  };

  const handleDownload = () => {
    if (!input) return;
    const blob = new Blob([input], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onCopy('JSON downloaded', 'success');
  };

  const handleClear = () => {
    setInput('');
    onCopy('Editor cleared', 'info');
  };

  const toggleTreeView = () => {
    setIsTreeView(!isTreeView);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {
        onCopy('Failed to enter fullscreen mode', 'error');
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Click outside handler for Appearance settings popup menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl combinations
      if (e.ctrlKey) {
        if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          handleNewTab();
          return;
        }
        if (e.key.toLowerCase() === 'w') {
          e.preventDefault();
          handleCloseTab(activeTabId);
          return;
        }
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          saveTab();
          return;
        }
        // Browser typically blocks preventDefault on Ctrl+Tab, but we can try catching it in certain environments
        if (e.key === 'Tab') {
          e.preventDefault();
          const currentIndex = tabs.findIndex(t => t.id === activeTabId);
          if (currentIndex === -1) return;
          const nextIndex = e.shiftKey 
            ? (currentIndex - 1 + tabs.length) % tabs.length
            : (currentIndex + 1) % tabs.length;
          setActiveTabId(tabs[nextIndex].id);
          return;
        }
      }

      // Only process if container is focused or active
      if (e.altKey && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'f': e.preventDefault(); handleFormat(); break;
          case 'm': e.preventDefault(); handleMinify(); break;
          case 'v': e.preventDefault(); handleValidate(); break;
          case 'r': e.preventDefault(); handleRepair(); break;
          case 'c': e.preventDefault(); handleCopy(); break;
          case 'd': e.preventDefault(); handleDownload(); break;
          case 'x': e.preventDefault(); handleClear(); break;
          case 't': e.preventDefault(); toggleTreeView(); break;
          case 'enter': e.preventDefault(); toggleFullscreen(); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isTreeView, isFullscreen, tabs, activeTabId]);

  let parsedJson = null;
  if (isTreeView && input) {
    try {
      parsedJson = JSON.parse(input);
    } catch (_e) {
      // invalid JSON, tree view won't work well
    }
  }

  const toolbar = (
    <div className="flex items-center gap-1">
      <Button onClick={handleFormat} variant="ghost" size="none" className="relative group/btn w-8 h-8 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
        <Wand2 size={16} strokeWidth={1.5} />
        <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Format JSON (Alt+Shift+F)</span>
      </Button>
      
      <Button onClick={handleMinify} variant="ghost" size="none" className="relative group/btn w-8 h-8 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
        <Minimize2 size={16} strokeWidth={1.5} />
        <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Minify JSON (Alt+Shift+M)</span>
      </Button>
      
      <Button onClick={handleValidate} variant="ghost" size="none" className="relative group/btn w-8 h-8 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
        <CheckCircle size={16} strokeWidth={1.5} />
        <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Validate JSON (Alt+Shift+V)</span>
      </Button>
      
      <Button onClick={handleRepair} variant="ghost" size="none" className="relative group/btn w-8 h-8 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
        <Wrench size={16} strokeWidth={1.5} />
        <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Auto Repair JSON (Alt+Shift+R)</span>
      </Button>
      
      <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1"></div>
      
      <Button onClick={handleCopy} variant="ghost" size="none" className="relative group/btn w-8 h-8 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
        <Copy size={16} strokeWidth={1.5} />
        <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Copy JSON (Alt+Shift+C)</span>
      </Button>
      
      <Button onClick={handleDownload} variant="ghost" size="none" className="relative group/btn w-8 h-8 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
        <Download size={16} strokeWidth={1.5} />
        <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Download JSON (Alt+Shift+D)</span>
      </Button>
      
      <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1"></div>
      
      <Button onClick={handleClear} variant="ghost" size="none" className="relative group/btn w-8 h-8 p-0 text-red-400 dark:text-red-500 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 rounded-md transition-colors">
        <Trash2 size={16} strokeWidth={1.5} />
        <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Clear Editor (Alt+Shift+X)</span>
      </Button>
      
      <Button onClick={toggleTreeView} variant="ghost" size="none" className={`relative group/btn w-8 h-8 p-0 transition-colors rounded-md ${isTreeView ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary'}`}>
        <Network size={16} strokeWidth={1.5} />
        <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Toggle Tree View (Alt+Shift+T)</span>
      </Button>
      
      <Button onClick={toggleFullscreen} variant="ghost" size="none" className="relative group/btn w-8 h-8 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
        {isFullscreen ? <Minimize size={16} strokeWidth={1.5} /> : <Maximize size={16} strokeWidth={1.5} />}
        <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">
          {isFullscreen ? "Restore Editor (Alt+Shift+Enter)" : "Fullscreen Mode (Alt+Shift+Enter)"}
        </span>
      </Button>

      <div className="relative" ref={themeMenuRef}>
        <Button onClick={() => setShowThemeMenu(!showThemeMenu)} variant="ghost" size="none" className={`relative group/btn w-8 h-8 p-0 transition-colors rounded-md ${showThemeMenu ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary'}`}>
          <Palette size={16} strokeWidth={1.5} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Theme Settings</span>
        </Button>

        {showThemeMenu && (
          <div className="absolute top-full mt-2 right-0 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 p-4 space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Palette size={16} className="text-primary" /> Appearance
              </span>
              <span className="text-[10px] text-slate-400 capitalize">{preset || 'custom'}</span>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Presets</label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'classic', name: 'Classic' },
                  { id: 'modern', name: 'Modern' },
                  { id: 'professional', name: 'Pro' },
                  { id: 'vibrant', name: 'Vibe' },
                  { id: 'calm', name: 'Calm' },
                  { id: 'cyber', name: 'Cyber' },
                  { id: 'nature', name: 'Nat' },
                  { id: 'candy', name: 'Candy' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => applyPreset(style.id as any)}
                    className={`py-1 px-1.5 rounded text-center text-xs border font-medium transition-all ${
                      preset === style.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                        : 'border-border hover:border-primary/50 bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode & Glass */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Theme Mode</label>
                <div className="flex bg-muted p-0.5 rounded-lg">
                  {[
                    { id: 'light', icon: Sun },
                    { id: 'dark', icon: Moon },
                    { id: 'system', icon: Monitor }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setMode(item.id as any)}
                        className={`flex-1 flex justify-center py-1 rounded transition-all ${
                          mode === item.id 
                            ? 'bg-card text-primary dark:text-foreground shadow-sm font-semibold' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title={item.id}
                      >
                        <Icon size={14} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Effects</label>
                <button
                  onClick={() => setGlass(!glass)}
                  className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg border transition-all h-[26px] ${
                    glass ? 'border-primary/50 bg-primary/5' : 'border-border'
                  }`}
                >
                  <span className="text-xs font-medium text-foreground">Glass</span>
                  <div className={`w-6 h-3.5 rounded-full relative transition-colors ${glass ? 'bg-primary' : 'bg-muted border border-border'}`}>
                    <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-all duration-200 ${glass ? 'left-[12px]' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Primary Color</label>
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  { id: 'indigo', class: 'bg-indigo-600' },
                  { id: 'blue', class: 'bg-blue-600' },
                  { id: 'sky', class: 'bg-sky-600' },
                  { id: 'cyan', class: 'bg-cyan-600' },
                  { id: 'teal', class: 'bg-teal-600' },
                  { id: 'emerald', class: 'bg-emerald-600' },
                  { id: 'lime', class: 'bg-lime-600' },
                  { id: 'orange', class: 'bg-orange-600' },
                  { id: 'rose', class: 'bg-rose-600' },
                  { id: 'pink', class: 'bg-pink-600' },
                  { id: 'fuchsia', class: 'bg-fuchsia-600' },
                  { id: 'violet', class: 'bg-violet-600' }
                ].map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setPrimaryColor(color.id as any)}
                    className={`relative w-8 h-8 rounded-lg ${color.class} flex items-center justify-center transition-all hover:scale-105 border ${
                      primaryColor === color.id 
                        ? 'border-white dark:border-slate-900 ring-2 ring-primary ring-offset-1 dark:ring-offset-slate-900 scale-100' 
                        : 'border-transparent'
                    }`}
                    title={color.id}
                  >
                    {primaryColor === color.id && <Check size={12} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Radius */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Corner Radius</label>
              <div className="flex gap-1">
                {[
                  { id: 'none', name: '0' },
                  { id: 'sm', name: '2' },
                  { id: 'md', name: '6' },
                  { id: 'lg', name: '8' },
                  { id: 'xl', name: '12' }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRadius(r.id as any)}
                    className={`flex-1 py-1 rounded text-center text-xs border font-medium transition-all ${
                      radius === r.id
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-card text-foreground border-border hover:bg-muted/50'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const getByteSize = (str: string) => {
    if (!str) return '0 B';
    const bytes = new Blob([str]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col relative overflow-hidden h-full w-full bg-background`}
    >
      <div className="flex-1 min-h-0 bg-transparent flex flex-col relative group">
        <JSONTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabsReorder={setTabs}
          onTabSelect={setActiveTabId}
          onTabClose={handleCloseTab}
          onTabCloseOthers={handleCloseOthers}
          onTabDuplicate={handleDuplicateTab}
          onTabPinToggle={handlePinToggle}
          onTabRename={handleRenameTab}
          onNewTab={handleNewTab}
          rightElement={toolbar}
        />
        
        <div className="flex-1 min-h-0 relative">
          {isTreeView ? (
            <div className="h-full overflow-auto p-4 bg-background">
              {parsedJson ? (
                <JsonView 
                  data={parsedJson} 
                  shouldExpandNode={(level) => level < 2} 
                  style={mode === 'dark' ? darkStyles : defaultStyles} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 font-medium">
                  Invalid JSON. Cannot display tree view.
                </div>
              )}
            </div>
          ) : (
            <Editor
              path={activeTab.id} // Binds Monaco model natively to active tab for undo/redo
              value={input}
              onChange={setInput}
              language="json"
              className="h-full font-mono text-sm"
              onCursorChange={(line, col) => setCursorPos({ line, column: col })}
            />
          )}
        </div>

        {/* Subtle developer info footer */}
        <div className="h-[26px] flex-shrink-0 px-3 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 select-none font-sans font-medium">
          <div className="flex items-center gap-3">
            <span className="opacity-90">{activeTab.name}</span>
          </div>

          <div className="flex items-center gap-3 opacity-90">
            <span>{isTreeView ? 'JSON (Tree)' : 'JSON'}</span>
            <span className="text-slate-200 dark:text-slate-800/80">|</span>
            <span>UTF-8</span>
            <span className="text-slate-200 dark:text-slate-800/80">|</span>
            <span>Ln {cursorPos.line}:{cursorPos.column}</span>
            <span className="text-slate-200 dark:text-slate-800/80">|</span>
            <span>{getByteSize(input)}</span>
            <span className="text-slate-200 dark:text-slate-800/80">|</span>
            <span>{jsonStats.valid ? `${jsonStats.keys} Keys` : '0 Keys'}</span>
            <span className="text-slate-200 dark:text-slate-800/80">|</span>
            <span>Depth {jsonStats.valid ? jsonStats.depth : '0'}</span>
            <span className="text-slate-200 dark:text-slate-800/80">|</span>
            {jsonStats.valid ? (
              <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-0.5">
                ✓ Valid
              </span>
            ) : (
              <span className="text-rose-500 dark:text-rose-400 flex items-center gap-0.5 font-semibold animate-pulse">
                ✗ Invalid {jsonStats.line ? `(Line ${jsonStats.line})` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
