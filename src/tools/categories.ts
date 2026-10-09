import { Braces, Clock, Database, Globe, KeyRound, Settings2, Type, Wrench, type LucideIcon } from 'lucide-react';
import type { ToolCategory } from './types';

export interface CategoryDef {
  id: ToolCategory;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'json', label: 'JSON', icon: Braces },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'encoding', label: 'Encoding & Security', icon: KeyRound },
  { id: 'web', label: 'Web', icon: Globe },
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'utilities', label: 'Utilities', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<ToolCategory, CategoryDef>;
