import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  readonly variant?: ButtonVariant;
}

const VARIANT_CLASSES: Readonly<Record<ButtonVariant, string>> = {
  primary: 'bg-neutral-950 text-white shadow-sm hover:bg-neutral-800',
  secondary: 'border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
};

export function Button({ className, type = 'button', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-55',
        'focus-visible:ring-primary-600 outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        VARIANT_CLASSES[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
