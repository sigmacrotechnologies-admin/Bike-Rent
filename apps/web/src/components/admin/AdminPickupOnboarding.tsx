'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bookingService, assetService } from '@/services';

interface AdminPickupOnboardingProps {
  bookingId: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    _id?: string;
    address?: { street?: string; city?: string; state?: string; zipCode?: string };
    kyc?: { aadharNumber?: string; licenseNumber?: string; profilePhotoUrl?: string };
    avatar?: string;
  };
  onComplete?: () => void;
}

export function AdminPickupOnboarding({ bookingId, customer, onComplete }: AdminPickupOnboardingProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(customer?.kyc?.profilePhotoUrl || customer?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    fullName: customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : '',
    street: customer?.address?.street || '',
    city: customer?.address?.city || '',
    state: customer?.address?.state || '',
    zipCode: customer?.address?.zipCode || '',
    aadharNumber: customer?.kyc?.aadharNumber || '',
    licenseNumber: customer?.kyc?.licenseNumber || '',
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      bookingService.submitOnboarding(bookingId, {
        fullName: form.fullName,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: 'India',
        },
        aadharNumber: form.aadharNumber,
        licenseNumber: form.licenseNumber,
        profilePhotoUrl: photoUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      onComplete?.();
    },
  });

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await assetService.uploadUserPhoto(file);
      setPhotoUrl(res.data.data.path);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-electric-500/30">
      <CardHeader>
        <CardTitle>Pickup Onboarding (Admin)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Verify customer identity and capture photo at pickup. Customer ID: {customer?._id}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>Address</Label>
          <Input placeholder="Street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-3">
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <Input placeholder="PIN" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Aadhar Number</Label>
            <Input value={form.aadharNumber} onChange={(e) => setForm({ ...form, aadharNumber: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Driving License Number</Label>
            <Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Customer Photo (capture at pickup)</Label>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          <div className="flex items-center gap-4">
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              {photoUrl ? 'Retake Photo' : 'Capture Photo'}
            </Button>
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Customer" className="h-16 w-16 rounded-full object-cover border" />
            )}
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={submitMutation.isPending || !form.fullName || !form.aadharNumber || !form.licenseNumber}
          onClick={() => submitMutation.mutate()}
        >
          {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Complete Pickup Onboarding
        </Button>
      </CardContent>
    </Card>
  );
}
