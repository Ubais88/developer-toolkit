import { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Kbd } from './Kbd';

type Side = 'top' | 'bottom' | 'right' | 'left';

interface TooltipProps {
  content: ReactNode;
  shortcut?: string;
  side?: Side;
  delay?: number;
  disabled?: boolean;
  children: ReactElement;
}

const OFFSET = 8;

/** Lightweight tooltip rendered in a portal so it never gets clipped by overflow containers. */
export function Tooltip({ content, shortcut, side = 'top', delay = 350, disabled, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const id = useId();

  const show = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = side === 'right' ? r.right + OFFSET : side === 'left' ? r.left - OFFSET : r.left + r.width / 2;
      const y = side === 'top' ? r.top - OFFSET : side === 'bottom' ? r.bottom + OFFSET : r.top + r.height / 2;
      setPos({ x, y });
      setOpen(true);
    }, delay);
  }, [delay, side]);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!isValidElement(children) || disabled || !content) return children;

  const childProps = children.props as Record<string, unknown>;
  const childRef = (children as unknown as { ref?: React.Ref<HTMLElement> }).ref;
  const trigger = cloneElement(children as ReactElement<Record<string, unknown>>, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      if (typeof childRef === 'function') childRef(node);
      else if (childRef && typeof childRef === 'object') (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    onMouseEnter: (e: React.MouseEvent) => {
      (childProps.onMouseEnter as ((e: React.MouseEvent) => void) | undefined)?.(e);
      show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      (childProps.onMouseLeave as ((e: React.MouseEvent) => void) | undefined)?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      (childProps.onFocus as ((e: React.FocusEvent) => void) | undefined)?.(e);
      if ((e.target as HTMLElement).matches?.(':focus-visible')) show();
    },
    onBlur: (e: React.FocusEvent) => {
      (childProps.onBlur as ((e: React.FocusEvent) => void) | undefined)?.(e);
      hide();
    },
    onMouseDown: (e: React.MouseEvent) => {
      (childProps.onMouseDown as ((e: React.MouseEvent) => void) | undefined)?.(e);
      hide();
    },
    'aria-describedby': open ? id : undefined,
  });

  const translate =
    side === 'top' ? 'translate(-50%, -100%)'
    : side === 'bottom' ? 'translate(-50%, 0)'
    : side === 'right' ? 'translate(0, -50%)'
    : 'translate(-100%, -50%)';

  const initialOffset =
    side === 'top' ? { y: 4 } : side === 'bottom' ? { y: -4 } : side === 'right' ? { x: -4 } : { x: 4 };

  return (
    <>
      {trigger}
      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="pointer-events-none fixed z-[200]" style={{ left: pos.x, top: pos.y, transform: translate }}>
              <motion.div
                id={id}
                role="tooltip"
                initial={{ opacity: 0, scale: 0.96, ...initialOffset }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-popover"
              >
                {content}
                {shortcut && <Kbd combo={shortcut} size="sm" />}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
