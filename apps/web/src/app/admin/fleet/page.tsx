'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, RefreshCw, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { vehicleService, locationService, ServiceArea } from '@/services';
import { FleetVehicleCard, FleetVehicle } from '@/components/admin/FleetVehicleCard';

function buildAddUrl(city: string, hub: string, type?: string) {
  const params = new URLSearchParams({ city, hub });
  if (type) params.set('type', type);
  return `/admin/fleet/new?${params.toString()}`;
}

export default function FleetManagementPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-fleet'],
    queryFn: () => vehicleService.listAdmin({ limit: 200, sort: '-createdAt' }).then((r) => r.data),
    staleTime: 0,
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['service-areas'],
    queryFn: () => locationService.list().then((r) => r.data.data as ServiceArea[]),
  });

  const vehicles = (data?.data || []) as FleetVehicle[];
  const activeVehicles = vehicles.filter((v) => v.status !== 'sold');
  const soldVehicles = vehicles.filter((v) => v.status === 'sold');

  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, FleetVehicle[]>>();

    for (const area of areas) {
      if (!map.has(area.name)) map.set(area.name, new Map());
      for (const hub of area.hubs || []) {
        map.get(area.name)!.set(hub.name, []);
      }
    }

    for (const v of activeVehicles) {
      const city = v.location?.city || 'Unassigned';
      const hub = v.location?.hub || 'No Location';
      if (!map.has(city)) map.set(city, new Map());
      const hubs = map.get(city)!;
      if (!hubs.has(hub)) hubs.set(hub, []);
      hubs.get(hub)!.push(v);
    }

    return map;
  }, [areas, activeVehicles]);

  const toggleCity = (city: string) => {
    setExpanded((prev) => ({ ...prev, [city]: !prev[city] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Fleet Management</h1>
          <p className="text-muted-foreground">
            {activeVehicles.length} active · {soldVehicles.length} sold · grouped by location
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/fleet/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Add Vehicle</Button>
          </Link>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load fleet. {(error as Error)?.message || 'Please refresh.'}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/20" />)}
        </div>
      ) : grouped.size === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No locations configured.</p>
          <Link href="/admin/locations"><Button className="mt-4">Add Locations First</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([city, hubs]) => {
            const cityCount = [...hubs.values()].reduce((n, list) => n + list.length, 0);
            const isOpen = expanded[city] !== false;

            return (
              <div key={city} className="rounded-xl border border-border/40 bg-card/30">
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/10"
                  onClick={() => toggleCity(city)}
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <MapPin className="h-5 w-5 text-electric-500" />
                    <span className="font-display text-xl font-bold">{city}</span>
                    <Badge variant="outline">{cityCount} vehicles</Badge>
                  </div>
                </button>

                {isOpen && (
                  <div className="space-y-4 border-t border-border/30 p-4">
                    {[...hubs.entries()].map(([hub, hubVehicles]) => (
                      <div key={`${city}-${hub}`} className="rounded-lg border border-border/30 bg-background/50 p-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{hub}</h3>
                            <p className="text-sm text-muted-foreground">{hubVehicles.length} vehicle(s)</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link href={buildAddUrl(city, hub, 'bike')}>
                              <Button size="sm" variant="outline">+ Bike</Button>
                            </Link>
                            <Link href={buildAddUrl(city, hub, 'car')}>
                              <Button size="sm" variant="outline">+ Car</Button>
                            </Link>
                            <Link href={buildAddUrl(city, hub)}>
                              <Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> Add Vehicle</Button>
                            </Link>
                          </div>
                        </div>

                        {hubVehicles.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No vehicles at this location yet.</p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {hubVehicles.map((v) => (
                              <FleetVehicleCard key={v._id} vehicle={v} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {soldVehicles.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-muted-foreground">Sold Vehicles</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {soldVehicles.map((v) => (
              <FleetVehicleCard key={v._id} vehicle={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
