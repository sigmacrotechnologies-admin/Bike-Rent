'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { bookingService } from '@/services';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDateTime } from '@/utils/cn';
import { openInvoicePage } from '@/utils/invoice';
import { BOOKING_STATUS_COLORS } from '@/utils/constants';

export default function MyBookingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [cancelId, setCancelId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingService.list().then((r) => r.data),
    enabled: isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingService.cancel(id, 'Cancelled by customer'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setCancelId(null);
    },
  });

  const bookings = data?.data || [];

  return (
    <main className="min-h-screen pt-16">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground">Track and manage your rentals</p>
          </div>
          <Link href="/vehicles"><Button>Book a Vehicle</Button></Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/20" />)}</div>
        ) : bookings.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No bookings found.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((b: {
              _id: string; bookingNumber: string; status: string;
              vehicle?: { name: string; type: string };
              pricing?: { totalAmount: number; extensionAmount?: number };
              startDate: string; endDate: string;
              extensionCount?: number;
            }) => (
              <Card key={b._id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">{b.vehicle?.name}</CardTitle>
                  <Badge className={BOOKING_STATUS_COLORS[b.status]}>{b.status}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm md:grid-cols-4">
                    <div><span className="text-muted-foreground">Booking #</span><p className="font-medium">{b.bookingNumber}</p></div>
                    <div><span className="text-muted-foreground">Start</span><p>{formatDateTime(b.startDate)}</p></div>
                    <div><span className="text-muted-foreground">End</span><p>{formatDateTime(b.endDate)}</p></div>
                    <div>
                      <span className="text-muted-foreground">Total</span>
                      <p className="font-semibold text-electric-500">{formatCurrency(b.pricing?.totalAmount || 0)}</p>
                      {(b.extensionCount ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground">Includes {b.extensionCount} extension(s)</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/dashboard/bookings/${b._id}`}>
                      <Button size="sm">
                        {b.status === 'completed' ? 'View Details & Invoice' : 'View Booking'}
                      </Button>
                    </Link>
                    {b.status === 'completed' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openInvoicePage(b._id, false)}>
                          <FileText className="mr-2 h-4 w-4" /> View Invoice
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openInvoicePage(b._id)}>
                          <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                      </>
                    )}
                    {['pending', 'confirmed'].includes(b.status) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => cancelMutation.mutate(b._id)}
                        disabled={cancelMutation.isPending && cancelId === b._id}
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
