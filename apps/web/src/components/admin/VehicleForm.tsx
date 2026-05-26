'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { vehicleService, locationService, ServiceArea } from '@/services';
import { VEHICLE_TYPES } from '@/utils/constants';
import { VehicleImagePicker } from '@/components/admin/VehicleImagePicker';

const optionalNumber = z.preprocess(
  (v) => (v === '' || v === undefined || v === null || Number.isNaN(Number(v)) ? undefined : v),
  z.coerce.number().optional()
);

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  type: z.enum(['bike', 'car', 'ev', 'scooter']),
  registrationNumber: z.string().min(4, 'Registration number is required'),
  status: z.enum(['available', 'booked', 'maintenance', 'inactive', 'sold']).optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: optionalNumber,
  color: z.string().optional(),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'cng']).optional(),
  transmission: z.enum(['manual', 'automatic']).optional(),
  seats: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().min(1).optional()
  ),
  engineCapacity: z.string().optional(),
  hourly: optionalNumber,
  daily: z.coerce.number().min(0, 'Daily rate is required'),
  weekly: optionalNumber,
  monthly: optionalNumber,
  securityDeposit: optionalNumber,
  lateFeePerHour: optionalNumber,
  taxPercent: optionalNumber,
  hub: z.string().min(1, 'Pickup location is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().optional(),
  longitude: optionalNumber,
  latitude: optionalNumber,
  features: z.string().optional(),
  description: z.string().optional(),
  gpsDeviceId: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

type VehicleFormProps = {
  mode: 'create' | 'edit';
  vehicleId?: string;
  defaultValues?: Partial<FormData>;
  defaultThumbnail?: string;
  prefillCity?: string;
  prefillHub?: string;
  prefillType?: string;
};

function getInitialStep(mode: string, city?: string, hub?: string, type?: string) {
  if (mode !== 'create') return 3;
  if (city && hub && type) return 3;
  if (city && hub) return 2;
  return 1;
}

const selectClass =
  'flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function buildPayload(data: FormData, thumbnail: string) {
  const features = data.features
    ? data.features.split(',').map((f) => f.trim()).filter(Boolean)
    : [];

  const daily = data.daily || 800;
  const hourly = data.hourly || Math.round(daily / 10);

  const payload: Record<string, unknown> = {
    name: data.name,
    type: data.type,
    registrationNumber: data.registrationNumber.toUpperCase(),
    specs: {
      brand: data.brand || 'N/A',
      model: data.model || 'N/A',
      year: data.year || new Date().getFullYear(),
      color: data.color || 'N/A',
      fuelType: data.fuelType || 'petrol',
      transmission: data.transmission || 'manual',
      ...(data.seats ? { seats: data.seats } : {}),
      ...(data.engineCapacity ? { engineCapacity: data.engineCapacity } : {}),
    },
    pricing: {
      hourly,
      daily,
      weekly: data.weekly || daily * 6,
      monthly: data.monthly || daily * 25,
      securityDeposit: data.securityDeposit ?? 2000,
      lateFeePerHour: data.lateFeePerHour ?? 50,
      taxPercent: data.taxPercent ?? 18,
    },
    location: {
      hub: data.hub,
      city: data.city,
      address: data.address || '',
      coordinates: [data.longitude ?? 73.8567, data.latitude ?? 18.5204],
    },
    features,
    description: data.description || '',
    isFeatured: data.isFeatured || false,
  };

  if (data.gpsDeviceId) payload.gpsDeviceId = data.gpsDeviceId;
  if (thumbnail?.startsWith('/assets/vehicles/')) payload.thumbnail = thumbnail;

  return payload;
}

function formatApiError(err: unknown): string {
  const axiosErr = err as {
    response?: { data?: { message?: string; errors?: { field: string; message: string }[] } };
  };
  const data = axiosErr.response?.data;
  if (data?.errors?.length) {
    return data.errors.map((e) => `${e.field}: ${e.message}`).join(' · ');
  }
  if (data?.message?.includes('already exists')) {
    return 'Registration number already exists. Use a unique number.';
  }
  return data?.message || 'Failed to save vehicle';
}

