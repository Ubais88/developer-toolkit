import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../context/ToastContext';

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Copy text to the clipboard with a toast. `copied` stays true for ~1.5s for icon feedback.
 * Pass `false` as the message to copy silently.
 */
export function useClipboard() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string, message: string | false = 'Copied to clipboard') => {
      if (!text) {
        toast.info('Nothing to copy');
        return false;
      }
      const ok = await writeClipboard(text);
      if (ok) {
        if (message) toast.success(message);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1500);
      } else {
        toast.error('Could not access the clipboard');
      }
      return ok;
    },
    [toast],
  );

  return { copy, copied };
}
