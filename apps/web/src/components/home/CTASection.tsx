'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MeshBackground } from '@/components/ui/MeshBackground';

export function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <MeshBackground />
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-electric-500/30 bg-gradient-to-br from-electric-500/10 via-card/80 to-neon-400/5 p-12 text-center backdrop-blur-md md:p-16"
        >
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-electric-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-neon-400/15 blur-3xl" />

          <h2 className="relative font-display text-4xl font-bold md:text-5xl">
            Ready to Hit the <span className="text-gradient">Road?</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Join thousands of riders. Book your perfect bike or car in under 2 minutes.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/vehicles">
              <Button size="lg" className="rounded-xl px-10 glow-blue text-base">
                Browse Fleet <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="rounded-xl border-electric-500/40 px-10 text-base hover:bg-electric-500/10">
                Create Free Account
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
