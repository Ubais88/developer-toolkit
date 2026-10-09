import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'border-border bg-surface-2 text-muted-foreground',
  primary: 'border-primary/30 bg-primary/10 text-primary',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ tone = 'neutral', className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-full border px-2 text-2xs font-semibold [&_svg]:h-3 [&_svg]:w-3',
      tones[tone],
      className,
    )}
    {...props}
  />
));
Badge.displayName = 'Badge';
