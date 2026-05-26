'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { notificationService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.list().then((r) => r.data.data),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Notification Center</h1>
        <Button variant="outline" onClick={() => markAllMutation.mutate()}>Mark All Read</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications ({data?.unreadCount || 0} unread)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground">No notifications.</p>
          ) : (
            notifications.map((n: { _id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }) => (
              <div key={n._id} className={`rounded-lg border p-4 ${n.isRead ? 'border-border/20 opacity-60' : 'border-electric-500/30'}`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium">{n.title}</p>
                  <Badge variant="outline">{n.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
