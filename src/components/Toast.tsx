import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { Toast as ToastType } from '../hooks/useToast';

interface ToastProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export const Toast = ({ toasts, onRemove }: ToastProps) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
      {toasts.map(toast => {
        const config = {
          success: {
            bg: 'bg-emerald-500/10 dark:bg-emerald-500/5',
            border: 'border-emerald-500/20 dark:border-emerald-500/10',
            text: 'text-emerald-800 dark:text-emerald-300',
            icon: <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />,
            glow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]'
          },
          error: {
            bg: 'bg-rose-500/10 dark:bg-rose-500/5',
            border: 'border-rose-500/20 dark:border-rose-500/10',
            text: 'text-rose-800 dark:text-rose-300',
            icon: <XCircle className="w-4 h-4 text-rose-500 shrink-0" />,
            glow: 'shadow-[0_0_15px_-3px_rgba(244,63,94,0.15)]'
          },
          info: {
            bg: 'bg-sky-500/10 dark:bg-sky-500/5',
            border: 'border-sky-500/20 dark:border-sky-500/10',
            text: 'text-sky-800 dark:text-sky-300',
            icon: <Info className="w-4 h-4 text-sky-500 shrink-0" />,
            glow: 'shadow-[0_0_15px_-3px_rgba(14,165,233,0.15)]'
          }
        }[toast.type || 'info'];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3.5 px-4 py-3.5 rounded-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 duration-200 min-w-[280px] md:min-w-[320px] ${config.bg} ${config.border} ${config.text} ${config.glow}`}
          >
            {config.icon}
            <span className="flex-1 text-[13px] font-medium tracking-wide leading-relaxed">{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-md transition-all shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
