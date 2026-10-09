import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { cn } from '../../components/ui';

export interface ContextMenuItem {
  label?: string;
  icon?: ReactNode;
  shortcut?: string;
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
  const [pos, setPos] = useState({ x, y });

  // Keep the menu on screen
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPos({ x: Math.min(x, window.innerWidth - width - 8), y: Math.min(y, window.innerHeight - height - 8) });
  }, [x, y]);

  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])')?.focus();

    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? []);
      const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = e.key === 'ArrowDown' ? (i + 1) % buttons.length : (i - 1 + buttons.length) % buttons.length;
      buttons[next]?.focus();
    };
    const t = setTimeout(() => {
      window.addEventListener('mousedown', onPointer);
      window.addEventListener('contextmenu', onPointer);
    }, 10);
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', onClose);
    return () => {
      clearTimeout(t);
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('contextmenu', onPointer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onClose);
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      ref={menuRef}
      role="menu"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
      style={{ top: pos.y, left: pos.x, transformOrigin: 'top left' }}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-[200] w-52 rounded-lg border border-border bg-popover/95 p-1 text-13 text-popover-foreground shadow-popover backdrop-blur-md"
    >
      {items.map((item, index) =>
        item.divider ? (
          <div key={`divider-${index}`} role="separator" className="my-1 h-px bg-border-subtle" />
        ) : (
          <button
            key={index}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left outline-none transition-colors',
              'hover:bg-surface-3 focus:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5',
              item.destructive ? 'text-destructive' : 'text-foreground',
            )}
          >
            {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && <span className="text-2xs text-muted-foreground">{item.shortcut}</span>}
          </button>
        ),
      )}
    </motion.div>,
    document.body,
  );
};
