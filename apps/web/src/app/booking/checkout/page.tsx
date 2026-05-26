'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, CreditCard, Wallet } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleImage } from '@/components/vehicles/VehicleImage';
import { vehicleService, bookingService, paymentService, walletService } from '@/services';
import { useBookingStore, useAuthStore } from '@/store';
import { formatCurrency } from '@/utils/cn';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { selectedVehicle, startDate, endDate, couponCode, setBookingDetails, clearBooking } = useBookingStore();
  const [coupon, setCoupon] = useState(couponCode || '');
  const [provider, setProvider] = useState<'razorpay' | 'stripe' | 'wallet'>('wallet');

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    if (!selectedVehicle || !startDate || !endDate) router.push('/vehicles');
  }, [isAuthenticated, selectedVehicle, startDate, endDate, router]);

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', selectedVehicle],
    queryFn: () => vehicleService.getById(selectedVehicle!).then((r) => r.data.data),
    enabled: !!selectedVehicle,
  });

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletService.getBalance().then((r) => r.data.data),
    enabled: isAuthenticated,
  });

  const createBooking = useMutation({
    mutationFn: () =>
      bookingService.create({
        vehicleId: selectedVehicle,
        startDate,
        endDate,
        couponCode: coupon || undefined,
      }),
  });

  const handlePayment = async () => {
    try {
      const bookingRes = await createBooking.mutateAsync();
      const booking = bookingRes.data.data;

      if (provider === 'wallet') {
        await paymentService.payWithWallet(booking._id);
        clearBooking();
        router.replace(`/booking/confirmation/${booking._id}`);
        return;
      }

      const paymentRes = await paymentService.initiate({
        bookingId: booking._id,
        provider,
      });

      if (provider === 'stripe' && paymentRes.data.data.url) {
        window.location.href = paymentRes.data.data.url;
        return;
      }

      if (provider === 'razorpay') {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: paymentRes.data.data.amount * 100,
            currency: 'INR',
            name: 'VelocityRent',
            description: `Booking ${booking.bookingNumber}`,
            order_id: paymentRes.data.data.orderId,
            handler: async (response: Record<string, string>) => {
              await paymentService.verifyRazorpay(response);
              clearBooking();
              router.push(`/booking/confirmation/${booking._id}`);
            },
          };
          new window.Razorpay(options).open();
        };
        document.body.appendChild(script);
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
      const msg = data?.errors?.[0] || data?.message || 'Payment failed. Please try again.';
      alert(msg);
    }
  };

  const estimateTotal = () => {
    if (!vehicle || !startDate || !endDate) return 0;
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
    const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    const base = vehicle.pricing.daily * days;
    const tax = Math.round(base * 0.18);
    const deposit = vehicle.pricing.securityDeposit || 0;
    return base + tax + deposit;
  };

  if (!vehicle) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const estimatedTotal = estimateTotal();
  const walletBalance = wallet?.balance || 0;

  return (
    <main className="min-h-screen pt-16">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold mb-8">Booking Checkout</h1>

        <div className="grid gap-6">
          <Card className="overflow-hidden">
            <div className="relative aspect-[21/9] w-full">
              <VehicleImage vehicle={vehicle} className="absolute inset-0" priority imgClassName="object-cover" />
            </div>
            <CardContent className="p-4">
              <p className="font-semibold">{vehicle.name}</p>
              <p className="text-sm text-muted-foreground">{vehicle.registrationNumber}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Booking Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Start</span><span>{new Date(startDate!).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">End</span><span>{new Date(endDate!).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Daily Rate</span><span>{formatCurrency(vehicle.pricing.daily)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Security Deposit</span><span>{formatCurrency(vehicle.pricing.securityDeposit || 0)}</span></div>
              <div className="flex justify-between border-t pt-2 font-semibold"><span>Estimated Total</span><span className="text-electric-500">{formatCurrency(estimatedTotal)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Coupon Code</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input placeholder="Enter coupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
                <Button variant="outline" onClick={() => setBookingDetails({ couponCode: coupon })}>Apply</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant={provider === 'wallet' ? 'default' : 'outline'} onClick={() => setProvider('wallet')}>
                  <Wallet className="mr-2 h-4 w-4" /> Wallet ({formatCurrency(wallet?.balance || 0)})
                </Button>
                <Button variant={provider === 'razorpay' ? 'default' : 'outline'} onClick={() => setProvider('razorpay')}>Razorpay</Button>
                <Button variant={provider === 'stripe' ? 'default' : 'outline'} onClick={() => setProvider('stripe')}>Stripe</Button>
              </div>
              {provider === 'wallet' && walletBalance < estimatedTotal && (
                <p className="text-sm text-amber-600">
                  Insufficient wallet balance ({formatCurrency(walletBalance)}). Top up from My Wallet or ask admin to add funds.
                </p>
              )}
              <Button
                className="w-full"
                size="lg"
                onClick={handlePayment}
                disabled={createBooking.isPending || (provider === 'wallet' && walletBalance < estimatedTotal)}
              >
                {createBooking.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {provider === 'wallet' ? `Pay ${formatCurrency(estimatedTotal)} from Wallet` : 'Pay & Confirm Booking'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
