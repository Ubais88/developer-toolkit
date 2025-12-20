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
import { FileJson, GitCompare, Database, FileCode, Split, Settings, Palette, Github } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open typically logic
  const { toasts, showToast, removeToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleCopy = (text: string) => {
    showToast(text, 'success');
  };

  const tabs = [
    { id: 'json', label: 'JSON Tools', icon: FileJson, path: '/' },
    { id: 'compare', label: 'JSON Compare', icon: GitCompare, path: '/compare' },
    { id: 'sql-compare', label: 'SQL Compare', icon: Database, path: '/sql-compare' },
    { id: 'sql-helper', label: 'SQL Helper', icon: FileCode, path: '/sql-helper' },
    { id: 'data', label: 'Data Utils', icon: Settings, path: '/data' },
    { id: 'comma', label: 'Comma Separator', icon: Split, path: '/comma' },
    { id: 'theme', label: 'Theme Editor', icon: Palette, path: '/theme' },
  ];

  /* 
  // Determine active tab label from location
  // Map root to json for label purpose
  const currentPath = location.pathname === '/' ? '/' : location.pathname;
  // Actually, tabs logic used IDs. Let's map paths.
  */
  const currentTab = tabs.find(t => t.path === location.pathname) || tabs[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K to cycle tabs
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.path === location.pathname);
        // If not found (e.g. unknown route), default to 0
        const start = currentIndex === -1 ? 0 : currentIndex;
        const nextIndex = (start + 1) % tabs.length;
        navigate(tabs[nextIndex].path);
      }
      
      // Ctrl+B sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, navigate]);

  return (
    <div className="flex bg-slate-50 dark:bg-slate-900 h-screen overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        tabs={tabs}
      />

      <main className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 justify-between flex-shrink-0 z-10 transition-colors duration-300 shadow-sm">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-800 dark:text-white">
              {currentTab ? currentTab.label : 'Ghost Toolkit'}
            </h1>
          </div>
          <a 
            href="https://github.com/ubais88" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>Mohd Ubais</span>
          </a>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<JSONTools onCopy={handleCopy} />} />
            <Route path="/compare" element={<JSONCompare onCopy={handleCopy} />} />
            <Route path="/sql-compare" element={<SQLCompare onCopy={handleCopy} />} />
            <Route path="/sql-helper" element={<SQLHelper onCopy={handleCopy} />} />
            <Route path="/data" element={<DataUtilities onCopy={handleCopy} />} />
            <Route path="/comma" element={<CommaSeparator onCopy={handleCopy} />} />
            <Route path="/theme" element={<ThemeEditor />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* <footer className="h-8 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center px-4 justify-between text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 transition-colors duration-300">
          <div className="opacity-75">Ghost Toolkit</div>
          <div className="flex gap-4 opacity-75">
            <span>Ctrl + K to cycle tabs</span>
            <span>Ctrl + B to toggle sidebar</span>
          </div>
        </footer> */}
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
       {/* BrowserRouter is now in main.tsx or needs to be here if main doesn't have it. 
           Usually cleaner to put in main.tsx, but to avoid multiple file edits in one turn if I can, 
           I might just require main.tsx edit. 
           Actually, App() is the root exported. I will assume main.tsx renders <App />.
           Since I haven't edited main.tsx yet, I CAN put BrowserRouter here for safety or edit main.tsx.
           I'll edit main.tsx separately. */}
       <AppContent />
    </ThemeProvider>
  );
}
