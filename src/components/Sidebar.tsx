import { ChevronsRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  tabs: { id: string; label: string; icon: any }[];
}

export const Sidebar = ({ isOpen, onToggle, tabs }: SidebarProps) => {
  return (
    <aside
      className={`fixed top-4 left-4 bottom-4 z-40 flex flex-col transition-all duration-300 ease-in-out font-sans 
        ${isOpen ? 'w-72' : 'w-20'}
        glass rounded-2xl border border-white/20 dark:border-white/5
      `}
    >
      {/* Header */}
      <div className="h-20 flex items-center px-6 mb-2">
        <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap w-full">
          <div className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? '' : 'mx-auto'}`}>
            <Logo className="w-10 h-10 text-primary drop-shadow-sm" />
          </div>

          <div className={`flex flex-col transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 w-0 absolute'}`}>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ghost<span className="text-primary">ToolKit</span>
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Pro Suite
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const path = tab.id === 'json' ? '/' : `/${tab.id}`;

          return (
            <NavLink
              key={tab.id}
              to={path}
              className={({ isActive }) => `
                relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group
                ${isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }
                ${!isOpen && 'justify-center px-2'}
              `}
              title={!isOpen ? tab.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <div className={`flex-shrink-0 transition-transform duration-200 ${!isOpen && 'group-hover:scale-110'}`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : ''}`} strokeWidth={2} />
                  </div>

                  {isOpen && (
                    <span className="font-medium text-[15px] truncate">
                      {tab.label}
                    </span>
                  )}

                  {/* Active Indicator Pille for closed state */}
                  {!isOpen && isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Toggle */}
      <div className="p-4 mt-auto">
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200
            hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white
            ${!isOpen && 'aspect-square'}
          `}
        >
          {isOpen ? (
            <div className="flex items-center gap-2 text-sm font-medium">
              <ChevronsRight className="w-5 h-5 rotate-180" />
              <span>Collapse Sidebar</span>
            </div>
          ) : (
            <ChevronsRight className="w-6 h-6" />
          )}
        </button>
      </div>
    </aside>
  );
};
