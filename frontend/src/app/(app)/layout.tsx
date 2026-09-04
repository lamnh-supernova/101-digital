'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from '@/components/auth/auth-context';
import { LoadingState } from '@/components/ui/feedback-state';

type ProtectedLayoutProps = Readonly<{ children: ReactNode }>;

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <LoadingState description="Checking your session." title="Loading" />;
  }

  return <>{children}</>;
}
