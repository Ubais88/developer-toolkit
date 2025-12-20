import { X, ChevronRight } from 'lucide-react';
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
      className={`fixed top-0 left-0 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-40 flex flex-col ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="h-14 flex items-center px-4 border-b border-slate-100 dark:border-slate-700 font-sans relative">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
           <Logo className="w-8 h-8 text-primary flex-shrink-0 transition-transform duration-300" />
           <div className={`flex flex-col bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'}`}>
            <span className="text-lg font-bold leading-tight">
              Ghost Toolkit
            </span>
            <span className="text-[10px] font-medium text-slate-400 tracking-wider">
              Mohd Ubais
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onToggle}
          className={`ml-auto p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180 pointer-events-none absolute right-4'}`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Open Button (Floating) */}
        <button
          onClick={onToggle}
          className={`absolute -right-3 top-1/2 -translate-y-1/2 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 z-50 transition-all duration-300 ${!isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}`}
          title="Open Sidebar"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* If closed, show toggle button in a different way or rely on footer/shortcut? 
          The original code had the button inside the header flex. 
          If closed (w-16), checking the existing code:
          It rendered <span className="mx-auto ...">GT</span> and the button next to it? 
          Wait, justify-between.
          If w-16, "GT" takes space, toggle takes space.
          The toggle was X or ChevronRight.
          If I put Logo in center for closed state, where does the toggle go?
          Typically a small sidebar has the toggle at bottom or top.
          The user's code had:
          header { flex justify-between }
          if !isOpen { <GT /> } <Button />
          So GT and Button were side-by-side or squashed in w-16?
          w-16 is 4rem (64px). 
          GT text and a wrapper button.
          I will keep the button logic but maybe make it cleaner.
      */}

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const path = tab.id === 'json' ? '/' : `/${tab.id}`;
          
          return (
            <NavLink
              key={tab.id}
              to={path}
              className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all duration-200 ${
                isActive
                  ? 'bg-primary-light text-primary'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
              } ${!isOpen && 'justify-center'}`}
              title={!isOpen ? tab.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`${
                      isActive
                        ? 'text-primary'
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {isOpen && <span className="font-medium text-sm whitespace-nowrap">{tab.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {isOpen && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="text-xs text-slate-400 flex items-center gap-2 justify-center">
            <kbd className="px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-sm font-mono text-[10px]">
              Ctrl+K
            </kbd>
            <span>to cycle tabs</span>
          </div>
        </div>
      )}
    </aside>
  );
};
