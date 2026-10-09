import { formatCombo } from '../../lib/platform';
import { cn } from './cn';

interface KbdProps {
  /** e.g. `mod+k` or a sequence `g h` */
  combo: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Kbd({ combo, size = 'md', className }: KbdProps) {
  const groups = combo.split(' ');
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {groups.map((group, gi) => (
        <span key={gi} className="inline-flex items-center gap-0.5">
          {gi > 0 && <span className="px-0.5 text-2xs text-muted-foreground">then</span>}
          {formatCombo(group).map((k, i) => (
            <kbd
              key={i}
              className={cn(
                'inline-flex items-center justify-center rounded border border-border-strong/70 bg-surface-2 font-sans font-medium text-muted-foreground shadow-[inset_0_-1px_0_0_hsl(var(--border-strong)/0.6)]',
                size === 'sm' ? 'h-4 min-w-4 px-1 text-[10px]' : 'h-5 min-w-5 px-1.5 text-2xs',
              )}
            >
              {k}
            </kbd>
          ))}
        </span>
      ))}
    </span>
  );
}
