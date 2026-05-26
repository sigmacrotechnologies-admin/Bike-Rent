'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, User, HelpCircle, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { bookingService } from '@/services';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/utils/cn';
import { BOOKING_STATUS_COLORS } from '@/utils/constants';

export default function CustomerDashboard() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data } = useQuery({
    queryKey: ['bookings', 'dashboard'],
    queryFn: () => bookingService.list({ limit: 5 }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const bookings = data?.data || [];

  const quickLinks = [
    { href: '/dashboard/bookings', icon: CalendarDays, label: 'My Bookings', desc: 'View and manage bookings' },
    { href: '/dashboard/profile', icon: User, label: 'Profile', desc: 'Update your information' },
    { href: '/support', icon: HelpCircle, label: 'Support', desc: 'Get help with your rentals' },
  ];

  return (
    <main className="min-h-screen pt-16">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-3xl font-bold">
          Welcome, <span className="text-gradient">{user?.firstName}</span>
        </h1>
        <p className="mt-1 text-muted-foreground">Manage your rentals and account</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="cursor-pointer transition-all hover:border-electric-500/30">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-electric-500/10">
                    <link.icon className="h-6 w-6 text-electric-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{link.label}</h3>
                    <p className="text-sm text-muted-foreground">{link.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Link href="/dashboard/bookings"><Button variant="ghost" size="sm">View All <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No bookings yet.</p>
                <Link href="/vehicles"><Button className="mt-4">Browse Fleet</Button></Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b: { _id: string; bookingNumber: string; status: string; vehicle?: { name: string }; pricing?: { totalAmount: number }; startDate: string; endDate: string }) => (
                  <div key={b._id} className="flex items-center justify-between rounded-lg border border-border/30 p-4">
                    <div>
                      <p className="font-medium">{b.vehicle?.name || 'Vehicle'}</p>
                      <p className="text-sm text-muted-foreground">{b.bookingNumber} · {formatDate(b.startDate)} - {formatDate(b.endDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatCurrency(b.pricing?.totalAmount || 0)}</span>
                      <Badge className={BOOKING_STATUS_COLORS[b.status]}>{b.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
