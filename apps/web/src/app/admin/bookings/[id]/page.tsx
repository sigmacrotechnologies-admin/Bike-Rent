'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertTriangle, CheckCircle2, XCircle, CheckCircle, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bookingService } from '@/services';
import { formatCurrency, formatDateTime } from '@/utils/cn';
import { openInvoicePage } from '@/utils/invoice';
import { BOOKING_STATUS_COLORS } from '@/utils/constants';
import { AdminPickupOnboarding } from '@/components/admin/AdminPickupOnboarding';

interface ChecklistItem {
  itemId: string;
  label: string;
  passed: boolean;
  repairCost: number;
  notes?: string;
}

export default function AdminBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [odometerEnd, setOdometerEnd] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnSuccess, setReturnSuccess] = useState<{
    invoiceNumber?: string;
    pdfUrl?: string;
    depositRefunded?: number;
    additionalDue?: number;
  } | null>(null);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['admin-booking', id],
    queryFn: () => bookingService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: checklistData } = useQuery({
    queryKey: ['return-checklist', id],
    queryFn: () => bookingService.getReturnChecklist(id).then((r) => r.data.data),
    enabled: !!id && !!booking && ['active', 'extended'].includes(booking.status),
  });

  useEffect(() => {
    if (checklistData?.checklist && checklist.length === 0) {
      setChecklist(
        checklistData.checklist.map((item: { id: string; label: string }) => ({
          itemId: item.id,
          label: item.label,
          passed: true,
          repairCost: 0,
        }))
      );
    }
  }, [checklistData, checklist.length]);

  const statusMutation = useMutation({
    mutationFn: (status: string) => bookingService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-booking', id] }),
  });

  const returnMutation = useMutation({
    mutationFn: () =>
      bookingService.processReturn(id, {
        checklist,
        odometerEnd: odometerEnd ? parseInt(odometerEnd, 10) : undefined,
        notes: returnNotes,
      }),
    onSuccess: (res) => {
      const result = res.data.data;
      setReturnSuccess({
        invoiceNumber: result.invoice?.invoiceNumber,
        pdfUrl: result.invoice?.pdfUrl,
        depositRefunded: result.booking?.settlement?.depositRefunded,
        additionalDue: result.booking?.settlement?.additionalDue,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-booking', id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Return processing failed');
    },
  });

  const handleDownloadSummary = () => openInvoicePage(id, false);
  const handleDownloadInvoice = () => openInvoicePage(id);

  if (isLoading || !booking) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const securityDeposit = booking.pricing?.securityDeposit || 0;
  const totalDeductions = checklist.filter((i) => !i.passed).reduce((s, i) => s + (i.repairCost || 0), 0);
  const depositRefund = Math.max(0, securityDeposit - totalDeductions);
  const additionalDue = Math.max(0, totalDeductions - securityDeposit);
  const canReturn = ['confirmed', 'active', 'extended'].includes(booking.status);
  const photoUrl = booking.onboarding?.profilePhotoUrl || booking.user?.avatar || booking.user?.kyc?.profilePhotoUrl;
  const onboardingComplete = !!booking.onboarding?.completedAt;
  const needsPickup = booking.status === 'confirmed' && !onboardingComplete;

  const toggleItem = (itemId: string, passed: boolean) => {
    setChecklist((prev) =>
      prev.map((i) => (i.itemId === itemId ? { ...i, passed, repairCost: passed ? 0 : i.repairCost } : i))
    );
  };

  const setRepairCost = (itemId: string, cost: number) => {
    setChecklist((prev) => prev.map((i) => (i.itemId === itemId ? { ...i, repairCost: cost } : i)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:underline">← Back to Bookings</Link>
          <h1 className="font-display text-3xl font-bold mt-1">{booking.bookingNumber}</h1>
        </div>
        <Badge className={BOOKING_STATUS_COLORS[booking.status]}>{booking.status}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleDownloadSummary}>
          <Download className="mr-2 h-4 w-4" /> Booking PDF
        </Button>
        {['confirmed', 'active', 'extended', 'completed'].includes(booking.status) && (
          <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
            <FileText className="mr-2 h-4 w-4" />
            {booking.status === 'completed' ? 'Final Invoice' : 'Payment Receipt'}
          </Button>
        )}
      </div>

      {returnSuccess && (
        <Card className="border-neon-400/40 bg-neon-400/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-10 w-10 shrink-0 text-neon-400" />
              <div className="flex-1 space-y-2">
                <h2 className="font-display text-xl font-bold">Return Completed Successfully</h2>
                <p className="text-sm text-muted-foreground">
                  Invoice {returnSuccess.invoiceNumber} generated. Deposit refunded: {formatCurrency(returnSuccess.depositRefunded || 0)}
                  {(returnSuccess.additionalDue ?? 0) > 0 && (
                    <span className="text-red-500"> · Additional due: {formatCurrency(returnSuccess.additionalDue ?? 0)}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {returnSuccess.pdfUrl && (
                    <Button onClick={() => openInvoicePage(id)}>
                      <Download className="mr-2 h-4 w-4" /> Download Final Invoice
                    </Button>
                  )}
                  <Link href="/admin/bookings">
                    <Button variant="outline">Back to Bookings</Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Customer & Onboarding</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-4">
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Customer" className="h-20 w-20 rounded-full object-cover border-2 border-electric-500/30" />
              )}
              <div>
                <p className="font-semibold text-lg">{booking.onboarding?.fullName || `${booking.user?.firstName} ${booking.user?.lastName}`}</p>
                <p className="font-mono text-xs text-muted-foreground">ID: {booking.user?._id}</p>
                <p>{booking.user?.email}</p>
                <p>{booking.user?.phone}</p>
              </div>
            </div>
            {booking.onboarding?.aadharNumber && <p><span className="text-muted-foreground">Aadhar:</span> {booking.onboarding.aadharNumber}</p>}
            {booking.onboarding?.licenseNumber && <p><span className="text-muted-foreground">License:</span> {booking.onboarding.licenseNumber}</p>}
            {booking.onboarding?.address && (
              <p><span className="text-muted-foreground">Address:</span> {booking.onboarding.address.street}, {booking.onboarding.address.city}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Vehicle:</span> {booking.vehicle?.name} ({booking.vehicle?.type})</p>
            <p><span className="text-muted-foreground">Registration:</span> {booking.vehicle?.registrationNumber}</p>
            <p><span className="text-muted-foreground">Pickup:</span> {booking.pickupLocation?.hub}</p>
            <p><span className="text-muted-foreground">Start:</span> {formatDateTime(booking.startDate)}</p>
            <p><span className="text-muted-foreground">End:</span> {formatDateTime(booking.endDate)}</p>
            <p><span className="text-muted-foreground">Total:</span> <strong>{formatCurrency(booking.pricing?.totalAmount || 0)}</strong></p>
            <p><span className="text-muted-foreground">Security Deposit:</span> <strong>{formatCurrency(securityDeposit)}</strong></p>
          </CardContent>
        </Card>
      </div>

      {needsPickup && (
        <AdminPickupOnboarding bookingId={id} customer={booking.user} />
      )}

      {booking.status === 'confirmed' && onboardingComplete && (
        <Button onClick={() => statusMutation.mutate('active')}>Mark as Active (Vehicle Handed Over)</Button>
      )}

      {booking.status === 'confirmed' && !onboardingComplete && (
        <p className="text-sm text-amber-600">Complete pickup onboarding above before handing over the vehicle.</p>
      )}

      {canReturn && checklist.length > 0 && booking.status !== 'confirmed' && !returnSuccess && (
        <Card>
          <CardHeader><CardTitle>Vehicle Return — Condition Checklist ({booking.vehicle?.type})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checklist.map((item) => (
                <div key={item.itemId} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant={item.passed ? 'default' : 'outline'}
                        onClick={() => toggleItem(item.itemId, true)}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> OK
                      </Button>
                      <Button
                        size="sm"
                        variant={!item.passed ? 'destructive' : 'outline'}
                        onClick={() => toggleItem(item.itemId, false)}
                      >
                        <XCircle className="mr-1 h-4 w-4" /> Issue
                      </Button>
                    </div>
                  </div>
                  {!item.passed && (
                    <div className="w-36">
                      <Label className="text-xs">Repair Cost (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={item.repairCost || ''}
                        onChange={(e) => setRepairCost(item.itemId, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Odometer Reading (End)</Label>
                <Input type="number" value={odometerEnd} onChange={(e) => setOdometerEnd(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Return Notes</Label>
                <Input value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} />
              </div>
            </div>

            <Card className="mt-6 bg-muted/20">
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex justify-between"><span>Security Deposit</span><span>{formatCurrency(securityDeposit)}</span></div>
                <div className="flex justify-between text-red-500"><span>Total Deductions</span><span>-{formatCurrency(totalDeductions)}</span></div>
                <div className="flex justify-between font-semibold text-neon-400"><span>Deposit Refund to Wallet</span><span>{formatCurrency(depositRefund)}</span></div>
                {additionalDue > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Additional amount due (exceeds deposit): {formatCurrency(additionalDue)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() => returnMutation.mutate()}
              disabled={returnMutation.isPending}
            >
              {returnMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Complete Return & Generate Invoice
            </Button>
          </CardContent>
        </Card>
      )}

      {booking.status === 'completed' && booking.returnInspection && (
        <Card>
          <CardHeader><CardTitle>Return Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {booking.returnInspection.checklist?.map((item: ChecklistItem) => (
              <div key={item.itemId} className="flex justify-between">
                <span>{item.label}</span>
                <span className={item.passed ? 'text-neon-400' : 'text-red-500'}>
                  {item.passed ? 'OK' : `Repair: ${formatCurrency(item.repairCost)}`}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 space-y-2">
              <p>Deposit Refunded: {formatCurrency(booking.settlement?.depositRefunded ?? 0)}</p>
              {(booking.settlement?.additionalDue ?? 0) > 0 && (
                <p className="text-red-500">Additional Due: {formatCurrency(booking.settlement.additionalDue)}</p>
              )}
              <Button className="w-full" onClick={handleDownloadInvoice}>
                <Download className="mr-2 h-4 w-4" /> Download Final Invoice (PDF)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
