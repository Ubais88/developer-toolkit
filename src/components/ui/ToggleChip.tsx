import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from './cn';

interface ToggleChipProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  title?: string;
}

export function ToggleChip({ checked, onChange, children, icon, className, title }: ToggleChipProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={title}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-ring inline-flex h-7 select-none items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all duration-150 active:scale-[0.97]',
        checked
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-transparent text-muted-foreground hover:border-border-strong hover:text-foreground',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong',
        )}
      >
        {checked && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </span>
      {icon}
      {children}
    </button>
  );
}
