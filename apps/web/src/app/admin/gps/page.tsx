'use client';

import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { gpsService } from '@/services';

export default function GPSTrackingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['gps-fleet'],
    queryFn: () => gpsService.fleet().then((r) => r.data.data),
    refetchInterval: 10000,
  });

  const fleet = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">GPS Tracking</h1>
        <p className="text-muted-foreground">Live fleet monitoring and route history</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-electric-500" /> Live Map</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-80 items-center justify-center rounded-xl bg-gradient-to-br from-electric-900/20 to-background border border-border/30">
              <div className="text-center text-muted-foreground">
                <Navigation className="mx-auto h-12 w-12 text-electric-500 animate-pulse" />
                <p className="mt-4">Integrate Google Maps API for live tracking</p>
                <p className="text-xs mt-1">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fleet Status ({fleet.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {isLoading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded bg-muted/20" />)
            ) : fleet.length === 0 ? (
              <p className="text-sm text-muted-foreground">No GPS data available. Vehicles need GPS devices configured.</p>
            ) : (
              fleet.map((item: {
                vehicle: { _id: string; name: string; registrationNumber: string };
                location: { speed: number; ignition: boolean; location: { coordinates: number[] }; timestamp: string };
              }) => (
                <div key={item.vehicle._id} className="rounded-lg border border-border/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{item.vehicle.name}</p>
                    <Badge variant={item.location?.ignition ? 'success' : 'outline'}>
                      {item.location?.ignition ? 'Running' : 'Idle'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.vehicle.registrationNumber}</p>
                  <p className="text-xs mt-1">Speed: {item.location?.speed || 0} km/h</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
