'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supportService } from '@/services';
import { useAuthStore } from '@/store';

export default function SupportPage() {
  const { isAuthenticated } = useAuthStore();
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => supportService.list().then((r) => r.data),
    enabled: isAuthenticated,
  });

  const tickets = data?.data || [];

  const onSubmit = async (formData: Record<string, string>) => {
    if (!isAuthenticated) return;
    await supportService.create(formData);
    setSubmitted(true);
    reset();
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <main className="min-h-screen pt-16">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold mb-2">Support Center</h1>
        <p className="text-muted-foreground mb-8">We&apos;re here to help with your rental experience</p>

        <Card className="mb-8">
          <CardHeader><CardTitle>Submit a Ticket</CardTitle></CardHeader>
          <CardContent>
            {!isAuthenticated ? (
              <p className="text-muted-foreground">Please <a href="/login" className="text-electric-500">login</a> to submit a support ticket.</p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2"><Label>Subject</Label><Input {...register('subject', { required: true })} /></div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select {...register('category')} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                    <option value="booking">Booking</option>
                    <option value="payment">Payment</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="account">Account</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>Description</Label><textarea {...register('description', { required: true })} className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <Button type="submit">{submitted ? 'Ticket Submitted!' : 'Submit Ticket'}</Button>
              </form>
            )}
          </CardContent>
        </Card>

        {isAuthenticated && tickets.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Your Tickets</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {tickets.map((t: { _id: string; ticketNumber: string; subject: string; status: string }) => (
                <div key={t._id} className="flex items-center justify-between rounded-lg border border-border/30 p-4">
                  <div><p className="font-medium">{t.subject}</p><p className="text-sm text-muted-foreground">{t.ticketNumber}</p></div>
                  <Badge>{t.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </main>
  );
}
