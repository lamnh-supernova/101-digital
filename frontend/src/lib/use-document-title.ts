'use client';

import { useEffect } from 'react';

/** Sets the browser tab title from a client component, where the metadata export is unavailable. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | SimpleInvoice`;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
