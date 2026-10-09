import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  size?: 'sm' | 'md';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ options, className, size = 'md', ...props }, ref) => (
  <div className={cn('relative inline-flex', className)}>
    <select
      ref={ref}
      className={cn(
        'w-full cursor-pointer appearance-none rounded-md border border-border bg-surface-1 pl-3 pr-8 font-medium text-foreground outline-none transition-[border-color,box-shadow] hover:border-border-strong focus:border-primary/60 focus:ring-[3px] focus:ring-primary/15',
        size === 'sm' ? 'h-7 text-xs' : 'h-9 text-13',
      )}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-popover text-popover-foreground">
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
  </div>
));
Select.displayName = 'Select';
