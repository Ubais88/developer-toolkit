import type { ReactNode } from 'react';
import { cn } from './cn';

interface ToolHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Compact header strip shown at the top of each tool. */
export function ToolHeader({ icon, title, description, actions, className }: ToolHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-gradient-to-b from-primary/20 to-primary/5 text-primary shadow-glow-sm [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold leading-tight">{title}</h1>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
