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
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, showToast, removeToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleCopy = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    showToast(text, type);
  };

  const tabs = [
    { id: 'json', label: 'JSON Tools', path: '/' },
    { id: 'compare', label: 'JSON Compare', path: '/compare' },
    { id: 'url-modifier', label: 'URL Modifier', path: '/url-modifier' },
    { id: 'sql-compare', label: 'SQL Compare', path: '/sql-compare' },
    { id: 'sql-helper', label: 'SQL Helper', path: '/sql-helper' },
    { id: 'data', label: 'Data Utilities', path: '/data' },
    { id: 'comma', label: 'Comma Separator', path: '/comma' },
    { id: 'theme', label: 'Theme Editor', path: '/theme' },
  ];

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
        className={`flex-1 min-w-0 flex flex-col h-screen transition-all duration-150 ease-out relative bg-slate-50 dark:bg-slate-950
          ${sidebarOpen ? 'pl-64' : 'pl-16'}
        `}
      >
        {/* Content Area - Full Bleed */}
        <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 overflow-hidden relative">
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
