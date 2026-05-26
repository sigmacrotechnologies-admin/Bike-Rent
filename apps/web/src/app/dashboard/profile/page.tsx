'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Camera } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { userService, assetService } from '@/services';
import { useAuthStore } from '@/store';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { firstName: '', lastName: '', phone: '' },
  });

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    if (user) {
      reset({ firstName: user.firstName, lastName: user.lastName, phone: user.phone });
      setPhotoUrl(user.avatar || user.kyc?.profilePhotoUrl || '');
    }
  }, [isAuthenticated, user, router, reset]);

  const onSubmit = async (data: { firstName: string; lastName: string; phone: string }) => {
    const res = await userService.updateProfile(data);
    setUser(res.data.data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await assetService.uploadUserPhoto(file);
    const path = res.data.data.path;
    setPhotoUrl(path);
    const profile = await userService.updateProfile({ avatar: path });
    setUser(profile.data.data);
  };

  return (
    <main className="min-h-screen pt-16">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold mb-8">Profile Settings</h1>

        <Card className="mb-6">
          <CardHeader><CardTitle>Account Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover border-2 border-electric-500/30" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild><span>Change Photo</span></Button>
                </Label>
                <input id="avatar-upload" type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhoto} />
              </div>
            </div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Email</span><span>{user?.email}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Role</span><Badge>{user?.role}</Badge></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">KYC Status</span><Badge variant={user?.kyc?.status === 'verified' ? 'success' : 'warning'}>{user?.kyc?.status || 'not_submitted'}</Badge></div>
            {user?.kyc?.aadharNumber && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Aadhar</span><span>{user.kyc.aadharNumber}</span></div>}
            {user?.kyc?.licenseNumber && <div className="flex justify-between text-sm"><span className="text-muted-foreground">License</span><span>{user.kyc.licenseNumber}</span></div>}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>First Name</Label><Input {...register('firstName')} /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input {...register('lastName')} /></div>
              </div>
              <div className="space-y-2"><Label>Phone</Label><Input {...register('phone')} /></div>
              <Button type="submit">{saved ? 'Saved!' : 'Save Changes'}</Button>
            </form>
          </CardContent>
        </Card>

        <Link href="/dashboard/wallet" className="mt-3 block"><Button variant="outline" className="w-full">My Wallet</Button></Link>
      </div>
    </main>
  );
}
