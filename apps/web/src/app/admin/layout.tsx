'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAuthStore } from '@/store';
import { ADMIN_ROLES } from '@/utils/constants';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && !ADMIN_ROLES.includes(user.role)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="min-h-screen p-6 transition-all duration-300 ml-64 pl-6">
        {children}
      </main>
    </div>
  );
}
