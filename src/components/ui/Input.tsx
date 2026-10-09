import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

const fieldBase =
  'w-full rounded-md border bg-surface-1 text-13 text-foreground placeholder:text-muted-foreground/60 transition-[border-color,box-shadow] duration-150 outline-none focus:border-primary/60 focus:ring-[3px] focus:ring-primary/15 disabled:opacity-50';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
  invalid?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, mono, invalid, leading, trailing, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          fieldBase,
          'h-9 px-3',
          mono && 'font-mono',
          invalid ? 'border-destructive/60 focus:border-destructive focus:ring-destructive/15' : 'border-border',
          !!leading && 'pl-9',
          !!trailing && 'pr-10',
          className,
        )}
        {...props}
      />
    );
    if (!leading && !trailing) return input;
    return (
      <div className="relative w-full">
        {leading && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
            {leading}
          </span>
        )}
        {input}
        {trailing && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  mono?: boolean;
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, mono, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    spellCheck={false}
    aria-invalid={invalid || undefined}
    className={cn(
      fieldBase,
      'min-h-[80px] resize-y px-3 py-2.5 leading-relaxed',
      mono && 'font-mono',
      invalid ? 'border-destructive/60' : 'border-border',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, children, className }: FieldProps) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="label-caps">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
