import { ChevronsRight, FileJson, GitCompare, Database, FileCode, Split, Settings, Palette, Github, Bell, Link as LinkIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const ICONS: Record<string, any> = {
  'json': FileJson,
  'compare': GitCompare,
  'url-modifier': LinkIcon,
  'sql-compare': Database,
  'sql-helper': FileCode,
  'data': Settings,
  'comma': Split,
  'theme': Palette,
};

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  tabs: { id: string; label: string; path: string }[];
}

export const Sidebar = ({ isOpen, onToggle, tabs }: SidebarProps) => {
  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col transition-all duration-150 ease-out font-sans 
        ${isOpen ? 'w-64' : 'w-16'}
        bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-white/5
      `}
    >
      {/* Header */}
      <div className="h-20 flex items-center px-6 mb-2">
        <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap w-full">
          <div className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? '' : 'mx-auto'}`}>
            <Logo className="w-10 h-10 text-primary drop-shadow-sm" />
          </div>

          <div className={`flex flex-col transition-all duration-150 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 w-0 absolute'}`}>
            <span className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
              Ghost<span className="text-primary">ToolKit</span>
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Pro Suite
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = ICONS[tab.id] || Settings;
          const path = tab.path;

          return (
            <NavLink
              key={tab.id}
              to={path}
              className={({ isActive }) => `
                relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group
                ${isActive
                  ? 'bg-primary/10 text-primary dark:bg-white/10 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }
                ${!isOpen && 'justify-center px-0'}
              `}
              title={!isOpen ? tab.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <div className={`flex-shrink-0 transition-transform duration-150 ${!isOpen && 'group-hover:scale-110'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary dark:text-white' : 'opacity-80'}`} strokeWidth={2} />
                  </div>

                  {isOpen && (
                    <span className="font-medium text-sm truncate">
                      {tab.label}
                    </span>
                  )}

                  {/* Active Indicator Pille for closed state */}
                  {!isOpen && isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary dark:bg-white rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Toggle */}
      <div className="mt-auto border-t border-slate-200 dark:border-white/5 flex flex-col p-2 gap-1">
        {isOpen && (
          <div className="flex items-center justify-between px-2 py-2 mb-1">
            <div className="flex items-center gap-2">
              <a href="https://github.com/ubais88" target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-white/5">
                <Github className="w-4 h-4" />
              </a>
              <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-white/5">
                <Bell className="w-4 h-4" />
              </button>
            </div>
            <ThemeToggle />
          </div>
        )}
        
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center justify-center p-2 rounded-lg transition-colors duration-150
            hover:bg-slate-200 dark:hover:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white
            ${!isOpen && 'aspect-square'}
          `}
        >
          {isOpen ? (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <ChevronsRight className="w-4 h-4 rotate-180" />
              <span>Collapse</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-full h-px bg-slate-200 dark:bg-white/5 mb-2" />
              <ChevronsRight className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
