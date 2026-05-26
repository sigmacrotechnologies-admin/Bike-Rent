'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { bookingService } from '@/services';
import { formatCurrency, formatDateTime } from '@/utils/cn';
import { BOOKING_STATUS_COLORS } from '@/utils/constants';

const TABS = [
  { key: 'incoming', label: 'Incoming', status: 'confirmed' },
  { key: 'pending', label: 'Pending Payment', status: 'pending' },
  { key: 'active', label: 'Active Rentals', status: 'active' },
  { key: 'all', label: 'All Bookings', status: '' },
];

export default function AdminBookingsPage() {
  const [tab, setTab] = useState('incoming');
  const queryClient = useQueryClient();
  const currentTab = TABS.find((t) => t.key === tab)!;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', currentTab.status],
    queryFn: () =>
      bookingService.list({ limit: '50', ...(currentTab.status ? { status: currentTab.status } : {}) }).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => bookingService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });

  const bookings = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Booking Management</h1>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.key} variant={tab === t.key ? 'default' : 'outline'} size="sm" onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>{currentTab.label} ({bookings.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded bg-muted/20" />)}</div>
          ) : bookings.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No bookings in this category.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-muted-foreground">
                    <th className="pb-3 pr-4">Booking #</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Vehicle</th>
                    <th className="pb-3 pr-4">Pickup</th>
                    <th className="pb-3 pr-4">Dates</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b: {
                    _id: string; bookingNumber: string; status: string;
                    user?: { _id?: string; firstName: string; lastName: string; email: string; avatar?: string; kyc?: { profilePhotoUrl?: string } };
                    vehicle?: { name: string; type: string };
                    pricing?: { totalAmount: number; securityDeposit?: number };
                    startDate: string; endDate: string;
                    onboarding?: { completedAt?: string; profilePhotoUrl?: string };
                  }) => (
                    <tr key={b._id} className="border-b border-border/20">
                      <td className="py-3 pr-4 font-medium">{b.bookingNumber}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {(b.onboarding?.profilePhotoUrl || b.user?.avatar || b.user?.kyc?.profilePhotoUrl) && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={b.onboarding?.profilePhotoUrl || b.user?.avatar || b.user?.kyc?.profilePhotoUrl}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p>{b.user?.firstName} {b.user?.lastName}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{b.user?._id?.slice(-8)}</p>
                            <p className="text-xs text-muted-foreground">{b.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">{b.vehicle?.name}</td>
                      <td className="py-3 pr-4">
                        {b.onboarding?.completedAt ? (
                          <Badge variant="success">Verified</Badge>
                        ) : b.status === 'confirmed' ? (
                          <Badge variant="warning">Pending</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs">
                        {formatDateTime(b.startDate)}<br />{formatDateTime(b.endDate)}
                      </td>
                      <td className="py-3 pr-4"><Badge className={BOOKING_STATUS_COLORS[b.status]}>{b.status}</Badge></td>
                      <td className="py-3 pr-4 font-semibold">{formatCurrency(b.pricing?.totalAmount || 0)}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <Link href={`/admin/bookings/${b._id}`}>
                            <Button variant="outline" size="sm">Manage</Button>
                          </Link>
                          {b.status === 'confirmed' && b.onboarding?.completedAt && (
                            <Button size="sm" onClick={() => statusMutation.mutate({ id: b._id, status: 'active' })}>
                              Hand Over Vehicle
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
