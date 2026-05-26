'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Car, CalendarDays, Users, ShieldCheck,
  BarChart3, MapPin, Wrench, Ticket, Tag, Bell, Settings, Menu, X, Wallet,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/store';
import { Button } from '@/components/ui/button';

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/fleet', label: 'Fleet Management', icon: Car },
  { href: '/admin/locations', label: 'Locations', icon: MapPin },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/admin/wallets', label: 'Wallets', icon: Wallet },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/kyc', label: 'KYC Verification', icon: ShieldCheck },
  { href: '/admin/revenue', label: 'Revenue', icon: BarChart3 },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/gps', label: 'GPS Tracking', icon: MapPin },
  { href: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/admin/support', label: 'Support Tickets', icon: Ticket },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-border/40 bg-card/95 backdrop-blur-xl transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/40 px-4">
          {sidebarOpen && (
            <span className="font-display text-lg font-bold">
              Admin<span className="text-electric-500">Panel</span>
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        <nav className="space-y-1 p-3">
          {adminNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-electric-500/10 text-electric-500'
                    : 'text-muted-foreground hover:bg-accent/5 hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className={cn('transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-16')} />
    </>
  );
}
