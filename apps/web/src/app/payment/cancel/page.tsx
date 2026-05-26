'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-md text-center">
        <CardContent className="p-8">
          <XCircle className="mx-auto h-16 w-16 text-red-400" />
          <h1 className="mt-4 font-display text-2xl font-bold">Payment Cancelled</h1>
          <p className="mt-2 text-muted-foreground">Your payment was not completed. You can try again from checkout.</p>
          <Link href="/vehicles"><Button className="mt-6 w-full">Back to Fleet</Button></Link>
        </CardContent>
      </Card>
    </main>
  );
}
