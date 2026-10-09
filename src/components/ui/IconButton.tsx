import { forwardRef } from 'react';
import { Button, type ButtonProps } from './Button';
import { Tooltip } from './Tooltip';
import { cn } from './cn';

interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  /** Accessible name; also shown as the tooltip */
  label: string;
  shortcut?: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md';
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, shortcut, tooltipSide = 'bottom', size = 'md', variant = 'ghost', active, className, ...props }, ref) => (
    <Tooltip content={label} shortcut={shortcut} side={tooltipSide}>
      <Button
        ref={ref}
        variant={variant}
        size={size === 'sm' ? 'icon-sm' : 'icon'}
        aria-label={label}
        aria-pressed={active}
        className={cn('[&_svg]:h-4 [&_svg]:w-4', active && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary', className)}
        {...props}
      />
    </Tooltip>
  ),
);
IconButton.displayName = 'IconButton';
