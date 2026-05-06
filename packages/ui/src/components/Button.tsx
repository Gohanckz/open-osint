import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../cn.js';

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent hover:bg-accent-hover text-white shadow-1',
        secondary: 'bg-bg-elevated hover:bg-bg-surface text-text-primary border border-border-subtle',
        ghost: 'hover:bg-bg-elevated text-text-primary',
        danger: 'bg-danger hover:bg-accent-hover text-white',
        link: 'text-accent hover:underline underline-offset-2',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-5 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(button({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';