export function VehicleForm({
  mode,
  vehicleId,
  defaultValues,
  defaultThumbnail = '',
  prefillCity = '',
  prefillHub = '',
  prefillType = '',
}: VehicleFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [thumbnail, setThumbnail] = useState(defaultThumbnail);
  const [step, setStep] = useState(() => getInitialStep(mode, prefillCity, prefillHub, prefillType));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fuelType: 'petrol',
      transmission: 'manual',
      year: new Date().getFullYear(),
      hourly: 80,
      daily: 800,
      weekly: 4500,
      monthly: 15000,
      securityDeposit: 2000,
      lateFeePerHour: 50,
      taxPercent: 18,
      hub: prefillHub,
      city: prefillCity,
      type: (prefillType as FormData['type']) || 'bike',
      longitude: 73.8567,
      latitude: 18.5204,
      status: 'available',
      isFeatured: false,
      ...defaultValues,
    },
  });

  const vehicleType = watch('type');
  const selectedCity = watch('city');
  const selectedHub = watch('hub');

  const { data: serviceAreas = [] } = useQuery({
    queryKey: ['service-areas'],
    queryFn: () => locationService.list().then((r) => r.data.data as ServiceArea[]),
  });

  const cityHubs = serviceAreas.find((a) => a.name === selectedCity)?.hubs || [];

  const handleCityChange = (cityName: string) => {
    setValue('city', cityName);
    setValue('hub', '');
    setValue('address', '');
  };

  const handleHubChange = (hubName: string) => {
    setValue('hub', hubName);
    const hubData = cityHubs.find((h) => h.name === hubName);
    if (hubData?.address) setValue('address', hubData.address);
  };

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = buildPayload(data, thumbnail);
      if (mode === 'edit' && data.status) payload.status = data.status;
      return mode === 'create'
        ? vehicleService.create(payload)
        : vehicleService.update(vehicleId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fleet'] });
      if (vehicleId) queryClient.invalidateQueries({ queryKey: ['admin-vehicle', vehicleId] });
      router.push('/admin/fleet');
    },
    onError: (err: unknown) => {
      setError(formatApiError(err));
    },
  });

  const onInvalid = (formErrors: typeof errors) => {
    const msgs = Object.entries(formErrors)
      .map(([key, val]) => `${key}: ${val?.message}`)
      .filter(Boolean)
      .join(' · ');
    setError(msgs || 'Please fill in the required fields (name, registration, hub, city, daily rate).');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/fleet">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold">
            {mode === 'create' ? 'Add Vehicle' : 'Edit Vehicle'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'create'
              ? `Step ${step} of 3 — ${step === 1 ? 'Select location' : step === 2 ? 'Choose vehicle type' : 'Enter vehicle details'}`
              : 'Update vehicle details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => { setError(''); mutation.mutate(data); }, onInvalid)} className="space-y-6">
        {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

        {mode === 'create' && step < 3 && (
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-electric-500' : 'bg-muted/30'}`}
              />
            ))}
          </div>
        )}

        {mode === 'create' && step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1 — Select Location</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>City / Region *</Label>
                <select className={selectClass} value={selectedCity} onChange={(e) => handleCityChange(e.target.value)}>
                  <option value="">Select city</option>
                  {serviceAreas.map((area) => (
                    <option key={area._id} value={area.name}>{area.name}, {area.state}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Pickup Location *</Label>
                <select
                  className={selectClass}
                  value={selectedHub}
                  onChange={(e) => handleHubChange(e.target.value)}
                  disabled={!selectedCity}
                >
                  <option value="">{selectedCity ? 'Select location' : 'Select city first'}</option>
                  {cityHubs.map((h) => (
                    <option key={h._id} value={h.name}>{h.name}</option>
                  ))}
                </select>
              </div>
              <input type="hidden" {...register('city')} />
              <input type="hidden" {...register('hub')} />
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="button"
                  disabled={!selectedCity || !selectedHub}
                  onClick={() => setStep(2)}
                >
                  Next — Choose Type
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === 'create' && step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2 — Vehicle Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Adding to <strong>{selectedHub}</strong>, {selectedCity}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(VEHICLE_TYPES).map(([key, { label, icon }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setValue('type', key as FormData['type']);
                      setStep(3);
                    }}
                    className={`rounded-xl border p-6 text-left transition-all hover:border-electric-500/50 hover:bg-electric-500/5 ${
                      vehicleType === key ? 'border-electric-500 bg-electric-500/10' : 'border-border/40'
                    }`}
                  >
                    <span className="text-2xl">{icon}</span>
                    <p className="mt-2 font-semibold">{label}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(mode === 'edit' || step === 3) && (
          <>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Vehicle Name *</Label>
              <Input placeholder="Royal Enfield Classic 350" {...register('name')} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select className={selectClass} {...register('type')}>
                {Object.entries(VEHICLE_TYPES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Registration Number *</Label>
              <Input placeholder="MH12AB1234" {...register('registrationNumber')} />
              {errors.registrationNumber && (
                <p className="text-xs text-red-400">{errors.registrationNumber.message}</p>
              )}
            </div>
            {mode === 'edit' && (
              <div className="space-y-2">
                <Label>Status</Label>
                <select className={selectClass} {...register('status')}>
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            )}
            {mode === 'create' && step === 3 && (
              <div className="md:col-span-2 rounded-lg bg-muted/20 p-3 text-sm">
                <strong>{VEHICLE_TYPES[vehicleType]?.icon} {VEHICLE_TYPES[vehicleType]?.label}</strong>
                {' · '}{selectedHub}, {selectedCity}
                <Button type="button" variant="link" className="ml-2 h-auto p-0 text-xs" onClick={() => setStep(1)}>
                  Change
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" id="isFeatured" className="h-4 w-4" {...register('isFeatured')} />
              <Label htmlFor="isFeatured">Featured on homepage</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Image</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleImagePicker
              value={thumbnail}
              onChange={setThumbnail}
              vehicleType={vehicleType}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input placeholder="Royal Enfield (optional)" {...register('brand')} />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input placeholder="Classic 350 (optional)" {...register('model')} />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" {...register('year')} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input placeholder="Black" {...register('color')} />
            </div>
            <div className="space-y-2">
              <Label>Fuel Type</Label>
              <select className={selectClass} {...register('fuelType')}>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="cng">CNG</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Transmission</Label>
              <select className={selectClass} {...register('transmission')}>
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </div>
            {(vehicleType === 'car' || vehicleType === 'ev') && (
              <div className="space-y-2">
                <Label>Seats</Label>
                <Input type="number" {...register('seats')} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Engine / Battery</Label>
              <Input placeholder="349cc" {...register('engineCapacity')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing (₹)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Hourly Rate</Label>
              <Input type="number" {...register('hourly')} />
              {errors.hourly && <p className="text-xs text-red-400">{errors.hourly.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Daily Rate *</Label>
              <Input type="number" {...register('daily')} />
              {errors.daily && <p className="text-xs text-red-400">{errors.daily.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Weekly Rate</Label>
              <Input type="number" {...register('weekly')} />
            </div>
            <div className="space-y-2">
              <Label>Monthly Rate</Label>
              <Input type="number" {...register('monthly')} />
            </div>
            <div className="space-y-2">
              <Label>Security Deposit</Label>
              <Input type="number" {...register('securityDeposit')} />
            </div>
            <div className="space-y-2">
              <Label>Late Fee / Hour</Label>
              <Input type="number" {...register('lateFeePerHour')} />
            </div>
            <div className="space-y-2">
              <Label>Tax / GST (%)</Label>
              <Input type="number" step="0.01" {...register('taxPercent')} placeholder="18" />
              <p className="text-xs text-muted-foreground">Standard GST rate applied on rental (default 18%)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>City / Region *</Label>
              <select
                className={selectClass}
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
              >
                <option value="">Select city</option>
                {serviceAreas.map((area) => (
                  <option key={area._id} value={area.name}>{area.name}, {area.state}</option>
                ))}
              </select>
              {errors.city && <p className="text-xs text-red-400">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Pickup Location *</Label>
              <select
                className={selectClass}
                value={selectedHub}
                onChange={(e) => handleHubChange(e.target.value)}
                disabled={!selectedCity}
              >
                <option value="">{selectedCity ? 'Select location' : 'Select city first'}</option>
                {cityHubs.map((h) => (
                  <option key={h._id} value={h.name}>{h.name}</option>
                ))}
              </select>
              {errors.hub && <p className="text-xs text-red-400">{errors.hub.message}</p>}
            </div>
            <input type="hidden" {...register('city')} />
            <input type="hidden" {...register('hub')} />
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input placeholder="Auto-filled from location" {...register('address')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Features (comma separated)</Label>
              <Input placeholder="Helmet Included, GPS Tracker" {...register('features')} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe the vehicle..."
                {...register('description')}
              />
            </div>
            <div className="space-y-2">
              <Label>GPS Device ID</Label>
              <Input placeholder="GPS-BIKE-001" {...register('gpsDeviceId')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between gap-3">
          {mode === 'create' && step === 3 ? (
            <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
          ) : (
            <Link href="/admin/fleet">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Add Vehicle' : 'Save Changes'}
          </Button>
        </div>
        </>
        )}
      </form>
    </div>
  );
}
