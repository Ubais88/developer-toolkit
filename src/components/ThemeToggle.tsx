import { AnimatePresence, motion } from 'framer-motion';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { IconButton } from './ui/IconButton';

const NEXT: Record<ThemeMode, ThemeMode> = { dark: 'light', light: 'system', system: 'dark' };
const LABEL: Record<ThemeMode, string> = { dark: 'Dark theme', light: 'Light theme', system: 'System theme' };

/** Cycles dark → light → system with an animated icon swap. */
export function ThemeToggle({ tooltipSide = 'bottom' }: { tooltipSide?: 'top' | 'bottom' | 'left' | 'right' }) {
  const { mode, setMode } = useTheme();
  const Icon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor;

  return (
    <IconButton
      label={`${LABEL[mode]} — switch to ${NEXT[mode]}`}
      tooltipSide={tooltipSide}
      onClick={() => setMode(NEXT[mode])}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mode}
          initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="inline-flex"
        >
          <Icon />
        </motion.span>
      </AnimatePresence>
    </IconButton>
  );
}
