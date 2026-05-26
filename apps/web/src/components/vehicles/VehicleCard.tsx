'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Star, Fuel, ArrowUpRight, Gauge } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VehicleImage } from '@/components/vehicles/VehicleImage';
import { formatCurrency } from '@/utils/cn';
import { VEHICLE_TYPES } from '@/utils/constants';

interface Vehicle {
  _id: string;
  name: string;
  type: keyof typeof VEHICLE_TYPES;
  slug: string;
  status: string;
  thumbnail?: string;
  registrationNumber?: string;
  specs?: { brand?: string; fuelType?: string; transmission?: string };
  pricing: { daily: number; hourly: number };
  location?: { city?: string; hub?: string };
  rating?: number;
  isFeatured?: boolean;
}

const statusColors: Record<string, string> = {
  available: 'bg-neon-400/90 text-black',
  booked: 'bg-amber-500/90 text-black',
  maintenance: 'bg-red-500/90 text-white',
};

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const typeInfo = VEHICLE_TYPES[vehicle.type] || VEHICLE_TYPES.bike;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group"
    >
      <Card className="card-shine premium-border overflow-hidden border-border/40 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-electric-500/50 hover:shadow-2xl hover:shadow-electric-500/10">
        <div className="relative aspect-[16/10] overflow-hidden">
          <VehicleImage vehicle={vehicle} className="absolute inset-0 transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />

          <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
            {vehicle.isFeatured && (
              <Badge className="bg-electric-500/90 text-white border-0 shadow-lg">⭐ Featured</Badge>
            )}
            <Badge className={`border-0 text-xs font-semibold shadow-md ${statusColors[vehicle.status] || 'bg-secondary'}`}>
              {vehicle.status}
            </Badge>
          </div>

          <Badge className="absolute right-3 top-3 z-10 border-electric-500/30 bg-black/50 text-white backdrop-blur-md">
            {typeInfo.icon} {typeInfo.label}
          </Badge>

          {/* Price overlay */}
          <div className="absolute bottom-3 left-3 z-10 rounded-xl bg-black/60 px-3 py-2 backdrop-blur-md">
            <p className="text-xs text-white/70">from</p>
            <p className="font-display text-xl font-bold text-white">
              {formatCurrency(vehicle.pricing.daily)}
              <span className="text-xs font-normal text-white/60">/day</span>
            </p>
          </div>
        </div>

        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-heading text-lg font-bold leading-tight transition-colors group-hover:text-electric-400">
                {vehicle.name}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{vehicle.specs?.brand}</p>
            </div>
            {vehicle.rating !== undefined && vehicle.rating > 0 && (
              <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold">{vehicle.rating}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {vehicle.location?.city && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 text-electric-500" />{vehicle.location.city}
              </span>
            )}
            {vehicle.specs?.fuelType && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-1 text-xs text-muted-foreground">
                <Fuel className="h-3 w-3 text-electric-500" />{vehicle.specs.fuelType}
              </span>
            )}
            {vehicle.specs?.transmission && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-1 text-xs text-muted-foreground">
                <Gauge className="h-3 w-3 text-electric-500" />{vehicle.specs.transmission}
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border/30 bg-secondary/20 p-4">
          <div>
            <span className="text-xs text-muted-foreground">Hourly</span>
            <p className="font-semibold text-electric-400">{formatCurrency(vehicle.pricing.hourly)}/hr</p>
          </div>
          <Link href={`/vehicles/${vehicle._id}`}>
            <Button size="sm" className="rounded-xl group/btn">
              Book Now
              <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export function VehicleGrid({ vehicles }: { vehicles: Vehicle[] }) {
  if (!vehicles.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 py-24 text-center">
        <p className="text-lg font-medium text-muted-foreground">No vehicles found</p>
        <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {vehicles.map((v, i) => (
        <motion.div
          key={v._id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
        >
          <VehicleCard vehicle={v} />
        </motion.div>
      ))}
    </div>
  );
}
