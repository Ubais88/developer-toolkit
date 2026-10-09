import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { cn } from '../../components/ui';
import { useClipboard } from '../../hooks/useClipboard';

/** Monospace number whose individual characters roll vertically when they change. */
export function RollingDigits({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn('inline-flex font-mono tabular-nums', className)}>
      <span className="sr-only">{value}</span>
      {value.split('').map((ch, i) => (
        <span key={i} aria-hidden className="relative inline-flex h-[1.15em] overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={ch}
              initial={{ y: '-70%', opacity: 0, filter: 'blur(2px)' }}
              animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: '70%', opacity: 0, filter: 'blur(2px)' }}
              transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.6 }}
              className="inline-block leading-[1.15em]"
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

interface CopyTileProps {
  label: ReactNode;
  value: string;
  /** What gets copied; defaults to `value`. */
  copyValue?: string | (() => string);
  hint?: ReactNode;
  className?: string;
  valueClassName?: string;
}

/** A whole-tile click-to-copy button (label + mono value) used for compact read-outs. */
export function CopyTile({ label, value, copyValue, hint, className, valueClassName }: CopyTileProps) {
  const { copy, copied } = useClipboard();
  const resolve = () => (typeof copyValue === 'function' ? copyValue() : (copyValue ?? value));
  return (
    <button
      type="button"
      onClick={() => copy(resolve())}
      aria-label={`Copy ${typeof label === 'string' ? label : 'value'}: ${value}`}
      className={cn(
        'focus-ring group relative flex min-w-0 flex-col gap-1 rounded-lg border border-border-subtle bg-surface-2/60 px-3 py-2.5 text-left',
        'transition-[border-color,background-color,box-shadow] duration-150 hover:border-primary/30 hover:bg-surface-2 active:scale-[0.99]',
        className,
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="label-caps truncate">{label}</span>
        <span
          className={cn(
            'text-muted-foreground transition-opacity duration-150',
            copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        </span>
      </span>
      <span className={cn('truncate font-mono text-13 tabular-nums text-foreground', valueClassName)}>{value}</span>
      {hint && <span className="truncate text-2xs text-muted-foreground">{hint}</span>}
    </button>
  );
}
