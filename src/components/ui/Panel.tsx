import type { ReactNode } from 'react';
import { cn } from './cn';

interface PanelProps {
  title?: ReactNode;
  icon?: ReactNode;
  /** Small right-aligned meta text in the header (e.g. "12 lines") */
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** A framed editor / output pane with an optional compact header bar. */
export function Panel({ title, icon, meta, actions, children, className, bodyClassName }: PanelProps) {
  const hasHeader = title || actions || meta;
  return (
    <section className={cn('hairline flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface-1', className)}>
      {hasHeader && (
        <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border-subtle pl-3.5 pr-1.5">
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
            {icon}
            {title && <span className="label-caps truncate">{title}</span>}
            {meta && <span className="truncate text-2xs text-muted-foreground/70">{meta}</span>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
        </header>
      )}
      <div className={cn('relative min-h-0 flex-1', bodyClassName)}>{children}</div>
    </section>
  );
}
