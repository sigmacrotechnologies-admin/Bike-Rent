'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { paymentService } from '@/services';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    if (sessionId) {
      paymentService.verifyStripe(sessionId).then(() => {
        const id = bookingId || searchParams.get('bookingId');
        if (id) router.replace(`/booking/confirmation/${id}`);
      }).catch(() => {});
    } else if (bookingId) {
      router.replace(`/booking/confirmation/${bookingId}`);
    }
  }, [sessionId, bookingId, router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-neon-400/5 px-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card className="max-w-md text-center border-neon-400/20">
          <CardContent className="p-8">
            {sessionId ? (
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-neon-400" />
            ) : (
              <CheckCircle className="mx-auto h-16 w-16 text-neon-400" />
            )}
            <h1 className="mt-4 font-display text-2xl font-bold">Payment Successful!</h1>
            <p className="mt-2 text-muted-foreground">Redirecting to booking confirmation...</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/dashboard/bookings"><Button className="w-full">View My Bookings</Button></Link>
              <Link href="/vehicles"><Button variant="outline" className="w-full">Browse More Vehicles</Button></Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-neon-400" />
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
