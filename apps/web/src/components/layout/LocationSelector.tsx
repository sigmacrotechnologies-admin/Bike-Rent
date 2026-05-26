'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { locationService, ServiceArea } from '@/services';
import { useLocationStore } from '@/store';
import { cn } from '@/utils/cn';

const selectClass =
  'flex h-10 w-full rounded-lg border border-input bg-background/80 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

type LocationSelectorProps = {
  compact?: boolean;
  className?: string;
  showLabels?: boolean;
};

export function LocationSelector({ compact = false, className = '', showLabels = true }: LocationSelectorProps) {
  const { city, hub, setCity, setHub } = useLocationStore();

  const { data: areas = [] } = useQuery({
    queryKey: ['service-areas'],
    queryFn: () => locationService.list().then((r) => r.data.data as ServiceArea[]),
    staleTime: 5 * 60 * 1000,
  });

  const hubs = useMemo(() => {
    if (!city) return [];
    return areas.find((a) => a.name === city)?.hubs || [];
  }, [areas, city]);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <MapPin className="h-4 w-4 shrink-0 text-electric-500" />
        <select
          className={cn(selectClass, 'h-9 min-w-[120px] max-w-[140px] text-xs')}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="Select city"
        >
          <option value="">All Cities</option>
          {areas.map((a) => (
            <option key={a._id} value={a.name}>{a.name}</option>
          ))}
        </select>
        <select
          className={cn(selectClass, 'h-9 min-w-[130px] max-w-[160px] text-xs')}
          value={hub}
          onChange={(e) => setHub(e.target.value)}
          disabled={!city}
          aria-label="Select location"
        >
          <option value="">{city ? 'All Locations' : 'Select city first'}</option>
          {hubs.map((h) => (
            <option key={h._id} value={h.name}>{h.name}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
      <div className="space-y-1">
        {showLabels && (
          <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-electric-500" /> City / Region
          </label>
        )}
        <select className={selectClass} value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">All Cities</option>
          {areas.map((a) => (
            <option key={a._id} value={a.name}>{a.name}, {a.state}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        {showLabels && (
          <label className="text-xs font-medium text-muted-foreground">Pickup Location</label>
        )}
        <select
          className={selectClass}
          value={hub}
          onChange={(e) => setHub(e.target.value)}
          disabled={!city}
        >
          <option value="">{city ? 'All locations in ' + city : 'Select a city first'}</option>
          {hubs.map((h) => (
            <option key={h._id} value={h.name}>{h.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function useLocationFilterParams() {
  const { city, hub } = useLocationStore();
  return {
    ...(city ? { city } : {}),
    ...(hub ? { hub } : {}),
  };
}
