import { useState, useEffect, useRef } from 'react';
import { useSessionState } from '../hooks/useSessionState';
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
  const [input, setInput] = useSessionState('json-tools-input', '');
  const [isTreeView, setIsTreeView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();

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
  }, [input, isTreeView, isFullscreen]);

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
      className={`flex flex-col relative bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300 h-full w-full rounded-2xl`}
    >
      {/* Floating Toolbar - Glassmorphism, Auto-hide, Sticky */}
      <div className="absolute top-4 right-6 z-20 flex gap-1.5 p-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-lg transition-all duration-300 opacity-20 hover:opacity-100 focus-within:opacity-100">
        
        <Button onClick={handleFormat} variant="ghost" className="relative group/btn w-12 h-12 p-0 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary">
          <Wand2 size={32} strokeWidth={1.75} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1.5 bg-primary text-primary-foreground text-sm rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">Format JSON (Alt+Shift+F)</span>
        </Button>
        
        <Button onClick={handleMinify} variant="ghost" className="relative group/btn w-12 h-12 p-0 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary">
          <Minimize2 size={32} strokeWidth={1.75} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1.5 bg-primary text-primary-foreground text-sm rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">Minify JSON (Alt+Shift+M)</span>
        </Button>
        
        <Button onClick={handleValidate} variant="ghost" className="relative group/btn w-12 h-12 p-0 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary">
          <CheckCircle size={32} strokeWidth={1.75} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1.5 bg-primary text-primary-foreground text-sm rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">Validate JSON (Alt+Shift+V)</span>
        </Button>
        
        <Button onClick={handleRepair} variant="ghost" className="relative group/btn w-12 h-12 p-0 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary">
          <Wrench size={32} strokeWidth={1.75} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1.5 bg-primary text-primary-foreground text-sm rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">Auto Repair JSON (Alt+Shift+R)</span>
        </Button>
        
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 my-auto mx-1"></div>
        
        <Button onClick={handleCopy} variant="ghost" className="relative group/btn w-12 h-12 p-0 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary">
          <Copy size={32} strokeWidth={1.75} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1.5 bg-primary text-primary-foreground text-sm rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">Copy JSON (Alt+Shift+C)</span>
        </Button>
        
        <Button onClick={handleDownload} variant="ghost" className="relative group/btn w-12 h-12 p-0 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary">
          <Download size={32} strokeWidth={1.75} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1.5 bg-primary text-primary-foreground text-sm rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">Download JSON (Alt+Shift+D)</span>
        </Button>
        
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 my-auto mx-1"></div>
        
        <Button onClick={handleClear} variant="ghost" className="relative group/btn w-12 h-12 p-0 text-slate-600 dark:text-slate-300 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 dark:hover:text-destructive">
          <Trash2 size={32} strokeWidth={1.75} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1.5 bg-destructive text-destructive-foreground text-sm rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">Clear Editor (Alt+Shift+X)</span>
        </Button>
        
        <Button onClick={toggleTreeView} variant="ghost" className={`relative group/btn w-12 h-12 p-0 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary ${isTreeView ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' : ''}`}>
          <Network size={32} strokeWidth={1.75} />
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1.5 bg-primary text-primary-foreground text-sm rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">Toggle Tree View (Alt+Shift+T)</span>
        </Button>
        
        <Button onClick={toggleFullscreen} variant="ghost" className="relative group/btn w-12 h-12 p-0 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary">
          {isFullscreen ? <Minimize size={32} strokeWidth={1.75} /> : <Maximize size={32} strokeWidth={1.75} />}
          <span className="absolute top-full mt-2 right-0 px-2.5 py-1.5 bg-primary text-primary-foreground text-sm rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
            {isFullscreen ? "Restore Editor (Alt+Shift+Enter)" : "Fullscreen Mode (Alt+Shift+Enter)"}
          </span>
        </Button>
      </div>

      <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden relative">
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
            value={input}
            onChange={setInput}
            language="json"
            className="h-full font-mono text-sm"
          />
        )}
      </div>
    </div>
  );
};
