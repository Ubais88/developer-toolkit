import { useCallback } from 'react';
import { createPersistentStore, useStore } from '../lib/persistentStore';

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

export interface RecentEntry {
  id: string;
  at: number;
}

const MAX_RECENTS = 8;

const favoritesStore = createPersistentStore<string[]>('dtk:favorites', [], asStringArray);

const recentsStore = createPersistentStore<RecentEntry[]>('dtk:recents', [], (v) =>
  Array.isArray(v)
    ? v.filter((x): x is RecentEntry => !!x && typeof x.id === 'string' && typeof x.at === 'number')
    : [],
);

interface SidebarPrefs {
  collapsed: boolean;
  closedSections: string[];
}

const sidebarStore = createPersistentStore<SidebarPrefs>('dtk:sidebar', { collapsed: false, closedSections: [] }, (v) => {
  const obj = (v ?? {}) as Partial<SidebarPrefs>;
  return { collapsed: !!obj.collapsed, closedSections: asStringArray(obj.closedSections) };
});

export function useFavorites() {
  const favorites = useStore(favoritesStore);
  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);
  const toggleFavorite = useCallback((id: string) => {
    favoritesStore.set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);
  return { favorites, isFavorite, toggleFavorite };
}

export function useRecents() {
  const recents = useStore(recentsStore);
  const pushRecent = useCallback((id: string) => {
    recentsStore.set((prev) => [{ id, at: Date.now() }, ...prev.filter((r) => r.id !== id)].slice(0, MAX_RECENTS));
  }, []);
  const clearRecents = useCallback(() => recentsStore.set([]), []);
  return { recents, pushRecent, clearRecents };
}

export function useSidebarPrefs() {
  const prefs = useStore(sidebarStore);
  const setCollapsed = useCallback((collapsed: boolean | ((prev: boolean) => boolean)) => {
    sidebarStore.set((prev) => ({
      ...prev,
      collapsed: typeof collapsed === 'function' ? collapsed(prev.collapsed) : collapsed,
    }));
  }, []);
  const toggleSection = useCallback((section: string) => {
    sidebarStore.set((prev) => ({
      ...prev,
      closedSections: prev.closedSections.includes(section)
        ? prev.closedSections.filter((s) => s !== section)
        : [...prev.closedSections, section],
    }));
  }, []);
  return { ...prefs, setCollapsed, toggleSection };
}
