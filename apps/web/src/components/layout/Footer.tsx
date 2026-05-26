import Link from 'next/link';
import { Zap, Mail, Phone, MapPin, Instagram, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative border-t border-border/40 bg-card/30">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-500/50 to-transparent" />
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-lg glow-blue">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-display text-2xl font-bold">VelocityRent</span>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Premium Mobility</p>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              India&apos;s premium self-drive rental platform. Bikes, cars, EVs & scooters with GPS tracking and instant booking.
            </p>
            <div className="mt-6 flex gap-3">
              {[Instagram, Twitter, Linkedin].map((Icon, i) => (
                <button key={i} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-secondary/50 text-muted-foreground transition-all hover:border-electric-500/50 hover:text-electric-400">
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-5 font-heading font-bold">Fleet</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { href: '/vehicles?type=bike', label: 'Self-Drive Bikes' },
                { href: '/vehicles?type=car', label: 'Premium Cars' },
                { href: '/vehicles?type=ev', label: 'EV Rentals' },
                { href: '/vehicles?type=scooter', label: 'Scooters' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-electric-400">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 font-heading font-bold">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { href: '/support', label: 'Support Center' },
                { href: '/dashboard', label: 'My Dashboard' },
                { href: '/login', label: 'Login' },
                { href: '/register', label: 'Register' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-electric-400">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 font-heading font-bold">Contact</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-electric-500" />
                support@velocityrent.com
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-electric-500" />
                +91 98765 43210
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-electric-500" />
                Pune & Mumbai, Maharashtra, India
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VelocityRent. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Developed by <span className="font-medium text-electric-400">Sigmacro Technologies</span>
            </p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="hover:text-electric-400 cursor-pointer">Privacy</span>
            <span className="hover:text-electric-400 cursor-pointer">Terms</span>
            <span className="hover:text-electric-400 cursor-pointer">Refund Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
