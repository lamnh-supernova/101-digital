import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/cn';

export type CardProps = ComponentPropsWithoutRef<'div'>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg bg-white shadow-md ring-1 ring-neutral-950/5', className)}
      {...props}
    />
  );
}
