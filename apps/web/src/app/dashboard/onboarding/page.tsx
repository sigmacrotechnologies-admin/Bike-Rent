'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store';

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    else router.replace('/dashboard/bookings');
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen pt-16">
      <Navbar />
      <div className="container mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Pickup verification is handled by admin at the hub. Redirecting…
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
