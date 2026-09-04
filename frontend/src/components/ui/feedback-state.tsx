import { AlertCircle, Inbox, Loader2, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Card } from './card';

type FeedbackKind = 'empty' | 'error' | 'loading';

type FeedbackStateProps = {
  action?: ReactNode | undefined;
  description?: string | undefined;
  headingLevel?: 1 | 2 | undefined;
  title: string;
};

type StateFrameProps = FeedbackStateProps & {
  kind: FeedbackKind;
};

const STATE_ICONS: Readonly<Record<FeedbackKind, LucideIcon>> = {
  loading: Loader2,
  error: AlertCircle,
  empty: Inbox,
};

const ICON_WRAPPER_CLASSES: Readonly<Record<FeedbackKind, string>> = {
  loading: 'bg-primary-50 text-primary-600',
  error: 'bg-danger-50 text-danger-600',
  empty: 'bg-neutral-100 text-neutral-500',
};

function StateIcon({ kind }: Pick<StateFrameProps, 'kind'>) {
  const Icon = STATE_ICONS[kind];

  return (
    <span
      aria-hidden="true"
      className={cn('grid size-11 place-items-center rounded-full', ICON_WRAPPER_CLASSES[kind])}
    >
      <Icon
        className={cn('size-5', kind === 'loading' && 'animate-spin motion-reduce:animate-none')}
      />
    </span>
  );
}

function StateFrame({ action, description, headingLevel = 2, kind, title }: StateFrameProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const role = kind === 'error' ? 'alert' : kind === 'loading' ? 'status' : undefined;

  return (
    <Card
      aria-atomic={role ? 'true' : undefined}
      aria-busy={kind === 'loading' ? 'true' : undefined}
      aria-label={role ? title : undefined}
      aria-live={kind === 'error' ? 'assertive' : role ? 'polite' : undefined}
      className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-10 text-center sm:px-10"
      role={role}
    >
      <StateIcon kind={kind} />
      <Heading className="mt-5 text-xl font-semibold tracking-tight text-balance text-neutral-950 sm:text-2xl">
        {title}
      </Heading>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-pretty text-neutral-600 sm:text-base">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  );
}

export function LoadingState({
  description = 'Please wait while the page is prepared.',
  headingLevel,
  title = 'Loading',
}: Partial<FeedbackStateProps>) {
  return (
    <StateFrame
      description={description}
      headingLevel={headingLevel}
      kind="loading"
      title={title}
    />
  );
}

export function EmptyState(props: FeedbackStateProps) {
  return <StateFrame {...props} kind="empty" />;
}

export function ErrorState({
  description = 'Please try again. If the problem continues, return to the previous page.',
  headingLevel,
  title = 'Something went wrong',
  ...props
}: Partial<FeedbackStateProps>) {
  return (
    <StateFrame
      {...props}
      description={description}
      headingLevel={headingLevel}
      kind="error"
      title={title}
    />
  );
}
