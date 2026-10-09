import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, cn } from '../../components/ui';

interface UtilityCardProps {
  id: string;
  icon: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Link to a dedicated full tool, e.g. { to: '/jwt', label: 'JWT Debugger' } */
  fullTool?: { to: string; label: string; onClick?: () => void };
  highlighted?: boolean;
  className?: string;
  children: ReactNode;
}

export function UtilityCard({ id, icon, title, description, actions, fullTool, highlighted, className, children }: UtilityCardProps) {
  return (
    <motion.div
      id={`du-${id}`}
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      className={cn('scroll-mt-4', className)}
    >
      <Card className={cn('h-full', highlighted && 'animate-flash border-primary/50')}>
        <CardHeader
          icon={icon}
          title={title}
          description={description}
          actions={
            <>
              {actions}
              {fullTool && (
                <Link
                  to={fullTool.to}
                  onClick={fullTool.onClick}
                  className="focus-ring ml-1 inline-flex items-center gap-0.5 rounded px-1.5 py-1 text-2xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  {fullTool.label}
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </>
          }
        />
        <div className="space-y-3 p-4">{children}</div>
      </Card>
    </motion.div>
  );
}

/** Read-only output box with a copy button in the corner. */
export function OutputBox({
  value,
  placeholder = 'Output appears here',
  error,
  mono = true,
  className,
  copy,
}: {
  value: string;
  placeholder?: string;
  error?: string | null;
  mono?: boolean;
  className?: string;
  copy?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'group relative min-h-[44px] rounded-md border px-3 py-2.5 pr-10 text-xs leading-relaxed',
        error ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-border bg-surface-2',
        className,
      )}
    >
      {error ? (
        <span>{error}</span>
      ) : value ? (
        <pre className={cn('whitespace-pre-wrap break-all text-foreground', mono ? 'font-mono' : 'font-sans')}>{value}</pre>
      ) : (
        <span className="text-muted-foreground/70">{placeholder}</span>
      )}
      {!error && value && <div className="absolute right-1.5 top-1.5">{copy}</div>}
    </div>
  );
}
