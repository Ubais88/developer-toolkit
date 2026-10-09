import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'subtle';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm' | 'none';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.18)] hover:bg-primary/90 hover:shadow-glow-sm',
  secondary: 'border border-border bg-surface-2 text-foreground hover:bg-surface-3 hover:border-border-strong',
  outline: 'border border-border bg-transparent text-foreground hover:bg-surface-2 hover:border-border-strong',
  ghost: 'text-muted-foreground hover:bg-surface-3 hover:text-foreground',
  subtle: 'bg-primary/10 text-primary hover:bg-primary/15',
  danger: 'bg-destructive/10 text-destructive hover:bg-destructive/15',
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 gap-1.5 px-2.5 text-xs',
  sm: 'h-8 gap-1.5 px-3 text-13',
  md: 'h-9 gap-2 px-4 text-13',
  lg: 'h-11 gap-2 px-6 text-sm',
  icon: 'h-8 w-8',
  'icon-sm': 'h-7 w-7',
  none: '',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, className, disabled, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'focus-ring inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md font-medium',
        'transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
