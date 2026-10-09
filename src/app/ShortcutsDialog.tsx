import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { IconButton, Kbd } from '../components/ui';

const SECTIONS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Global',
    items: [
      ['mod+k', 'Open command palette'],
      ['mod+b', 'Toggle sidebar'],
      ['g h', 'Go to dashboard'],
      ['/', 'Focus dashboard search'],
      ['?', 'Show keyboard shortcuts'],
    ],
  },
  {
    title: 'JSON Editor',
    items: [
      ['alt+shift+f', 'Format'],
      ['alt+shift+m', 'Minify'],
      ['alt+shift+s', 'Sort keys'],
      ['alt+shift+v', 'Validate'],
      ['alt+shift+r', 'Repair'],
      ['alt+shift+c', 'Copy'],
      ['alt+shift+t', 'Tree view'],
      ['ctrl+t', 'New tab'],
      ['ctrl+w', 'Close tab'],
      ['ctrl+s', 'Mark tab saved'],
      ['f2', 'Rename tab'],
    ],
  },
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 36 }}
            className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-popover shadow-popover"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border-subtle bg-popover px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <Keyboard className="h-4 w-4 text-primary" />
                <h2 id="shortcuts-title" className="text-sm font-semibold">
                  Keyboard shortcuts
                </h2>
              </div>
              <IconButton label="Close" size="sm" onClick={onClose} autoFocus>
                <X />
              </IconButton>
            </div>
            <div className="space-y-5 p-5">
              {SECTIONS.map((section) => (
                <section key={section.title}>
                  <h3 className="label-caps mb-2">{section.title}</h3>
                  <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
                    {section.items.map(([combo, label]) => (
                      <li key={combo} className="flex items-center justify-between px-3 py-2 text-13">
                        <span>{label}</span>
                        <Kbd combo={combo} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
