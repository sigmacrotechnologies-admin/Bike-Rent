'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, Download, CalendarPlus, HelpCircle, FileText, AlertTriangle, Eye, Receipt,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleImage } from '@/components/vehicles/VehicleImage';
import { bookingService, supportService } from '@/services';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDateTime } from '@/utils/cn';
import { openInvoicePage } from '@/utils/invoice';
import { BOOKING_STATUS_COLORS } from '@/utils/constants';

interface ExtensionQuote {
  currentEndDate: string;
  newEndDate: string;
  extension: {
    baseAmount: number;
    tax: number;
    chargeAmount: number;
    durationHours: number;
    rateType: string;
    rateApplied: number;
  };
  currentTotal: number;
  newTotal: number;
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [extendDate, setExtendDate] = useState('');
  const [showExtend, setShowExtend] = useState(false);
  const [helpSent, setHelpSent] = useState(false);
  const [extendError, setExtendError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getById(id).then((r) => r.data.data),
    enabled: !!id && isAuthenticated,
  });

  const { data: extensionQuote, isFetching: quoteLoading } = useQuery({
    queryKey: ['extension-quote', id, extendDate],
    queryFn: () =>
      bookingService
        .getExtensionQuote(id, new Date(extendDate).toISOString())
        .then((r) => r.data.data as ExtensionQuote),
    enabled: !!id && !!extendDate && showExtend && isAuthenticated,
    retry: false,
  });

  const extendMutation = useMutation({
    mutationFn: () => bookingService.extend(id, new Date(extendDate).toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['extension-quote', id] });
      setShowExtend(false);
      setExtendDate('');
      setExtendError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setExtendError(msg || 'Extension failed. Check wallet balance and try again.');
    },
  });

  const handleDownloadSummary = () => openInvoicePage(id, false);
  const handleDownloadInvoice = () => openInvoicePage(id);
  const handleViewInvoice = () => openInvoicePage(id, false);

  const handleHelp = async () => {
    await supportService.create({
      subject: `Help request — Booking ${booking?.bookingNumber}`,
      message: `Customer needs assistance with booking ${booking?.bookingNumber}`,
      category: 'booking',
      priority: 'high',
    });
    setHelpSent(true);
  };

  if (isLoading || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isOngoing = ['confirmed', 'active', 'extended'].includes(booking.status);
  const isCompleted = booking.status === 'completed';
  const settlement = booking.settlement;
  const inspection = booking.returnInspection;
  const pricing = booking.pricing || {};
  const originalBase = (pricing.baseAmount || 0) - (pricing.extensionBaseAmount || 0);

  return (
    <main className="min-h-screen pt-16">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{booking.bookingNumber}</h1>
            <p className="text-muted-foreground">Booking Details</p>
          </div>
          <Badge className={BOOKING_STATUS_COLORS[booking.status]}>{booking.status}</Badge>
        </div>

        {!booking.onboarding?.completedAt && booking.status === 'confirmed' && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <p className="text-sm">Awaiting pickup verification at the hub. Admin will verify your documents when you collect the vehicle.</p>
            </CardContent>
          </Card>
        )}

        {booking.onboarding?.completedAt && isOngoing && (
          <Card className="mb-6 border-neon-400/30 bg-neon-400/5">
            <CardContent className="p-4 text-sm">
              Pickup verified on {new Date(booking.onboarding.completedAt).toLocaleString()}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <div className="relative aspect-video overflow-hidden rounded-t-xl">
            <VehicleImage vehicle={booking.vehicle} className="absolute inset-0" imgClassName="object-cover" />
          </div>
          <CardContent className="space-y-3 pt-4">
            <h2 className="text-xl font-semibold">{booking.vehicle?.name}</h2>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-muted-foreground">Registration</span><p>{booking.vehicle?.registrationNumber}</p></div>
              <div><span className="text-muted-foreground">Pickup Location</span><p>{booking.pickupLocation?.hub}</p></div>
              <div><span className="text-muted-foreground">Start</span><p>{formatDateTime(booking.startDate)}</p></div>
              <div><span className="text-muted-foreground">End</span><p>{formatDateTime(booking.endDate)}</p></div>
              {booking.actualReturnDate && (
                <div><span className="text-muted-foreground">Returned</span><p>{formatDateTime(booking.actualReturnDate)}</p></div>
              )}
              {(booking.extensionCount ?? 0) > 0 && (
                <div><span className="text-muted-foreground">Extensions</span><p>{booking.extensionCount} time(s)</p></div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing breakdown */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Pricing & Payment</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {originalBase > 0 && (
              <div className="flex justify-between"><span>Original Rental</span><span>{formatCurrency(originalBase)}</span></div>
            )}
            {(pricing.extensionAmount ?? 0) > 0 && (
              <>
                <div className="flex justify-between"><span>Extension Rental</span><span>{formatCurrency(pricing.extensionBaseAmount || 0)}</span></div>
                <div className="flex justify-between"><span>Extension Tax</span><span>{formatCurrency(pricing.extensionTax || 0)}</span></div>
                <div className="flex justify-between text-electric-500"><span>Total Extension Charges</span><span>{formatCurrency(pricing.extensionAmount || 0)}</span></div>
              </>
            )}
            {(pricing.couponDiscount ?? 0) > 0 && (
              <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-{formatCurrency(pricing.couponDiscount)}</span></div>
            )}
            <div className="flex justify-between"><span>Tax / GST</span><span>{formatCurrency(pricing.tax || 0)}</span></div>
            <div className="flex justify-between"><span>Security Deposit</span><span>{formatCurrency(pricing.securityDeposit || 0)}</span></div>
            <div className="flex justify-between border-t pt-2 font-semibold text-base">
              <span>Total {isCompleted ? 'Paid' : 'Amount'}</span>
              <span className="text-electric-500">{formatCurrency(pricing.totalAmount || 0)}</span>
            </div>
            {booking.coupon?.code && (
              <p className="text-xs text-muted-foreground pt-1">Coupon applied: <strong>{booking.coupon.code}</strong></p>
            )}
            {booking.payment && (
              <div className="mt-3 rounded-lg bg-muted/30 p-3 text-xs space-y-1">
                <p><span className="text-muted-foreground">Payment:</span> {booking.payment.provider} · {booking.payment.status}</p>
                {booking.payment.providerPaymentId && (
                  <p className="break-all"><span className="text-muted-foreground">Txn:</span> {booking.payment.providerPaymentId}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extension history */}
        {booking.extensions?.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Extension History</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {booking.extensions.map((ext: {
                previousEndDate: string; newEndDate: string; chargeAmount: number; paidAt: string;
              }, i: number) => (
                <div key={i} className="flex justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{formatDateTime(ext.previousEndDate)} → {formatDateTime(ext.newEndDate)}</p>
                    <p className="text-xs text-muted-foreground">Paid {formatDateTime(ext.paidAt)}</p>
                  </div>
                  <span className="font-semibold text-electric-500">{formatCurrency(ext.chargeAmount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {isOngoing && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={handleDownloadSummary}>
              <Eye className="mr-2 h-4 w-4" /> View Receipt
            </Button>
            <Button variant="outline" onClick={handleDownloadInvoice}>
              <Download className="mr-2 h-4 w-4" /> Download Receipt (PDF)
            </Button>
            <Button variant="outline" onClick={() => { setShowExtend(!showExtend); setExtendError(''); }}>
              <CalendarPlus className="mr-2 h-4 w-4" /> Extend Booking
            </Button>
            <Button variant="outline" onClick={handleHelp} disabled={helpSent}>
              <HelpCircle className="mr-2 h-4 w-4" /> {helpSent ? 'Help Request Sent' : 'Request Help'}
            </Button>
          </div>
        )}

        {showExtend && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Extend Booking</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Current end: <strong>{formatDateTime(booking.endDate)}</strong>. Extension charges are calculated for the extra period and paid from your wallet.
              </p>
              <div className="space-y-2">
                <Label>New End Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={extendDate}
                  min={new Date(booking.endDate).toISOString().slice(0, 16)}
                  onChange={(e) => { setExtendDate(e.target.value); setExtendError(''); }}
                />
              </div>

              {quoteLoading && extendDate && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Calculating extension charges…
                </p>
              )}

              {extensionQuote && !quoteLoading && (
                <div className="rounded-lg border bg-muted/20 p-4 text-sm space-y-2">
                  <div className="flex justify-between"><span>Extension rental</span><span>{formatCurrency(extensionQuote.extension.baseAmount)}</span></div>
                  <div className="flex justify-between"><span>Extension tax (18%)</span><span>{formatCurrency(extensionQuote.extension.tax)}</span></div>
                  <div className="flex justify-between font-semibold text-electric-500">
                    <span>Extension charge (wallet)</span><span>{formatCurrency(extensionQuote.extension.chargeAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>New booking total</span><span>{formatCurrency(extensionQuote.newTotal)}</span>
                  </div>
                </div>
              )}

              {extendError && (
                <p className="text-sm text-red-500">{extendError}</p>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => extendMutation.mutate()}
                  disabled={!extendDate || !extensionQuote || extendMutation.isPending || quoteLoading}
                >
                  {extendMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirm & Pay from Wallet
                </Button>
                <Link href="/dashboard/wallet">
                  <Button variant="outline">Top Up Wallet</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {isCompleted && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Final Settlement & Invoice</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Security Deposit</span><span>{formatCurrency(settlement?.securityDeposit ?? pricing.securityDeposit)}</span></div>
              <div className="flex justify-between"><span>Deductions (repairs)</span><span className="text-red-500">-{formatCurrency(settlement?.totalDeductions ?? inspection?.totalDeductions ?? 0)}</span></div>
              <div className="flex justify-between font-medium"><span>Deposit Refunded to Wallet</span><span className="text-neon-400">{formatCurrency(settlement?.depositRefunded ?? inspection?.depositRefund ?? 0)}</span></div>
              {(settlement?.additionalDue ?? inspection?.additionalDue ?? 0) > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Additional amount due (exceeds deposit): {formatCurrency(settlement?.additionalDue ?? inspection?.additionalDue)}</span>
                </div>
              )}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button className="w-full" onClick={handleViewInvoice}>
                  <Eye className="mr-2 h-4 w-4" /> View Final Invoice
                </Button>
                <Button className="w-full" variant="outline" onClick={handleDownloadInvoice}>
                  <Download className="mr-2 h-4 w-4" /> Download Invoice (PDF)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Link href="/dashboard/bookings"><Button variant="ghost">← Back to My Bookings</Button></Link>
      </div>
    </main>
  );
}
