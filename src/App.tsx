import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { JSONTools } from './components/JSONTools';
import { JSONCompare } from './components/JSONCompare';
import { SQLCompare } from './components/SQLCompare';
import { DataUtilities } from './components/DataUtilities';
import { CommaSeparator } from './components/CommaSeparator';
import { SQLHelper } from './components/SQLHelper';
import { ThemeEditor } from './components/ThemeEditor';
import { Toast } from './components/Toast';
import { useToast } from './hooks/useToast';
import { URLModifier } from './components/URLModifier';
import { FileJson, GitCompare, Database, FileCode, Split, Settings, Palette, Github, Bell, Link as LinkIcon } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { Button } from './components/Button';
import { ThemeToggle } from './components/ThemeToggle';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, showToast, removeToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleCopy = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    showToast(text, type);
  };

  const tabs = [
    { id: 'json', label: 'JSON Tools', icon: FileJson, path: '/' },
    { id: 'compare', label: 'JSON Compare', icon: GitCompare, path: '/compare' },
    { id: 'url-modifier', label: 'URL Modifier', icon: LinkIcon, path: '/url-modifier' },
    { id: 'sql-compare', label: 'SQL Compare', icon: Database, path: '/sql-compare' },
    { id: 'sql-helper', label: 'SQL Helper', icon: FileCode, path: '/sql-helper' },
    { id: 'data', label: 'Data Utilities', icon: Settings, path: '/data' },
    { id: 'comma', label: 'Comma Separator', icon: Split, path: '/comma' },
    { id: 'theme', label: 'Theme Editor', icon: Palette, path: '/theme' },
  ];

  const currentTab = tabs.find(t => t.path === location.pathname) || tabs[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.path === location.pathname);
        const start = currentIndex === -1 ? 0 : currentIndex;
        const nextIndex = (start + 1) % tabs.length;
        navigate(tabs[nextIndex].path);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans overflow-hidden flex">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        tabs={tabs}
      />

      <main
        className={`flex-1 min-w-0 flex flex-col h-screen transition-all duration-300 ease-in-out relative
          ${sidebarOpen ? 'pl-80' : 'pl-28'} pr-4 py-4 overflow-x-hidden
        `}
      >
        {/* Header Pill */}
        <header className="flex-shrink-0 h-16 mb-4 glass rounded-2xl flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              {currentTab ? currentTab.label : 'Dashboard'}
            </h1>
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              <span className="bg-white dark:bg-slate-700 px-1 rounded shadow-sm">⌘</span>
              <span>K</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/ubais88"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
                <Github className="w-5 h-5" />
              </Button>
            </a>
            <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
              <Bell className="w-5 h-5" />
            </Button>
            {/* We should use ThemeToggle here properly */}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <ThemeToggle />
          </div>
        </header>

        {/* Content Area - Card Style */}
        <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <Routes>
            <Route path="/" element={<JSONTools onCopy={handleCopy} />} />
            <Route path="/compare" element={<JSONCompare onCopy={handleCopy} />} />
            <Route path="/url-modifier" element={<URLModifier />} />
            <Route path="/sql-compare" element={<SQLCompare onCopy={handleCopy} />} />
            <Route path="/sql-helper" element={<SQLHelper onCopy={handleCopy} />} />
            <Route path="/data" element={<DataUtilities onCopy={handleCopy} />} />
            <Route path="/comma" element={<CommaSeparator onCopy={handleCopy} />} />
            <Route path="/theme" element={<ThemeEditor />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
