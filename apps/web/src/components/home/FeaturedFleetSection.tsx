'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Bike, Car } from 'lucide-react';
import { VehicleGrid } from '@/components/vehicles/VehicleCard';
import { Button } from '@/components/ui/button';
import { vehicleService } from '@/services';
import { useLocationStore } from '@/store';

function SectionHeader({
  icon: Icon,
  title,
  highlight,
  desc,
  href,
  linkLabel,
}: {
  icon: React.ElementType;
  title: string;
  highlight: string;
  desc: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric-500/15">
            <Icon className="h-4 w-4 text-electric-500" />
          </div>
          <span className="text-sm font-semibold uppercase tracking-wider text-electric-500">{title}</span>
        </div>
        <h2 className="font-display text-3xl font-bold md:text-4xl">
          Top Rated <span className="text-gradient">{highlight}</span>
        </h2>
        <p className="mt-2 max-w-md text-muted-foreground">{desc}</p>
      </div>
      <Link href={href}>
        <Button variant="outline" className="rounded-xl border-electric-500/30 hover:bg-electric-500/10">
          {linkLabel} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

export function FeaturedFleetSection() {
  const { city, hub } = useLocationStore();
  const locationParams = {
    ...(city ? { city } : {}),
    ...(hub ? { hub } : {}),
  };

  const { data: bikesData, isLoading: bikesLoading } = useQuery({
    queryKey: ['vehicles', 'featured-bikes', city, hub],
    queryFn: () => vehicleService.list({ type: 'bike', limit: 4, sort: '-rating', ...locationParams }).then((r) => r.data),
  });

  const { data: carsData, isLoading: carsLoading } = useQuery({
    queryKey: ['vehicles', 'featured-cars', city, hub],
    queryFn: () => vehicleService.list({ type: 'car', limit: 4, sort: '-rating', ...locationParams }).then((r) => r.data),
  });

  const bikes = bikesData?.data || [];
  const cars = carsData?.data || [];

  return (
    <section className="relative py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-electric-900/5 via-background to-background" />
      <div className="container relative mx-auto px-4">
        <SectionHeader
          icon={Bike}
          title="Motorcycles"
          highlight="Bikes"
          desc="From Royal Enfield cruisers to KTM sport bikes — pick your ride."
          href="/vehicles?type=bike"
          linkLabel="All Bikes"
        />

        {bikesLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted/20" />
            ))}
          </div>
        ) : (
          <VehicleGrid vehicles={bikes} />
        )}

        <div className="my-16 h-px bg-gradient-to-r from-transparent via-electric-500/30 to-transparent" />

        <SectionHeader
          icon={Car}
          title="Automobiles"
          highlight="Cars"
          desc="Hatchbacks to luxury BMW — comfort for every journey."
          href="/vehicles?type=car"
          linkLabel="All Cars"
        />

        {carsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted/20" />
            ))}
          </div>
        ) : (
          <VehicleGrid vehicles={cars} />
        )}
      </div>
    </section>
  );
}
