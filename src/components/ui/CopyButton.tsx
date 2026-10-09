import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { useClipboard } from '../../hooks/useClipboard';
import { Button, type ButtonProps } from './Button';
import { Tooltip } from './Tooltip';

interface CopyButtonProps extends Omit<ButtonProps, 'value' | 'onClick'> {
  value: string | (() => string);
  /** Toast text; `false` for a silent copy */
  message?: string | false;
  /** Show a text label next to the icon */
  label?: string;
}

export function CopyButton({ value, message, label, variant = 'ghost', size, className, ...props }: CopyButtonProps) {
  const { copy, copied } = useClipboard();

  const button = (
    <Button
      variant={variant}
      size={size ?? (label ? 'sm' : 'icon-sm')}
      aria-label={label ?? 'Copy'}
      onClick={() => copy(typeof value === 'function' ? value() : value, message)}
      className={className}
      {...props}
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={copied ? 'check' : 'copy'}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </motion.span>
        </AnimatePresence>
      </span>
      {label && <span>{copied ? 'Copied' : label}</span>}
    </Button>
  );

  return label ? button : <Tooltip content="Copy">{button}</Tooltip>;
}
