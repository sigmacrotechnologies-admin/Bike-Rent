'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { walletService } from '@/services';
import { formatCurrency, formatDateTime } from '@/utils/cn';

export default function AdminWalletsPage() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-wallets'],
    queryFn: () => walletService.listAll({ limit: '50' }).then((r) => r.data),
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      walletService.adminAdjust(selectedUserId, {
        amount: parseFloat(adjustAmount),
        description: adjustDesc || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
      setAdjustAmount('');
      setAdjustDesc('');
      setSelectedUserId('');
    },
  });

  const wallets = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold flex items-center gap-2">
        <Wallet className="h-8 w-8" /> Wallet Management
      </h1>
      <p className="text-muted-foreground">Add or deduct customer wallet balance. Refunds from security deposits are credited here automatically.</p>

      <Card>
        <CardHeader><CardTitle>Adjust Customer Wallet</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Customer User ID</Label>
            <Input placeholder="Paste user ID from table" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Amount (+ credit / − debit)</Label>
            <Input type="number" placeholder="e.g. 5000 or -500" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="Reason for adjustment" value={adjustDesc} onChange={(e) => setAdjustDesc(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!selectedUserId || !adjustAmount || adjustMutation.isPending}
              onClick={() => adjustMutation.mutate()}
            >
              Apply Adjustment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Customer Wallets ({wallets.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-muted/20" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4">Customer ID</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Balance</th>
                    <th className="pb-3 pr-4">Updated</th>
                    <th className="pb-3">Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w: {
                    _id: string; balance: number; updatedAt: string;
                    user?: { _id: string; firstName: string; lastName: string; email: string };
                  }) => (
                    <tr key={w._id} className="border-b border-border/20">
                      <td className="py-3 pr-4 font-mono text-xs break-all max-w-[120px]">{w.user?._id}</td>
                      <td className="py-3 pr-4 font-medium">{w.user?.firstName} {w.user?.lastName}</td>
                      <td className="py-3 pr-4 text-xs">{w.user?.email}</td>
                      <td className="py-3 pr-4 font-semibold text-electric-500">{formatCurrency(w.balance)}</td>
                      <td className="py-3 pr-4 text-xs">{formatDateTime(w.updatedAt)}</td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedUserId(w.user?._id || ''); setAdjustAmount('1000'); }}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedUserId(w.user?._id || ''); setAdjustAmount('-500'); }}>
                            <Minus className="h-3 w-3" />
                          </Button>
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
