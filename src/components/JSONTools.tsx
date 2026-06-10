import { useState, useEffect, useRef } from 'react';
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
  Minimize 
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
  const containerRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();

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

  const activeTab = tabs?.find(t => t.id === activeTabId) || tabs?.[0] || defaultTab;
  const input = activeTab.content;

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

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col relative overflow-hidden h-full w-full bg-white dark:bg-slate-900`}
    >
      {/* Floating Toolbar - Sleek Minimal Glassmorphism */}
      <div className="absolute top-4 right-6 z-20 flex gap-1 p-1 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-lg shadow-2xl transition-all duration-300 opacity-40 group-hover:opacity-100 hover:opacity-100 focus-within:opacity-100">
        
        <Button onClick={handleFormat} variant="ghost" className="relative group/btn w-11 h-11 p-0 text-primary/70 dark:text-primary/80 hover:bg-primary/10 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
          <Wand2 size={28} strokeWidth={1.5} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Format JSON (Alt+Shift+F)</span>
        </Button>
        
        <Button onClick={handleMinify} variant="ghost" className="relative group/btn w-11 h-11 p-0 text-primary/70 dark:text-primary/80 hover:bg-primary/10 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
          <Minimize2 size={28} strokeWidth={1.5} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Minify JSON (Alt+Shift+M)</span>
        </Button>
        
        <Button onClick={handleValidate} variant="ghost" className="relative group/btn w-11 h-11 p-0 text-primary/70 dark:text-primary/80 hover:bg-primary/10 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
          <CheckCircle size={28} strokeWidth={1.5} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Validate JSON (Alt+Shift+V)</span>
        </Button>
        
        <Button onClick={handleRepair} variant="ghost" className="relative group/btn w-11 h-11 p-0 text-primary/70 dark:text-primary/80 hover:bg-primary/10 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
          <Wrench size={28} strokeWidth={1.5} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Auto Repair JSON (Alt+Shift+R)</span>
        </Button>
        
        <div className="w-px h-5 bg-slate-200 dark:bg-white/5 my-auto mx-1"></div>
        
        <Button onClick={handleCopy} variant="ghost" className="relative group/btn w-11 h-11 p-0 text-primary/70 dark:text-primary/80 hover:bg-primary/10 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
          <Copy size={28} strokeWidth={1.5} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Copy JSON (Alt+Shift+C)</span>
        </Button>
        
        <Button onClick={handleDownload} variant="ghost" className="relative group/btn w-11 h-11 p-0 text-primary/70 dark:text-primary/80 hover:bg-primary/10 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
          <Download size={28} strokeWidth={1.5} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Download JSON (Alt+Shift+D)</span>
        </Button>
        
        <div className="w-px h-5 bg-slate-200 dark:bg-white/5 my-auto mx-1"></div>
        
        <Button onClick={handleClear} variant="ghost" className="relative group/btn w-11 h-11 p-0 text-red-400 dark:text-red-500 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 rounded-md transition-colors">
          <Trash2 size={28} strokeWidth={1.5} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Clear Editor (Alt+Shift+X)</span>
        </Button>
        
        <Button onClick={toggleTreeView} variant="ghost" className={`relative group/btn w-11 h-11 p-0 transition-colors rounded-md ${isTreeView ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' : 'text-primary/70 dark:text-primary/80 hover:bg-primary/10 hover:text-primary dark:hover:text-primary'}`}>
          <Network size={28} strokeWidth={1.5} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">Toggle Tree View (Alt+Shift+T)</span>
        </Button>
        
        <Button onClick={toggleFullscreen} variant="ghost" className="relative group/btn w-11 h-11 p-0 text-primary/70 dark:text-primary/80 hover:bg-primary/10 hover:text-primary dark:hover:text-primary rounded-md transition-colors">
          {isFullscreen ? <Minimize size={28} strokeWidth={1.5} /> : <Maximize size={28} strokeWidth={1.5} />}
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-800 dark:bg-black/90 text-slate-200 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700 dark:border-white/10">
            {isFullscreen ? "Restore Editor (Alt+Shift+Enter)" : "Fullscreen Mode (Alt+Shift+Enter)"}
          </span>
        </Button>
      </div>

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
        />
        
        <div className="flex-1 min-h-0 relative">
          {isTreeView ? (
            <div className="h-full overflow-auto p-4 bg-slate-50 dark:bg-slate-900/50">
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
            />
          )}
        </div>
      </div>
    </div>
  );
};
