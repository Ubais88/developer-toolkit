import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Github, Home, PanelLeftClose, PanelLeftOpen, Palette, Search, Star } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { IconButton, Kbd, Tooltip, cn } from '../components/ui';
import { useFavorites, useSidebarPrefs } from '../hooks/usePrefs';
import { TOOLS_BY_ID, toolsByCategory, type ToolDef } from '../tools/registry';
import { useShell } from './ShellContext';

interface SidebarContentProps {
  collapsed: boolean;
  /** Prefix for shared-layout ids so the desktop sidebar and mobile drawer don't collide */
  idPrefix: string;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}

const spring = { type: 'spring', stiffness: 500, damping: 40 } as const;

export function SidebarContent({ collapsed, idPrefix, onNavigate, onToggleCollapse }: SidebarContentProps) {
  const { openPalette } = useShell();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { closedSections, toggleSection } = useSidebarPrefs();

  const favoriteTools = favorites.map((id) => TOOLS_BY_ID[id]).filter((t): t is ToolDef => !!t);
  const groups = toolsByCategory((t) => !t.hideFromSidebar);

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn('flex h-13 shrink-0 items-center', collapsed ? 'justify-center px-2' : 'justify-between pl-4 pr-2')}>
        <NavLink to="/" onClick={onNavigate} className="focus-ring flex min-w-0 items-center gap-2.5 rounded-md" aria-label="Home">
          <Logo className="h-7 w-7 shrink-0" />
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate text-sm font-semibold tracking-tight">
              Ubais<span className="text-primary">Toolkit</span>
            </motion.span>
          )}
        </NavLink>
        {!collapsed && onToggleCollapse && (
          <IconButton label="Collapse sidebar" shortcut="mod+b" size="sm" tooltipSide="right" onClick={onToggleCollapse}>
            <PanelLeftClose />
          </IconButton>
        )}
      </div>

      {/* Search trigger */}
      <div className={cn('shrink-0 pb-2', collapsed ? 'px-2' : 'px-3')}>
        <Tooltip content="Search" shortcut="mod+k" side="right" disabled={!collapsed}>
          <button
            onClick={() => {
              onNavigate?.();
              openPalette();
            }}
            className={cn(
              'focus-ring group flex h-8 w-full items-center gap-2 rounded-md border border-border bg-surface-1 text-13 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground',
              collapsed ? 'justify-center' : 'px-2.5',
            )}
            aria-label="Search tools"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Search tools…</span>
                <Kbd combo="mod+k" size="sm" />
              </>
            )}
          </button>
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav aria-label="Tools" className={cn('flex-1 overflow-y-auto overflow-x-hidden pb-3', collapsed ? 'px-2' : 'px-3')}>
        <ul className="space-y-0.5">
          <SidebarLink
            to="/"
            end
            label="Home"
            icon={<Home />}
            collapsed={collapsed}
            layoutId={`${idPrefix}-home`}
            onNavigate={onNavigate}
          />
        </ul>

        {favoriteTools.length > 0 && (
          <Section id="favorites" label="Favorites" collapsed={collapsed} closed={closedSections.includes('favorites')} onToggle={toggleSection}>
            {favoriteTools.map((tool) => (
              <ToolLink
                key={tool.id}
                tool={tool}
                collapsed={collapsed}
                layoutId={`${idPrefix}-fav`}
                favorite
                onToggleFavorite={toggleFavorite}
                onNavigate={onNavigate}
              />
            ))}
          </Section>
        )}

        {groups.map(({ category, tools }) => (
          <Section
            key={category.id}
            id={category.id}
            label={category.label}
            collapsed={collapsed}
            closed={closedSections.includes(category.id)}
            onToggle={toggleSection}
          >
            {tools.map((tool) => (
              <ToolLink
                key={tool.id}
                tool={tool}
                collapsed={collapsed}
                layoutId={`${idPrefix}-nav`}
                favorite={isFavorite(tool.id)}
                onToggleFavorite={toggleFavorite}
                onNavigate={onNavigate}
              />
            ))}
          </Section>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('flex shrink-0 gap-1 border-t border-border-subtle p-2', collapsed ? 'flex-col items-center' : 'items-center')}>
        <Tooltip content="Appearance" side={collapsed ? 'right' : 'top'}>
          <NavLink
            to="/theme"
            onClick={onNavigate}
            aria-label="Appearance"
            className={({ isActive }) =>
              cn(
                'focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-surface-3 hover:text-foreground',
              )
            }
          >
            <Palette className="h-4 w-4" />
          </NavLink>
        </Tooltip>
        <Tooltip content="GitHub" side={collapsed ? 'right' : 'top'}>
          <a
            href="https://github.com/ubais88"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
          >
            <Github className="h-4 w-4" />
          </a>
        </Tooltip>
        <ThemeToggle tooltipSide={collapsed ? 'right' : 'top'} />
        {collapsed && onToggleCollapse && (
          <IconButton label="Expand sidebar" shortcut="mod+b" tooltipSide="right" onClick={onToggleCollapse}>
            <PanelLeftOpen />
          </IconButton>
        )}
      </div>
    </div>
  );
}

