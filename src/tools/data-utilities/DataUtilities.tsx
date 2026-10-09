import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Hash, ShieldCheck, Sheet, Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, ToolHeader, cn } from '../../components/ui';
import { useSessionState } from '../../hooks/useSessionState';
import { Converters } from './Converters';
import { Encoders } from './Encoders';
import { Generators } from './Generators';
import { DATA_SUBTOOLS, SUBTOOL_BY_ID, type UtilityCategory } from './subTools';
import { TextTools } from './TextTools';

const CATEGORIES: { id: UtilityCategory; name: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'generators', name: 'Generators', icon: <Hash />, desc: 'UUIDs, hashes & placeholder text' },
  { id: 'encoders', name: 'Encoders', icon: <ShieldCheck />, desc: 'Base64, URL, JWT & HTML entities' },
  { id: 'converters', name: 'Converters', icon: <Sheet />, desc: 'JSON, CSV & Excel bytes' },
  { id: 'text', name: 'Text & time', icon: <Clock />, desc: 'Escaping, casing, lists & epochs' },
];

export const DataUtilities = () => {
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useSessionState<UtilityCategory>('data-category', 'generators');
  const [highlight, setHighlight] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toolParam = params.get('tool');

  // Deep link: /data?tool=uuid → open its category, scroll to and flash the card
  useEffect(() => {
    const sub = toolParam ? SUBTOOL_BY_ID[toolParam] : undefined;
    if (!sub) return;
    setCategory(sub.category);
    setHighlight(sub.id);
    const scroll = setTimeout(() => {
      document.getElementById(`du-${sub.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 320);
    const clear = setTimeout(() => setHighlight(null), 2000);
    return () => {
      clearTimeout(scroll);
      clearTimeout(clear);
    };
  }, [toolParam, setCategory]);

  const selectCategory = (id: UtilityCategory) => {
    setCategory(id);
    if (toolParam) setParams({}, { replace: true });
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const current = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];
  const count = (id: UtilityCategory) => DATA_SUBTOOLS.filter((s) => s.category === id).length;

  return (
    <div className="flex h-full min-h-0">
      {/* Category rail (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-border-subtle p-3 lg:flex">
        <div className="label-caps px-2.5 pb-2 pt-1">Categories</div>
        {CATEGORIES.map((c) => {
          const active = c.id === category;
          return (
            <button
              key={c.id}
              onClick={() => selectCategory(c.id)}
              className={cn(
                'focus-ring relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId="data-category"
                  className="absolute inset-0 rounded-lg border border-border bg-surface-2"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span
                className={cn(
                  'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md border [&_svg]:h-3.5 [&_svg]:w-3.5',
                  active ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-surface-1',
                )}
              >
                {c.icon}
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="block text-13 font-medium">{c.name}</span>
                <span className="block truncate text-2xs text-muted-foreground">{c.desc}</span>
              </span>
              <span className="relative text-2xs text-muted-foreground/70">{count(c.id)}</span>
            </button>
          );
        })}
      </aside>

      <div ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 md:p-6">
          <ToolHeader icon={<Wrench />} title="Data Utilities" description={current.desc} />

          {/* Category tabs (mobile / tablet) */}
          <Tabs
            className="-mx-1 border-b border-border-subtle lg:hidden"
            value={category}
            onChange={selectCategory}
            items={CATEGORIES.map((c) => ({ value: c.id, label: c.name, icon: c.icon }))}
          />

          {/* CSS enter animation keyed on category — can't get stuck mid-transition */}
          <div key={category} className="animate-enter">
            {category === 'generators' && <Generators highlight={highlight} />}
            {category === 'encoders' && <Encoders highlight={highlight} />}
            {category === 'converters' && <Converters highlight={highlight} />}
            {category === 'text' && <TextTools highlight={highlight} />}
          </div>
        </div>
      </div>
    </div>
  );
};
