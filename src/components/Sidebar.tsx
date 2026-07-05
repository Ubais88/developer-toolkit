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
        bg-background border-r border-border
      `}
    >
      {/* Header */}
      <div className={`flex items-center mb-2 transition-all ${isOpen ? 'h-20 px-6' : 'h-16 px-0 justify-center'}`}>
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="flex-shrink-0">
            <Logo className="w-9 h-9 text-primary drop-shadow-sm" />
          </div>

          {isOpen && (
            <div className="flex flex-col transition-all duration-150">
              <span className="text-[16px] font-bold tracking-tight text-slate-900 dark:text-white">
                Ubais<span className="text-primary">ToolKit</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Pro Suite
              </span>
            </div>
          )}
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
                relative flex items-center transition-colors duration-150 group
                ${isActive
                  ? 'bg-primary/10 text-primary dark:bg-white/10 dark:text-white'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }
                ${isOpen ? 'gap-3 px-3 py-2.5 rounded-lg w-full' : 'w-10 h-10 mx-auto justify-center rounded-lg'}
              `}
              title={!isOpen ? tab.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <div className={`flex-shrink-0 transition-transform duration-150 ${!isOpen && 'group-hover:scale-110'}`}>
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary dark:text-white' : 'opacity-80'}`} strokeWidth={2} />
                  </div>

                  {isOpen && (
                    <span className="font-medium text-sm truncate">
                      {tab.label}
                    </span>
                  )}

                  {/* Active Indicator Pill for closed state */}
                  {!isOpen && isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary dark:bg-white rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Toggle */}
      <div className={`mt-auto border-t border-border flex flex-col transition-all ${isOpen ? 'p-4 gap-2' : 'p-2 items-center'}`}>
        {isOpen && (
          <div className="flex items-center justify-between px-1 py-1 mb-1">
            <div className="flex items-center gap-2">
              <a href="https://github.com/ubais88" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted/50">
                <Github className="w-4 h-4" />
              </a>
              <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted/50">
                <Bell className="w-4 h-4" />
              </button>
            </div>
            <ThemeToggle />
          </div>
        )}
        
        <button
          onClick={onToggle}
          className={`
            flex items-center justify-center rounded-lg transition-colors duration-150
            hover:bg-muted/50 text-muted-foreground hover:text-foreground
            ${isOpen ? 'w-full p-2' : 'w-10 h-10'}
          `}
        >
          {isOpen ? (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <ChevronsRight className="w-4 h-4 rotate-180" />
              <span>Collapse</span>
            </div>
          ) : (
            <ChevronsRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
