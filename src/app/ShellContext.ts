import { createContext, useContext } from 'react';

export interface ShellApi {
  openPalette: () => void;
  openShortcuts: () => void;
  toggleSidebar: () => void;
  openMobileNav: () => void;
}

export const ShellContext = createContext<ShellApi | null>(null);

export function useShell(): ShellApi {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used inside AppShell');
  return ctx;
}
