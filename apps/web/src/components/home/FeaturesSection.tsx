'use client';

import { motion } from 'framer-motion';
import { Shield, MapPin, CreditCard, Clock, Headphones, Award } from 'lucide-react';

const features = [
  { icon: Shield, title: 'Verified Fleet', desc: 'Every vehicle GPS-enabled, insured & inspected before every rental.', color: 'from-electric-500 to-blue-600' },
  { icon: MapPin, title: 'Live GPS Tracking', desc: 'Real-time location, route history, geofence alerts & theft protection.', color: 'from-neon-400 to-emerald-500' },
  { icon: CreditCard, title: 'Secure Payments', desc: 'Razorpay & Stripe checkout with instant confirmation & invoices.', color: 'from-violet-500 to-purple-600' },
  { icon: Clock, title: 'Flexible Rentals', desc: 'Hourly, daily, weekly plans with easy extensions & fair cancellation.', color: 'from-amber-500 to-orange-500' },
  { icon: Headphones, title: '24/7 Support', desc: 'Dedicated support team for roadside assistance and booking help.', color: 'from-pink-500 to-rose-500' },
  { icon: Award, title: 'Premium Quality', desc: 'Top brands only — Royal Enfield, KTM, Hyundai, BMW & more.', color: 'from-cyan-500 to-electric-500' },
];

export function FeaturesSection() {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="section-badge">Why VelocityRent</span>
          <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            Built for the <span className="text-gradient">Modern Rider</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Enterprise-grade mobility platform with everything you need for a seamless rental experience.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-7 backdrop-blur-sm transition-all duration-300 hover:border-electric-500/40 hover:shadow-xl hover:shadow-electric-500/5"
            >
              <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} shadow-lg transition-transform group-hover:scale-110`}>
                <f.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-heading text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-electric-500/5 blur-2xl transition-all group-hover:bg-electric-500/10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
