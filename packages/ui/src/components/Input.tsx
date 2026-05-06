import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../cn.js';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-9 w-full rounded-md border border-border-subtle bg-bg-elevated px-3 text-sm text-text-primary',
      'placeholder:text-text-muted focus-visible:ring-2 focus-visible:ring-accent outline-none',
      'transition-colors',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
