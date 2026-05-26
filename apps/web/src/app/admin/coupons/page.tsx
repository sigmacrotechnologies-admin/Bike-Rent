'use client';

import { useQuery } from '@tanstack/react-query';
import { couponService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/cn';

export default function CouponsPage() {
  const { data } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponService.list().then((r) => r.data.data),
  });

  const coupons = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Coupon Management</h1>
        <Button>Create Coupon</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {coupons.map((c: { _id: string; code: string; description: string; discountType: string; discountValue: number; usageCount: number; usageLimit?: number; isActive: boolean; validUntil: string }) => (
          <Card key={c._id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <code className="text-lg font-bold text-electric-500">{c.code}</code>
                <Badge variant={c.isActive ? 'success' : 'destructive'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
              <p className="mt-2 font-semibold">
                {c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Used: {c.usageCount}/{c.usageLimit || '∞'} · Valid until {formatDate(c.validUntil)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
