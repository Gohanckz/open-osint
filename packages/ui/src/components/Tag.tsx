import type { HTMLAttributes } from 'react';
import { cn } from '../cn.js';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'default' | 'accent' | 'warning' | 'success' | 'info';
}

const TONE: Record<NonNullable<TagProps['tone']>, string> = {
  default: 'bg-bg-elevated text-text-muted border-border-subtle',
  accent: 'bg-accent/10 text-accent border-accent/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  success: 'bg-success/10 text-success border-success/30',
  info: 'bg-info/10 text-info border-info/30',
};

export function Tag({ tone = 'default', className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}
