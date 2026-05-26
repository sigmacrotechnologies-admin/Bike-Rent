'use client';

import { useEffect, useState } from 'react';
import { getVehicleImage } from '@/utils/vehicleImages';
import { VEHICLE_TYPES } from '@/utils/constants';
import { cn } from '@/utils/cn';

interface VehicleImageProps {
  vehicle: {
    thumbnail?: string;
    registrationNumber?: string;
    type?: string;
    name?: string;
  };
  className?: string;
  priority?: boolean;
  imgClassName?: string;
}

export function VehicleImage({
  vehicle,
  className = '',
  priority = false,
  imgClassName = '',
}: VehicleImageProps) {
  const fallback = `/assets/vehicles/defaults/${vehicle.type || 'bike'}.svg`;
  const [src, setSrc] = useState(() => getVehicleImage(vehicle));
  const typeInfo = VEHICLE_TYPES[vehicle.type as keyof typeof VEHICLE_TYPES];

  useEffect(() => {
    setSrc(getVehicleImage(vehicle));
  }, [vehicle.thumbnail, vehicle.registrationNumber, vehicle.type, vehicle.name]);

  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-electric-900/20 to-background', className)}>
      {/* Native img — works for SVG, PNG, JPG without Next.js image optimizer blocking SVGs */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={vehicle.name || 'Vehicle'}
        loading={priority ? 'eager' : 'lazy'}
        className={cn(
          'absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
          imgClassName
        )}
        onError={() => {
          if (src !== fallback) setSrc(fallback);
        }}
      />
      {!src.includes('/defaults/') && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
      )}
      {typeInfo && <span className="sr-only">{typeInfo.label}</span>}
    </div>
  );
}
