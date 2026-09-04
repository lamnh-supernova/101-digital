import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/login-form';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="grid size-12 place-items-center rounded-lg bg-neutral-950 text-sm font-bold tracking-wider text-white"
          >
            SI
          </span>
          <h1
            className="mt-5 text-2xl font-bold tracking-tight text-neutral-950"
            id="login-heading"
          >
            Sign in to SimpleInvoice
          </h1>
        </div>

        <Card aria-labelledby="login-heading" className="mt-8 p-6 sm:p-8">
          <p className="text-sm leading-6 text-neutral-600">
            Enter the reviewer account credentials documented in the project README.
          </p>
          <LoginForm />
        </Card>

        <p className="mt-6 text-center text-xs leading-5 text-neutral-500">
          Credentials are sent directly to the SimpleInvoice API over HTTPS. Your session token is
          kept only in this browser.
        </p>
      </div>
    </div>
  );
}
