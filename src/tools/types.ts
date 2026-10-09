import type { ComponentType, LazyExoticComponent } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ToolCategory = 'json' | 'text' | 'encoding' | 'web' | 'time' | 'database' | 'utilities' | 'settings';

export interface SubTool {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

export interface ToolDef {
  /** Stable id — stored in favorites / recents */
  id: string;
  name: string;
  /** One line, shown on dashboard cards and in the palette */
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  path: string;
  keywords: string[];
  component: LazyExoticComponent<ComponentType>;
  /** Warm the tool's chunk (on hover / palette highlight) */
  preload: () => Promise<unknown>;
  subTools?: SubTool[];
  badge?: 'new' | 'beta';
  hideFromSidebar?: boolean;
}
