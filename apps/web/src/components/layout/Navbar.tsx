'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, X, Zap, Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store';
import { LocationSelector } from '@/components/layout/LocationSelector';
import { cn } from '@/utils/cn';

const navLinks = [
  { href: '/vehicles', label: 'Fleet' },
  { href: '/vehicles?type=bike', label: 'Bikes' },
  { href: '/vehicles?type=car', label: 'Cars' },
  { href: '/vehicles?type=ev', label: 'EVs' },
  { href: '/support', label: 'Support' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      style={{ backgroundColor: scrolled ? undefined : 'transparent' }}
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-border/40 bg-background/90 shadow-lg shadow-black/10 backdrop-blur-xl'
          : 'border-b border-transparent'
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:h-[4.5rem]">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg glow-blue transition-transform group-hover:scale-105">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-tight">
              Velocity<span className="text-electric-500">Rent</span>
            </span>
            <p className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:block">Premium Mobility</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                pathname === link.href
                  ? 'bg-electric-500/15 text-electric-400'
                  : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LocationSelector compact />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthenticated ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href={['super_admin', 'admin', 'staff'].includes(user?.role || '') ? '/admin' : '/dashboard'}>
                <Button variant="outline" size="sm" className="rounded-xl border-electric-500/30">
                  <User className="mr-2 h-4 w-4" />
                  {user?.firstName}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-xl">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-xl glow-blue">Get Started</Button>
              </Link>
            </div>
          )}

          <Button variant="ghost" size="icon" className="lg:hidden rounded-xl" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-border/40 bg-background/95 backdrop-blur-xl lg:hidden"
        >
          <div className="flex flex-col gap-1 p-4">
            <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</p>
            <div className="px-2 pb-3">
              <LocationSelector />
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="mt-2 flex flex-col gap-2 border-t border-border/40 pt-4">
                <Link href="/login"><Button variant="outline" className="w-full rounded-xl">Login</Button></Link>
                <Link href="/register"><Button className="w-full rounded-xl">Get Started</Button></Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
