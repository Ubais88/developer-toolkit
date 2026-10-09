import { useEffect, useRef } from 'react';
import { isMac } from '../lib/platform';

export interface HotkeyBinding {
  /** e.g. `mod+k`, `mod+shift+p`, `?`, or a two-key sequence like `g h` */
  combo: string;
  handler: (e: KeyboardEvent) => void;
  /** Fire even while typing in inputs / Monaco. Defaults to true for combos with a modifier. */
  allowInInputs?: boolean;
  /** Listen in the capture phase (needed to beat Monaco's own Ctrl+K chord). */
  capture?: boolean;
  enabled?: boolean;
}

const SEQUENCE_TIMEOUT = 900;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return !!target.closest('.monaco-editor');
}

function matchesChord(e: KeyboardEvent, chord: string): boolean {
  const parts = chord.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const want = {
    mod: parts.includes('mod'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    ctrl: parts.includes('ctrl'),
  };
  const modPressed = isMac ? e.metaKey : e.ctrlKey;
  if (want.mod !== modPressed) return false;
  if (!want.mod && !want.ctrl && (e.ctrlKey || e.metaKey)) return false;
  if (want.alt !== e.altKey) return false;
  // Shift is implied for symbols like "?" so only enforce it when explicitly asked
  if (want.shift && !e.shiftKey) return false;
  return e.key.toLowerCase() === key;
}

/** Register global keyboard shortcuts. Handlers are kept in a ref so listeners don't re-bind. */
export function useHotkeys(bindings: HotkeyBinding[]) {
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    let pending: string | null = null;
    let pendingTimer: ReturnType<typeof setTimeout> | undefined;

    const handle = (capturePhase: boolean) => (e: KeyboardEvent) => {
      if (e.repeat) return;
      const typing = isTypingTarget(e.target);

      for (const b of ref.current) {
        if (b.enabled === false || !!b.capture !== capturePhase) continue;
        const hasModifier = /mod|ctrl|alt/.test(b.combo);
        const allowInInputs = b.allowInInputs ?? hasModifier;
        if (typing && !allowInInputs) continue;

        const steps = b.combo.split(' ');
        if (steps.length === 2) {
          if (pending === steps[0] && matchesChord(e, steps[1])) {
            pending = null;
            e.preventDefault();
            b.handler(e);
            return;
          }
          continue;
        }
        if (matchesChord(e, b.combo)) {
          e.preventDefault();
          e.stopPropagation();
          b.handler(e);
          return;
        }
      }

      // Track the first key of a possible sequence
      if (!capturePhase && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const first = e.key.toLowerCase();
        if (ref.current.some((b) => b.combo.split(' ').length === 2 && b.combo.startsWith(first + ' '))) {
          pending = first;
          clearTimeout(pendingTimer);
          pendingTimer = setTimeout(() => (pending = null), SEQUENCE_TIMEOUT);
        } else {
          pending = null;
        }
      }
    };

    const onCapture = handle(true);
    const onBubble = handle(false);
    window.addEventListener('keydown', onCapture, true);
    window.addEventListener('keydown', onBubble);
    return () => {
      clearTimeout(pendingTimer);
      window.removeEventListener('keydown', onCapture, true);
      window.removeEventListener('keydown', onBubble);
    };
  }, []);
}
