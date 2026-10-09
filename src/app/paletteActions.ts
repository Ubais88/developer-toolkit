import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface PaletteAction {
  id: string;
  title: string;
  icon: LucideIcon;
  keywords?: string[];
  /** Shown as a hint only — the tool owns the actual key binding. */
  shortcut?: string;
  run: () => void;
}

let current: PaletteAction[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/**
 * Contributes commands to the palette's "current tool" group while the calling tool is mounted.
 * Handlers may close over fresh state on every render; the palette always calls the latest one.
 */
export function usePaletteActions(actions: PaletteAction[]) {
  const latest = useRef(actions);
  useLayoutEffect(() => {
    latest.current = actions;
  });

  // Only re-register when the visible list changes, not on every render
  const signature = actions.map((a) => `${a.id}:${a.title}`).join('|');
  useEffect(() => {
    const registered = latest.current.map((a) => ({
      ...a,
      run: () => latest.current.find((x) => x.id === a.id)?.run(),
    }));
    current = registered;
    emit();
    return () => {
      if (current === registered) {
        current = [];
        emit();
      }
    };
  }, [signature]);
}

export function useCurrentPaletteActions(): PaletteAction[] {
  return useSyncExternalStore(subscribe, () => current);
}