function Section({
  id,
  label,
  collapsed,
  closed,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  collapsed: boolean;
  closed: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  if (collapsed) {
    return (
      <div className="mt-2 border-t border-border-subtle pt-2">
        <ul className="space-y-0.5">{children}</ul>
      </div>
    );
  }
  return (
    <div className="mt-4">
      <button
        onClick={() => onToggle(id)}
        aria-expanded={!closed}
        className="focus-ring group mb-1 flex w-full items-center justify-between rounded px-2 py-0.5 label-caps transition-colors hover:text-foreground"
      >
        {label}
        <ChevronDown className={cn('h-3 w-3 opacity-0 transition-all group-hover:opacity-100', closed && '-rotate-90 opacity-100')} />
      </button>
      <AnimatePresence initial={false}>
        {!closed && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-0.5 overflow-hidden"
          >
            {children}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SidebarLinkProps {
  to: string;
  end?: boolean;
  label: string;
  icon: React.ReactNode;
  collapsed: boolean;
  layoutId: string;
  badge?: ToolDef['badge'];
  onNavigate?: () => void;
  onHover?: () => void;
  trailing?: React.ReactNode;
}

function SidebarLink({ to, end, label, icon, collapsed, layoutId, badge, onNavigate, onHover, trailing }: SidebarLinkProps) {
  return (
    <li className="group/item relative">
      <Tooltip content={label} side="right" disabled={!collapsed}>
        <NavLink
          to={to}
          end={end}
          onClick={onNavigate}
          onMouseEnter={onHover}
          onFocus={onHover}
          aria-label={collapsed ? label : undefined}
          className={({ isActive }) =>
            cn(
              'focus-ring relative flex h-8 items-center rounded-md text-13 font-medium transition-colors',
              collapsed ? 'w-full justify-center' : 'gap-2.5 px-2.5',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  transition={spring}
                  className="absolute inset-0 rounded-md border border-border bg-surface-3/80 shadow-sm"
                >
                  <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-x-[1px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
                </motion.span>
              )}
              <span className={cn('relative z-10 inline-flex [&_svg]:h-4 [&_svg]:w-4', isActive && 'text-primary')}>{icon}</span>
              {!collapsed && <span className="relative z-10 flex-1 truncate">{label}</span>}
              {!collapsed && badge === 'new' && (
                <span className="relative z-10 rounded bg-primary/10 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary transition-opacity group-hover/item:opacity-0">
                  new
                </span>
              )}
              {collapsed && badge === 'new' && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />}
            </>
          )}
        </NavLink>
      </Tooltip>
      {trailing}
    </li>
  );
}

interface ToolLinkProps {
  tool: ToolDef;
  collapsed: boolean;
  layoutId: string;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onNavigate?: () => void;
}

function ToolLink({ tool, collapsed, layoutId, favorite, onToggleFavorite, onNavigate }: ToolLinkProps) {
  const Icon = tool.icon;
  return (
    <SidebarLink
      to={tool.path}
      label={tool.name}
      icon={<Icon />}
      collapsed={collapsed}
      layoutId={layoutId}
      badge={tool.badge}
      onNavigate={onNavigate}
      onHover={() => void tool.preload()}
      trailing={
        !collapsed && (
          <button
            onClick={() => onToggleFavorite(tool.id)}
            aria-label={favorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
            aria-pressed={favorite}
            className={cn(
              'focus-ring absolute right-1.5 top-1/2 z-20 -translate-y-1/2 rounded p-1 transition-all hover:bg-surface-3',
              favorite ? 'text-warning opacity-0 group-hover/item:opacity-100' : 'text-muted-foreground opacity-0 hover:text-foreground group-hover/item:opacity-100 focus-visible:opacity-100',
            )}
          >
            <Star className={cn('h-3.5 w-3.5', favorite && 'fill-current')} />
          </button>
        )
      }
    />
  );
}
