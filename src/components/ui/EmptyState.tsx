import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from './cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, hint, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex h-full flex-col items-center justify-center gap-3 p-8 text-center', className)}
    >
      {icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2 text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-13 font-medium text-foreground">{title}</p>
        {hint && <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </motion.div>
  );
}
