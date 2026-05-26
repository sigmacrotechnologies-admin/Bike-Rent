'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { userService } from '@/services';

function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
      title="Copy customer ID"
    >
      {id.slice(-8)}…
      {copied ? <Check className="h-3 w-3 text-neon-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export default function CustomersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => userService.listCustomers({ limit: 50 }).then((r) => r.data),
  });

  const kycMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      userService.verifyKYC(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-customers'] }),
  });

  const customers = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Customer Management</h1>
      <p className="text-muted-foreground">Customer IDs are used for wallet adjustments and internal reference.</p>

      <Card>
        <CardHeader><CardTitle>Customers ({customers.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-40 animate-pulse rounded bg-muted/20" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-muted-foreground">
                    <th className="pb-3 pr-4">Customer ID</th>
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Phone</th>
                    <th className="pb-3 pr-4">KYC</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c: {
                    _id: string; firstName: string; lastName: string;
                    email: string; phone: string; kyc?: { status: string };
                  }) => (
                    <tr key={c._id} className="border-b border-border/20">
                      <td className="py-3 pr-4">
                        <div className="space-y-1">
                          <p className="font-mono text-xs break-all max-w-[140px]">{c._id}</p>
                          <CopyIdButton id={c._id} />
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-medium">{c.firstName} {c.lastName}</td>
                      <td className="py-3 pr-4">{c.email}</td>
                      <td className="py-3 pr-4">{c.phone}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={c.kyc?.status === 'verified' ? 'success' : 'warning'}>
                          {c.kyc?.status || 'not_submitted'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {c.kyc?.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => kycMutation.mutate({ id: c._id, status: 'verified' })}>Verify</Button>
                            <Button size="sm" variant="destructive" onClick={() => kycMutation.mutate({ id: c._id, status: 'rejected' })}>Reject</Button>
                          </div>
                        )}
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
