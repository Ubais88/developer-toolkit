import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastApi {
  show: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const MAX_TOASTS = 3;
const DURATION: Record<ToastType, number> = { success: 2500, info: 3000, error: 4500 };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const schedule = useCallback(
    (id: number, type: ToastType) => {
      clearTimeout(timers.current.get(id));
      timers.current.set(id, setTimeout(() => dismiss(id), DURATION[type]));
    },
    [dismiss],
  );

  const show = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, type }].slice(-MAX_TOASTS));
      schedule(id, type);
    },
    [schedule],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
      info: (m) => show(m, 'info'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col items-end gap-2"
        >
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                onMouseEnter={() => clearTimeout(timers.current.get(toast.id))}
                onMouseLeave={() => schedule(toast.id, toast.type)}
                className="pointer-events-auto flex w-full items-center gap-3 rounded-lg border border-border bg-popover/95 px-3.5 py-2.5 text-13 text-popover-foreground shadow-popover backdrop-blur-md"
              >
                <ToastIcon type={toast.type} />
                <span className="flex-1 font-medium leading-snug">{toast.message}</span>
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="focus-ring -mr-1 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'error') return <XCircle className="h-4 w-4 shrink-0 text-destructive" />;
  if (type === 'info') return <Info className="h-4 w-4 shrink-0 text-primary" />;
  return <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
