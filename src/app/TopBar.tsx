import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Keyboard, Menu, Search, Star } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { IconButton, Kbd, cn } from '../components/ui';
import { useFavorites } from '../hooks/usePrefs';
import { CATEGORY_BY_ID } from '../tools/categories';
import { getToolByPath } from '../tools/registry';
import { useShell } from './ShellContext';

export function TopBar({ showMenuButton }: { showMenuButton: boolean }) {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { openPalette, openMobileNav, openShortcuts } = useShell();
  const { isFavorite, toggleFavorite } = useFavorites();

  const tool = getToolByPath(pathname);
  const subTool = tool?.subTools?.find((s) => s.id === params.get('tool'));
  const fav = tool ? isFavorite(tool.id) : false;

  return (
    <header className="chrome sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-3 md:px-4">
      {showMenuButton && (
        <IconButton label="Open menu" onClick={openMobileNav}>
          <Menu />
        </IconButton>
      )}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-13">
        <Link to="/" className="focus-ring shrink-0 rounded px-1 text-muted-foreground transition-colors hover:text-foreground">
          Home
        </Link>
        <AnimatePresence mode="popLayout" initial={false}>
          {tool && (
            <motion.div
              key={tool.id + (subTool?.id ?? '')}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex min-w-0 items-center gap-1"
            >
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              <span className="hidden shrink-0 text-muted-foreground sm:inline">{CATEGORY_BY_ID[tool.category].label}</span>
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/50 sm:inline" />
              {subTool ? (
                <>
                  <Link to={tool.path} className="focus-ring truncate rounded px-0.5 text-muted-foreground transition-colors hover:text-foreground">
                    {tool.name}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  <span className="truncate font-medium text-foreground">{subTool.name}</span>
                </>
              ) : (
                <span className="truncate font-medium text-foreground">{tool.name}</span>
              )}
              {tool.category !== 'settings' && (
                <IconButton
                  label={fav ? 'Remove from favorites' : 'Add to favorites'}
                  size="sm"
                  active={false}
                  onClick={() => toggleFavorite(tool.id)}
                  className={cn('ml-0.5', fav && 'text-warning hover:text-warning')}
                >
                  <motion.span key={String(fav)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 15 }} className="inline-flex">
                    <Star className={cn(fav && 'fill-current')} />
                  </motion.span>
                </IconButton>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Actions */}
      <button
        onClick={openPalette}
        className="focus-ring hidden h-8 items-center gap-2 rounded-md border border-border bg-surface-1 pl-2.5 pr-1.5 text-13 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground sm:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="pr-6">Search or jump to…</span>
        <Kbd combo="mod+k" size="sm" />
      </button>
      <IconButton label="Search" className="sm:hidden" onClick={openPalette}>
        <Search />
      </IconButton>
      <IconButton label="Keyboard shortcuts" shortcut="?" className="hidden md:inline-flex" onClick={openShortcuts}>
        <Keyboard />
      </IconButton>
      <ThemeToggle />
    </header>
  );
}
