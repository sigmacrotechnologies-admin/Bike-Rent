'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Download, Loader2, FileText } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VehicleImage } from '@/components/vehicles/VehicleImage';
import { bookingService } from '@/services';
import { useAuthReady } from '@/hooks/useAuthReady';
import { formatCurrency, formatDateTime } from '@/utils/cn';
import { openInvoicePage } from '@/utils/invoice';
import { BOOKING_STATUS_COLORS } from '@/utils/constants';

export default function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, isAuthed } = useAuthReady();

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getById(id).then((r) => r.data.data),
    enabled: !!id && ready && isAuthed,
    retry: 2,
  });

  if (!ready || (ready && !isAuthed)) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        {!ready || isAuthed ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <p className="text-muted-foreground">Please log in to view your booking.</p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <main className="min-h-screen pt-16">
        <Navbar />
        <div className="container mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Could not load booking details.</p>
          <Link href="/dashboard/bookings"><Button>Go to My Bookings</Button></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-16">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card className="border-neon-400/20 shadow-lg shadow-neon-400/5">
          <CardContent className="p-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-neon-400" />
            <h1 className="mt-4 font-display text-2xl font-bold">Booking Confirmed!</h1>
            <p className="mt-2 text-lg font-semibold text-electric-500">{booking.bookingNumber}</p>
            <p className="mt-2 text-muted-foreground">
              Payment successful. Visit the pickup location on your start date — our team will verify your documents and hand over the vehicle.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Booking Details</CardTitle>
            <Badge className={BOOKING_STATUS_COLORS[booking.status]}>{booking.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <VehicleImage vehicle={booking.vehicle} className="absolute inset-0" imgClassName="object-cover" />
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-muted-foreground">Vehicle</span><p className="font-medium">{booking.vehicle?.name}</p></div>
              <div><span className="text-muted-foreground">Pickup</span><p>{booking.pickupLocation?.hub}</p></div>
              <div><span className="text-muted-foreground">Start</span><p>{formatDateTime(booking.startDate)}</p></div>
              <div><span className="text-muted-foreground">End</span><p>{formatDateTime(booking.endDate)}</p></div>
              <div><span className="text-muted-foreground">Total Paid</span><p className="font-semibold text-electric-500">{formatCurrency(booking.pricing?.totalAmount || 0)}</p></div>
              <div><span className="text-muted-foreground">Security Deposit</span><p>{formatCurrency(booking.pricing?.securityDeposit || 0)}</p></div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-3">
          <Button variant="outline" className="w-full" onClick={() => openInvoicePage(id)}>
            <FileText className="mr-2 h-4 w-4" /> Download Payment Receipt (PDF)
          </Button>
          <Button variant="outline" className="w-full" onClick={() => openInvoicePage(id, false)}>
            <Download className="mr-2 h-4 w-4" /> View Full Invoice
          </Button>
          <Link href={`/dashboard/bookings/${id}`}>
            <Button className="w-full">View My Booking</Button>
          </Link>
          <Link href="/dashboard/bookings">
            <Button variant="ghost" className="w-full">All My Bookings</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
