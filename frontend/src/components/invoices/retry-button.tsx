'use client';

import { useTransition } from 'react';

import { Button } from '@/components/ui/button';

export interface RetryButtonProps {
  readonly onRetry: () => void;
}

export function RetryButton({ onRetry }: RetryButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button disabled={isPending} onClick={() => startTransition(onRetry)} type="button">
      {isPending ? 'Retrying…' : 'Try again'}
    </Button>
  );
}
