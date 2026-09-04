import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  readonly tone?: BadgeTone;
}

const TONE_CLASSES: Readonly<Record<BadgeTone, string>> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  success: 'bg-success-100 text-success-800',
  warning: 'bg-warning-50 text-warning-900',
  danger: 'bg-danger-50 text-danger-700',
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
