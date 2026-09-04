'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/components/auth/auth-context';
import { LoadingState } from '@/components/ui/feedback-state';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? '/invoices' : '/login');
    }
  }, [isLoading, user, router]);

  return (
    <LoadingState description="Please wait while the application is prepared." title="Loading" />
  );
}
