'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Trash2, Loader2 } from 'lucide-react';
import { locationService, ServiceArea } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const [cityName, setCityName] = useState('');
  const [cityState, setCityState] = useState('Maharashtra');
  const [hubForms, setHubForms] = useState<Record<string, { name: string; address: string }>>({});
  const [error, setError] = useState('');

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ['admin-locations'],
    queryFn: () => locationService.listAdmin().then((r) => r.data.data as ServiceArea[]),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
    queryClient.invalidateQueries({ queryKey: ['service-areas'] });
  };

  const createCity = useMutation({
    mutationFn: () => locationService.createCity({ name: cityName, state: cityState }),
    onSuccess: () => {
      setCityName('');
      setError('');
      invalidate();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to add city');
    },
  });

  const addHub = useMutation({
    mutationFn: ({ cityId, name, address }: { cityId: string; name: string; address: string }) =>
      locationService.addHub(cityId, { name, address }),
    onSuccess: (_, vars) => {
      setHubForms((prev) => ({ ...prev, [vars.cityId]: { name: '', address: '' } }));
      invalidate();
    },
  });

  const deleteHub = useMutation({
    mutationFn: ({ cityId, hubId }: { cityId: string; hubId: string }) =>
      locationService.deleteHub(cityId, hubId),
    onSuccess: invalidate,
  });

  const deleteCity = useMutation({
    mutationFn: (cityId: string) => locationService.deleteCity(cityId),
    onSuccess: invalidate,
  });

  const updateHubForm = (cityId: string, field: 'name' | 'address', value: string) => {
    setHubForms((prev) => ({
      ...prev,
      [cityId]: { name: prev[cityId]?.name || '', address: prev[cityId]?.address || '', [field]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Locations</h1>
        <p className="text-muted-foreground">
          Add cities/regions and pickup locations (e.g. Pune → Kharadi, Baramati → MIDC)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add City / Region
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {error && <p className="md:col-span-3 text-sm text-red-400">{error}</p>}
          <div className="space-y-2">
            <Label>City Name *</Label>
            <Input placeholder="Pune, Baramati, Mumbai..." value={cityName} onChange={(e) => setCityName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input placeholder="Maharashtra" value={cityState} onChange={(e) => setCityState(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!cityName.trim() || createCity.isPending}
              onClick={() => createCity.mutate()}
            >
              {createCity.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add City
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted/20" />
      ) : (
        <div className="grid gap-4">
          {areas.map((area) => (
            <Card key={area._id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-electric-500" />
                  <div>
                    <CardTitle>{area.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{area.state}</p>
                  </div>
                  <Badge variant="outline">{area.hubs?.length || 0} locations</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400"
                  onClick={() => deleteCity.mutate(area._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(area.hubs || []).map((hub) => (
                    <div
                      key={hub._id}
                      className="flex items-start justify-between rounded-lg border border-border/40 bg-card/50 p-3"
                    >
                      <div>
                        <p className="font-medium">{hub.name}</p>
                        {hub.address && <p className="text-xs text-muted-foreground">{hub.address}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-red-400"
                        onClick={() => deleteHub.mutate({ cityId: area._id, hubId: hub._id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 rounded-lg border border-dashed border-border/50 p-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Location Name *</Label>
                    <Input
                      placeholder="Kharadi, Kothrud..."
                      value={hubForms[area._id]?.name || ''}
                      onChange={(e) => updateHubForm(area._id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Address (optional)</Label>
                    <Input
                      placeholder="Street, landmark..."
                      value={hubForms[area._id]?.address || ''}
                      onChange={(e) => updateHubForm(area._id, 'address', e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={!hubForms[area._id]?.name?.trim() || addHub.isPending}
                      onClick={() =>
                        addHub.mutate({
                          cityId: area._id,
                          name: hubForms[area._id].name,
                          address: hubForms[area._id]?.address || '',
                        })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Location
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
