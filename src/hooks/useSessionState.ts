import { useState, useEffect } from 'react';

/**
 * A custom hook that manages state in sessionStorage.
 * This allows state to persist across page reloads in the same tab,
 * but keeps it isolated between different tabs (session-specific).
 */
export function useSessionState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    // Lazy initialization to only read from storage once on mount
    const [state, setState] = useState<T>(() => {
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading sessionStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Sync state to sessionStorage whenever it changes
    useEffect(() => {
        try {
            window.sessionStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.warn(`Error writing sessionStorage key "${key}":`, error);
        }
    }, [key, state]);

    // Listen for storage events (optional, mostly for cross-tab local storage, but irrelevant for session storage in other tabs. 
    // However, it could help if other components in same window modify it, but usually standard React flow covers that.)

    return [state, setState];
}
