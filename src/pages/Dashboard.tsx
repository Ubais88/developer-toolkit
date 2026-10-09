import { useMemo, useRef, useState, type MouseEvent } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Clock, Search, ShieldCheck, Sparkles, Star, Wrench, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useShell } from '../app/ShellContext';
import { Badge, Kbd, cn } from '../components/ui';
import { useHotkeys } from '../hooks/useHotkeys';
import { useFavorites, useRecents } from '../hooks/usePrefs';
import { formatRelative, greeting } from '../lib/time';
import { CATEGORIES, CATEGORY_BY_ID } from '../tools/categories';
import { TOOLS, TOOLS_BY_ID, toolsByCategory, type ToolCategory, type ToolDef } from '../tools/registry';

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.025, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 32 } },
};

interface SearchResult {
  tool: ToolDef;
  path: string;
  name: string;
  description: string;
  sub?: boolean;
}

function matches(haystack: string[], query: string) {
  const text = haystack.join(' ').toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => text.includes(term));
}

export function Dashboard() {
  const navigate = useNavigate();
  const { openPalette } = useShell();
  const { favorites } = useFavorites();
  const { recents } = useRecents();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ToolCategory | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useHotkeys([{ combo: '/', handler: () => inputRef.current?.focus() }]);

  const favoriteTools = favorites.map((id) => TOOLS_BY_ID[id]).filter((t): t is ToolDef => !!t);
  const recentEntries = recents.filter((r) => TOOLS_BY_ID[r.id]).slice(0, 6);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const out: SearchResult[] = [];
    for (const tool of TOOLS) {
      if (matches([tool.name, tool.description, CATEGORY_BY_ID[tool.category].label, ...tool.keywords], query)) {
        out.push({ tool, path: tool.path, name: tool.name, description: tool.description });
      }
      for (const sub of tool.subTools ?? []) {
        if (matches([sub.name, sub.description, ...sub.keywords], query)) {
          out.push({ tool, path: `${tool.path}?tool=${sub.id}`, name: sub.name, description: `${sub.description} · ${tool.name}`, sub: true });
        }
      }
    }
    return out;
  }, [query]);

  const groups = toolsByCategory((t) => t.category !== 'settings' && (category === 'all' || t.category === category));
  const visibleCategories = CATEGORIES.filter((c) => c.id !== 'settings');

  return (
    <div className="h-full overflow-y-auto">
      <div className="relative">
        <div aria-hidden className="bg-aurora pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-50" />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-8 md:pt-16">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface-1/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              {TOOLS.length - 1} tools · everything runs locally in your browser
            </div>
            <h1 className="text-gradient text-3xl font-semibold tracking-tight md:text-[2.75rem] md:leading-[1.1]">{greeting()}</h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">What do you need to wrangle today?</p>

            {/* Search */}
            <div className="group relative mx-auto mt-8 max-w-xl">
              <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-primary/40 via-primary/10 to-primary/40 opacity-0 blur-sm transition-opacity duration-300 group-focus-within:opacity-100" />
              <div className="relative flex h-12 items-center gap-3 rounded-xl border border-border bg-surface-1 px-4 shadow-elevated transition-colors group-focus-within:border-primary/50">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && results[0]) navigate(results[0].path);
                    if (e.key === 'Escape') setQuery('');
                  }}
                  placeholder="Search tools — try “jwt”, “diff” or “uuid”"
                  aria-label="Search tools"
                  className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                />
                {query ? (
                  <button onClick={() => setQuery('')} aria-label="Clear search" className="focus-ring rounded p-1 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <Kbd combo="/" size="sm" />
                )}
              </div>
            </div>
            <button
              onClick={openPalette}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              or press <Kbd combo="mod+k" size="sm" /> anywhere to jump to a tool or run an action
            </button>
          </motion.div>

          <>
            {query.trim() ? (
              <motion.section
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="mt-12"
              >
                <SectionTitle icon={<Search />} title={`${results.length} result${results.length === 1 ? '' : 's'}`} />
                {results.length === 0 ? (
                  <p className="py-10 text-center text-13 text-muted-foreground">No tools match “{query}”.</p>
                ) : (
                  <motion.div variants={container} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((r, i) => (
                      <motion.div key={r.path} variants={item}>
                        <ToolCard tool={r.tool} to={r.path} name={r.name} description={r.description} sub={r.sub} highlight={i === 0} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.section>
            ) : (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }}  transition={{ duration: 0.15 }}>
                {/* Favorites */}
                {favoriteTools.length > 0 && (
                  <section className="mt-12">
                    <SectionTitle icon={<Star />} title="Favorites" />
                    <motion.div variants={container} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {favoriteTools.map((tool) => (
                        <motion.div key={tool.id} variants={item} layout>
                          <ToolCard tool={tool} compact />
                        </motion.div>
                      ))}
                    </motion.div>
                  </section>
                )}

                {/* Recent */}
                {recentEntries.length > 0 && (
                  <section className="mt-10">
                    <SectionTitle icon={<Clock />} title="Jump back in" />
                    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-wrap gap-2">
                      {recentEntries.map((r) => {
                        const tool = TOOLS_BY_ID[r.id];
                        const Icon = tool.icon;
                        return (
                          <motion.div key={r.id} variants={item}>
                            <Link
                              to={tool.path}
                              onMouseEnter={() => void tool.preload()}
                              className="focus-ring group flex items-center gap-2.5 rounded-lg border border-border bg-surface-1 py-1.5 pl-2 pr-3 text-13 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface-2"
                            >
                              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <span className="font-medium">{tool.name}</span>
                              <span className="text-xs text-muted-foreground">{formatRelative(r.at)}</span>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </section>
                )}

                {/* All tools */}
                <section className="mt-12">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <SectionTitle icon={<Sparkles />} title="All tools" className="mb-0" />
                    <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
                      <CategoryChip active={category === 'all'} onClick={() => setCategory('all')} label="All" />
                      {visibleCategories.map((c) => (
                        <CategoryChip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)} label={c.label} />
                      ))}
                    </div>
                  </div>

                  <motion.div key={category} variants={container} initial="hidden" animate="show" className="space-y-10">
                    {groups.map(({ category: cat, tools }) => {
                      const CatIcon = cat.icon;
                      return (
                        <div key={cat.id}>
                          <motion.h3 variants={item} className="label-caps mb-3 flex items-center gap-2">
                            <CatIcon className="h-3.5 w-3.5" />
                            {cat.label}
                            <span className="text-muted-foreground/50">{tools.length}</span>
                          </motion.h3>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {tools.map((tool) => (
                              <motion.div key={tool.id} variants={item}>
                                <ToolCard tool={tool} />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </section>
              </motion.div>
            )}
          </>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, className }: { icon: React.ReactNode; title: string; className?: string }) {
  return (
    <h2 className={cn('mb-4 flex items-center gap-2 text-13 font-semibold text-foreground [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-primary', className)}>
      {icon}
      {title}
    </h2>
  );
}

function CategoryChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'focus-ring relative h-7 shrink-0 rounded-full px-3 text-xs font-medium transition-colors',
        active ? 'text-primary-foreground' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
      )}
    >
      {active && (
        <motion.span
          layoutId="dashboard-category"
          className="absolute inset-0 rounded-full bg-primary shadow-glow-sm"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
      <span className="relative">{label}</span>
    </button>
  );
}

interface ToolCardProps {
  tool: ToolDef;
  to?: string;
  name?: string;
  description?: string;
  compact?: boolean;
  sub?: boolean;
  highlight?: boolean;
}

/** Tool card with a cursor-following spotlight and hover lift. */
function ToolCard({ tool, to, name, description, compact, sub, highlight }: ToolCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(tool.id);
  const Icon = sub ? Wrench : tool.icon;

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseEnter={() => void tool.preload()}
      className={cn(
        'hairline group relative h-full overflow-hidden rounded-xl border bg-surface-1 transition-[border-color,transform,box-shadow] duration-200 ease-spring',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow-sm',
        highlight ? 'border-primary/40' : 'border-border',
      )}
    >
      {/* Spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), hsl(var(--primary) / 0.10), transparent 70%)' }}
      />
      <Link to={to ?? tool.path} className="focus-ring relative flex h-full flex-col gap-3 rounded-xl p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-gradient-to-b from-primary/20 to-primary/5 text-primary transition-transform duration-300 ease-spring group-hover:scale-110 group-hover:-rotate-3">
            <Icon className="h-4 w-4" />
          </span>
          {tool.badge === 'new' && !compact && (
            <Badge tone="primary" className="mr-7">
              New
            </Badge>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="flex items-center gap-1.5 truncate text-13 font-semibold text-foreground">
            {name ?? tool.name}
            <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
          </h4>
          {!compact && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description ?? tool.description}</p>}
        </div>
      </Link>
      {!sub && (
        <button
          onClick={() => toggleFavorite(tool.id)}
          aria-label={fav ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
          aria-pressed={fav}
          className={cn(
            'focus-ring absolute right-3 top-3 z-10 rounded-md p-1.5 transition-all hover:bg-surface-3',
            fav ? 'text-warning' : 'text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100',
          )}
        >
          <motion.span key={String(fav)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 14 }} className="inline-flex">
            <Star className={cn('h-3.5 w-3.5', fav && 'fill-current')} />
          </motion.span>
        </button>
      )}
    </div>
  );
}
