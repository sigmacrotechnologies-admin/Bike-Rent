'use client';

import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function KYCPage() {
  const { data } = useQuery({
    queryKey: ['kyc-pending'],
    queryFn: () => userService.listCustomers({ kycStatus: 'pending' }).then((r) => r.data),
  });

  const pending = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">KYC Verification</h1>
      <Card>
        <CardHeader><CardTitle>Pending Verifications ({pending.length})</CardTitle></CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-muted-foreground">No pending KYC verifications.</p>
          ) : (
            pending.map((u: { _id: string; firstName: string; lastName: string; email: string; kyc?: { documentType?: string } }) => (
              <div key={u._id} className="flex items-center justify-between border-b border-border/20 py-4">
                <div>
                  <p className="font-medium">{u.firstName} {u.lastName}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <Badge variant="outline" className="mt-1">{u.kyc?.documentType || 'Document'}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm">Review Documents</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
