'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Zap, Loader2, Shield, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { authService } from '@/services';
import { useAuthStore } from '@/store';
import { ADMIN_ROLES } from '@/utils/constants';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.login(data);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      router.push(ADMIN_ROLES.includes(user.role) ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <MeshBackground />
      <div className="relative flex min-h-screen">
        {/* Left panel — branding */}
        <div className="hidden w-1/2 flex-col justify-between border-r border-border/30 bg-card/20 p-12 backdrop-blur-md lg:flex">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary glow-blue">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-2xl font-bold">Velocity<span className="text-electric-500">Rent</span></span>
          </Link>

          <div>
            <h2 className="font-display text-4xl font-bold leading-tight">
              Your journey<br /><span className="text-gradient">starts here</span>
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Access your bookings, track rides live, and manage your profile.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { icon: Shield, text: 'Secure JWT authentication' },
                { icon: MapPin, text: 'Live GPS fleet tracking' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric-500/15">
                    <Icon className="h-4 w-4 text-electric-500" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} VelocityRent</p>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 items-center justify-center p-6 pt-20 lg:p-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="font-display text-xl font-bold">VelocityRent</span>
              </Link>
            </div>

            <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
                <p className="text-sm text-muted-foreground">Sign in to continue</p>
              </CardHeader>
              <CardContent>
                <div className="mb-5 rounded-xl border border-electric-500/20 bg-electric-500/5 p-4 text-xs">
                  <p className="mb-2 font-semibold text-electric-400">Demo Accounts</p>
                  <p className="text-muted-foreground">Admin: admin@velocityrent.com / Admin@123456</p>
                  <p className="text-muted-foreground">Customer: customer@velocityrent.com / Customer@123</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" className="h-12 rounded-xl bg-background/50" {...register('email')} />
                    {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" className="h-12 rounded-xl bg-background/50" {...register('password')} />
                    {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                  </div>
                  <Button type="submit" className="h-12 w-full rounded-xl glow-blue" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Sign In
                  </Button>
                </form>
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  No account?{' '}
                  <Link href="/register" className="font-medium text-electric-400 hover:underline">Create one free</Link>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
