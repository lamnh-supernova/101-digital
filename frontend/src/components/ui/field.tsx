import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export const fieldControlClasses =
  'mt-2 block min-h-11 w-full rounded-md border border-neutral-300 bg-white px-3.5 py-2.5 text-base text-neutral-950 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 aria-invalid:border-danger-600 aria-invalid:ring-danger-600/15';

export function fieldDescribedBy(
  id: string,
  parts: { readonly hint?: string; readonly error?: string },
): string | undefined {
  const ids = [
    parts.hint !== undefined ? `${id}-hint` : undefined,
    parts.error !== undefined ? `${id}-error` : undefined,
  ].filter((value): value is string => value !== undefined);

  return ids.length > 0 ? ids.join(' ') : undefined;
}

export interface FieldProps {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Field({
  id,
  label,
  hint,
  error,
  required = true,
  className,
  children,
}: FieldProps) {
  return (
    <div className={className}>
      <label
        className={cn(
          'text-sm font-semibold text-neutral-800',
          required && "after:text-danger-600 after:ml-1 after:content-['*']",
        )}
        htmlFor={id}
      >
        {label}
      </label>
      {hint !== undefined ? (
        <p className="mt-1 text-xs leading-5 text-neutral-500" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {children}
      {error !== undefined ? (
        <p className="text-danger-600 mt-2 text-sm" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
