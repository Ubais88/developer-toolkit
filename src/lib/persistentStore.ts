import { useSyncExternalStore } from 'react';

export interface PersistentStore<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
}

/**
 * A tiny localStorage-backed store shared by every component that reads it
 * (and synced across browser tabs via the `storage` event).
 */
export function createPersistentStore<T>(key: string, initial: T, sanitize?: (value: unknown) => T): PersistentStore<T> {
  const listeners = new Set<() => void>();

  const read = (): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed = JSON.parse(raw) as unknown;
      return sanitize ? sanitize(parsed) : (parsed as T);
    } catch {
      return initial;
    }
  };

  let value = read();
  const emit = () => listeners.forEach((l) => l());

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key) return;
      value = read();
      emit();
    });
  }

  return {
    get: () => value,
    set: (next) => {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage full or unavailable */
      }
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
