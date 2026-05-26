'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { walletService } from '@/services';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDateTime } from '@/utils/cn';

export default function WalletPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [topUpAmount, setTopUpAmount] = useState('');

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletService.getBalance().then((r) => r.data.data),
    enabled: isAuthenticated,
  });

  const { data: txData } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: () => walletService.listTransactions({ limit: '20' }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const topUpMutation = useMutation({
    mutationFn: () => walletService.topUp(parseFloat(topUpAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      setTopUpAmount('');
    },
  });

  const transactions = txData?.data?.transactions || [];

  return (
    <main className="min-h-screen pt-16">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold mb-8 flex items-center gap-2">
          <Wallet className="h-8 w-8" /> My Wallet
        </h1>

        <Card className="mb-6 border-electric-500/20">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Available Balance</p>
            <p className="font-display text-4xl font-bold text-electric-500 mt-2">
              {formatCurrency(walletData?.balance || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Use wallet balance to pay for bookings instantly</p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>Add Money (Demo)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Payment gateway integration coming soon. For now, demo top-up adds funds instantly.</p>
            <div className="flex gap-2">
              <Input type="number" placeholder="Amount in ₹" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} />
              <Button onClick={() => topUpMutation.mutate()} disabled={!topUpAmount || topUpMutation.isPending}>
                <Plus className="mr-2 h-4 w-4" /> Top Up
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx: {
                  _id: string; type: string; amount: number; balanceAfter: number;
                  description?: string; createdAt: string;
                }) => (
                  <div key={tx._id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      {['credit', 'topup', 'refund', 'admin_adjust'].includes(tx.type) && tx.amount > 0 ? (
                        <ArrowDownLeft className="h-5 w-5 text-neon-400" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{tx.description || tx.type}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${['credit', 'topup', 'refund'].includes(tx.type) ? 'text-neon-400' : 'text-red-400'}`}>
                        {['credit', 'topup', 'refund'].includes(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">Bal: {formatCurrency(tx.balanceAfter)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Link href="/vehicles" className="mt-6 block">
          <Button variant="outline" className="w-full">Book a Vehicle</Button>
        </Link>
      </div>
    </main>
  );
}
