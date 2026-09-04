'use client';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/feedback-state';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <ErrorState
      action={<Button onClick={reset}>Try again</Button>}
      description="The page could not be loaded. Try again, or return later if the problem continues."
      headingLevel={1}
      title="We could not load this page"
    />
  );
}
