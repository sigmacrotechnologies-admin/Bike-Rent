'use client';

import { useQuery } from '@tanstack/react-query';
import { supportService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminSupportPage() {
  const { data } = useQuery({
    queryKey: ['admin-support'],
    queryFn: () => supportService.list({ limit: 50 }).then((r) => r.data),
  });

  const tickets = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Support Tickets</h1>
      <Card>
        <CardHeader><CardTitle>Open Tickets ({tickets.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {tickets.map((t: { _id: string; ticketNumber: string; subject: string; status: string; priority: string; user?: { firstName: string; lastName: string } }) => (
            <div key={t._id} className="flex items-center justify-between rounded-lg border border-border/30 p-4">
              <div>
                <p className="font-medium">{t.subject}</p>
                <p className="text-sm text-muted-foreground">{t.ticketNumber} · {t.user?.firstName} {t.user?.lastName}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{t.priority}</Badge>
                <Badge>{t.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
