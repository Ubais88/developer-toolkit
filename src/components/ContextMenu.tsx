import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Timeout prevents immediate closure if the context menu was opened by a click
    setTimeout(() => {
      window.addEventListener('click', handleClickOutside);
      window.addEventListener('contextmenu', handleClickOutside);
      window.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('contextmenu', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to prevent going off-screen
  const safeX = Math.min(x, window.innerWidth - 200);
  const safeY = Math.min(y, window.innerHeight - (items.length * 40));

  const content = (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg py-1 w-48 text-sm animate-in fade-in zoom-in-95 duration-100"
      style={{ top: safeY, left: safeX }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className="h-px bg-slate-200 dark:bg-slate-700 my-1" />;
        }
        
        return (
          <button
            key={index}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            className={`w-full flex items-center px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              ${item.destructive ? 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300' : 'text-slate-700 dark:text-slate-200'}
            `}
          >
            {item.icon && <span className="mr-2 w-4 h-4">{item.icon}</span>}
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return createPortal(content, document.body);
};
