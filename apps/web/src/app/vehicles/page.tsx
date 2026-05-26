'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Suspense, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VehicleGrid } from '@/components/vehicles/VehicleCard';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { LocationSelector } from '@/components/layout/LocationSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { vehicleService } from '@/services';
import { useLocationStore, useBookingStore } from '@/store';
import { VEHICLE_TYPES } from '@/utils/constants';
import { cn } from '@/utils/cn';
import { toDatetimeLocalValue } from '@/utils/dates';

function buildTypeHref(type: string, city: string, hub: string, startDate: string, endDate: string) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (city) params.set('city', city);
  if (hub) params.set('hub', hub);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const qs = params.toString();
  return qs ? `/vehicles?${qs}` : '/vehicles';
}

function VehiclesContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || '';
  const urlCity = searchParams.get('city') || '';
  const urlHub = searchParams.get('hub') || '';
  const urlStartDate = searchParams.get('startDate') || '';
  const urlEndDate = searchParams.get('endDate') || '';
  const { city, hub, setLocation } = useLocationStore();
  const setBookingDetails = useBookingStore((s) => s.setBookingDetails);

  useEffect(() => {
    if (urlCity || urlHub) {
      setLocation(urlCity, urlHub);
    }
  }, [urlCity, urlHub, setLocation]);

  useEffect(() => {
    if (urlStartDate && urlEndDate) {
      setBookingDetails({ startDate: urlStartDate, endDate: urlEndDate });
    }
  }, [urlStartDate, urlEndDate, setBookingDetails]);

  const filterCity = city || urlCity;
  const filterHub = hub || urlHub;

  const listParams = useMemo(() => ({
    ...(type ? { type } : {}),
    ...(filterCity ? { city: filterCity } : {}),
    ...(filterHub ? { hub: filterHub } : {}),
    ...(urlStartDate ? { startDate: urlStartDate } : {}),
    ...(urlEndDate ? { endDate: urlEndDate } : {}),
    limit: 24,
    sort: '-createdAt',
  }), [type, filterCity, filterHub, urlStartDate, urlEndDate]);

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', type, filterCity, filterHub, urlStartDate, urlEndDate],
    queryFn: () => vehicleService.list(listParams).then((r) => r.data),
  });

  const vehicles = data?.data || [];
  const total = data?.pagination?.total || vehicles.length;

  const locationLabel = filterHub
    ? `${filterHub}, ${filterCity}`
    : filterCity || 'all locations';

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden pt-24 pb-12">
        <MeshBackground />
        <div className="container relative mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="section-badge">Our Fleet</span>
            <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl lg:text-6xl">
              Find Your <span className="text-gradient">Perfect Ride</span>
            </h1>
            <p className="mt-3 max-w-xl text-lg text-muted-foreground">
              {total} vehicles available{filterCity ? ` in ${locationLabel}` : ' across all cities'}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16">
        <div className="sticky top-[4.5rem] z-30 -mx-4 mb-8 border-b border-border/40 bg-background/90 px-4 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-4">
            <LocationSelector />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, brand..."
                  className="h-12 rounded-xl border-border/50 bg-card/50 pl-11 backdrop-blur-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!type ? 'default' : 'outline'}
                  size="sm"
                  className={cn('rounded-xl', !type && 'glow-blue')}
                  asChild
                >
                  <a href={buildTypeHref('', filterCity, filterHub, urlStartDate, urlEndDate)}>All</a>
                </Button>
                {Object.entries(VEHICLE_TYPES).map(([key, val]) => (
                  <Button
                    key={key}
                    variant={type === key ? 'default' : 'outline'}
                    size="sm"
                    className={cn('rounded-xl', type === key && 'glow-blue')}
                    asChild
                  >
                    <a href={buildTypeHref(key, filterCity, filterHub, urlStartDate, urlEndDate)}>{val.icon} {val.label}</a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-lg px-3 py-1">
              {total} vehicles
            </Badge>
            {filterCity && (
              <Badge className="rounded-lg bg-electric-500/15 text-electric-400 border-electric-500/30">
                {locationLabel}
              </Badge>
            )}
            {urlStartDate && urlEndDate && (
              <Badge className="rounded-lg bg-neon-400/15 text-neon-400 border-neon-400/30">
                {toDatetimeLocalValue(urlStartDate).replace('T', ' ')} → {toDatetimeLocalValue(urlEndDate).replace('T', ' ')}
              </Badge>
            )}
            {type && (
              <Badge className="rounded-lg bg-electric-500/15 text-electric-400 border-electric-500/30">
                {VEHICLE_TYPES[type as keyof typeof VEHICLE_TYPES]?.label}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground">
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted/20" />
            ))}
          </div>
        ) : (
          <VehicleGrid vehicles={vehicles} />
        )}
      </div>

      <Footer />
    </main>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-electric-500 border-t-transparent" />
      </div>
    }>
      <VehiclesContent />
    </Suspense>
  );
}
