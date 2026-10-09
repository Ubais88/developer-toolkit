import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from './cn';

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: TabItem<T>[];
  className?: string;
}

/** Underlined tab strip with a sliding indicator and arrow-key navigation. */
export function Tabs<T extends string>({ value, onChange, items, className }: TabsProps<T>) {
  const layoutId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    refs.current[next]?.focus();
    onChange(items[next].value);
  };

  return (
    <div role="tablist" className={cn('no-scrollbar flex items-center gap-1 overflow-x-auto', className)}>
      {items.map((item, i) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onChange(item.value)}
            className={cn(
              'focus-ring relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-13 font-medium transition-colors [&_svg]:h-3.5 [&_svg]:w-3.5',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.icon}
            {item.label}
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
