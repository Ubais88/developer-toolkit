import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHotkeys } from '../hooks/useHotkeys';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useRecents, useSidebarPrefs } from '../hooks/usePrefs';
import { getToolByPath } from '../tools/registry';
import { CommandPalette } from './CommandPalette';
import { MobileNav } from './MobileNav';
import { RouteFallback } from './RouteFallback';
import { ShellContext, type ShellApi } from './ShellContext';
import { ShortcutsDialog } from './ShortcutsDialog';
import { SidebarContent } from './Sidebar';
import { TopBar } from './TopBar';

const SIDEBAR_WIDTH = 248;
const SIDEBAR_COLLAPSED = 56;

export function AppShell({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { collapsed, setCollapsed } = useSidebarPrefs();
  const { pushRecent } = useRecents();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Record recently used tools
  useEffect(() => {
    const tool = getToolByPath(pathname);
    if (tool && tool.category !== 'settings') pushRecent(tool.id);
    const title = tool ? `${tool.name} · Ubais Toolkit` : 'Ubais Toolkit';
    document.title = title;
  }, [pathname, pushRecent]);

  useEffect(() => {
    if (isDesktop) setMobileNavOpen(false);
  }, [isDesktop]);

  const toggleSidebar = useCallback(() => {
    if (isDesktop) setCollapsed((c) => !c);
    else setMobileNavOpen((o) => !o);
  }, [isDesktop, setCollapsed]);

  const shell = useMemo<ShellApi>(
    () => ({
      openPalette: () => setPaletteOpen(true),
      openShortcuts: () => setShortcutsOpen(true),
      toggleSidebar,
      openMobileNav: () => setMobileNavOpen(true),
    }),
    [toggleSidebar],
  );

  useHotkeys([
    { combo: 'mod+k', capture: true, handler: () => setPaletteOpen((o) => !o) },
    { combo: 'mod+b', capture: true, handler: toggleSidebar },
    { combo: '?', handler: () => setShortcutsOpen(true), enabled: !paletteOpen },
    { combo: 'g h', handler: () => navigate('/'), enabled: !paletteOpen },
  ]);

  return (
    <ShellContext.Provider value={shell}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-13 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="flex h-full overflow-hidden bg-background">
        {isDesktop && (
          <motion.aside
            initial={false}
            animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            className="chrome relative z-20 h-full shrink-0 overflow-hidden border-r border-border-subtle"
          >
            <div style={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH }} className="h-full">
              <SidebarContent collapsed={collapsed} idPrefix="desktop" onToggleCollapse={() => setCollapsed((c) => !c)} />
            </div>
          </motion.aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar showMenuButton={!isDesktop} />
          <main id="main" className="relative min-h-0 flex-1 overflow-hidden">
            <Suspense fallback={<RouteFallback />}>{children}</Suspense>
          </main>
        </div>
      </div>

      {!isDesktop && <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onToggleSidebar={toggleSidebar}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </ShellContext.Provider>
  );
}
