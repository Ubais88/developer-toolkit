export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

/** Human label for the platform modifier key. */
export const modKey = isMac ? '⌘' : 'Ctrl';

/** Render a combo like `mod+shift+k` as display keys: ['Ctrl', 'Shift', 'K'] */
export function formatCombo(combo: string): string[] {
  return combo.split('+').map((part) => {
    const p = part.trim().toLowerCase();
    if (p === 'mod') return modKey;
    if (p === 'shift') return isMac ? '⇧' : 'Shift';
    if (p === 'alt') return isMac ? '⌥' : 'Alt';
    if (p === 'ctrl') return isMac ? '⌃' : 'Ctrl';
    if (p === 'enter') return '↵';
    if (p === 'escape' || p === 'esc') return 'Esc';
    if (p === 'arrowup') return '↑';
    if (p === 'arrowdown') return '↓';
    return p.length === 1 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1);
  });
}
