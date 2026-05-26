'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import InvoicePageContent from './InvoicePageContent';

export default function InvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <InvoicePageContent />
    </Suspense>
  );
}
