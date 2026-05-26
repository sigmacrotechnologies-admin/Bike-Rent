'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bike, Car, Zap, CircleDot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { LocationSelector } from '@/components/layout/LocationSelector';
import { DateRangePicker } from '@/components/booking/DateRangePicker';
import { useLocationStore, useBookingStore } from '@/store';
import {
  buildSearchParams,
  defaultPickupDatetimeLocal,
  defaultReturnDatetimeLocal,
  toDatetimeLocalValue,
  validateDateRange,
} from '@/utils/dates';

const vehicleTypes = [
  { type: 'bike', icon: Bike, label: 'Bikes', desc: 'Self-drive motorcycles', color: 'from-electric-500 to-blue-600', glow: 'group-hover:shadow-electric-500/30' },
  { type: 'car', icon: Car, label: 'Cars', desc: 'Premium sedans & SUVs', color: 'from-indigo-500 to-violet-600', glow: 'group-hover:shadow-indigo-500/30' },
  { type: 'ev', icon: Zap, label: 'EVs', desc: 'Zero-emission rides', color: 'from-neon-400 to-emerald-500', glow: 'group-hover:shadow-neon-400/30' },
  { type: 'scooter', icon: CircleDot, label: 'Scooters', desc: 'Smart urban mobility', color: 'from-fuchsia-500 to-pink-600', glow: 'group-hover:shadow-fuchsia-500/30' },
];

const stats = [
  { value: '24+', label: 'Premium Vehicles' },
  { value: '4.8★', label: 'Avg Rating' },
  { value: '500+', label: 'Happy Riders' },
  { value: '24/7', label: 'GPS Tracking' },
];

export function HeroSection() {
  const router = useRouter();
  const { city, hub } = useLocationStore();
  const { startDate: storedStart, endDate: storedEnd, setBookingDetails } = useBookingStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [datesReady, setDatesReady] = useState(false);

  useEffect(() => {
    if (datesReady) return;
    const pickup = storedStart ? toDatetimeLocalValue(storedStart) : defaultPickupDatetimeLocal();
    const ret = storedEnd ? toDatetimeLocalValue(storedEnd) : defaultReturnDatetimeLocal(pickup);
    setStartDate(pickup);
    setEndDate(ret);
    setDatesReady(true);
  }, [storedStart, storedEnd, datesReady]);

  const searchQuery = useMemo(
    () => buildSearchParams({ city, hub, startDate, endDate }),
    [city, hub, startDate, endDate]
  );

  const searchHref = `/vehicles${searchQuery}`;

  const handleSearch = () => {
    const error = validateDateRange(startDate, endDate);
    if (error) {
      setDateError(error);
      return;
    }
    setDateError('');
    setBookingDetails({
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
    router.push(searchHref);
  };

  const handleStartChange = (value: string) => {
    setStartDate(value);
    setDateError('');
    if (endDate && value && new Date(endDate) <= new Date(value)) {
      setEndDate(defaultReturnDatetimeLocal(value));
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden pt-16">
      <MeshBackground />

      <div className="container relative mx-auto px-4 py-12 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="section-badge mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              India&apos;s #1 Mobility Platform
            </div>

            <h1 className="font-display text-5xl font-extrabold leading-[1.1] tracking-tight lg:text-6xl xl:text-7xl">
              <span className="text-gradient-blue">Drive</span>
              <br />
              Your <span className="text-gradient">Freedom</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Rent premium bikes, cars, EVs & scooters with live GPS tracking,
              instant booking, and secure payments. Your adventure starts now.
            </p>

            <div className="mt-8 space-y-3 rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-md">
              <LocationSelector showLabels />
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartChange={handleStartChange}
                onEndChange={(value) => { setEndDate(value); setDateError(''); }}
                error={dateError}
              />
              <div className="flex justify-end pt-1">
                <Button className="w-full sm:w-auto glow-blue" onClick={handleSearch}>
                  Search Fleet <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href={searchHref}>
                <Button size="lg" className="glow-blue px-8">
                  Explore Fleet
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="border-electric-500/30 hover:bg-electric-500/10">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {vehicleTypes.map((vt) => (
              <Link
                key={vt.type}
                href={`/vehicles${buildSearchParams({ type: vt.type, city, hub, startDate, endDate })}`}
                className={`group relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-electric-500/40 hover:shadow-xl ${vt.glow}`}
              >
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${vt.color} p-3`}>
                  <vt.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading font-bold">{vt.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{vt.desc}</p>
                <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-electric-500 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
              </Link>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 grid grid-cols-2 gap-6 border-t border-border/30 pt-12 md:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold text-electric-500">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
