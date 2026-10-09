import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { interactive?: boolean }>(
  ({ className, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'hairline rounded-xl border border-border bg-surface-1',
        interactive &&
          'transition-[border-color,box-shadow,transform,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface-2 hover:shadow-glow-sm',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, icon, actions, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-3', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:h-3.5 [&_svg]:w-3.5">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-13 font-semibold">{title}</h3>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
