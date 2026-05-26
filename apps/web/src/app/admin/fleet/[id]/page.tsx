'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { VehicleForm } from '@/components/admin/VehicleForm';
import { vehicleService } from '@/services';

export default function EditVehiclePage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-vehicle', id],
    queryFn: () => vehicleService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted/20" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
        Vehicle not found or failed to load.
      </div>
    );
  }

  const coords = data.location?.coordinates?.coordinates || [73.8567, 18.5204];

  return (
    <VehicleForm
      mode="edit"
      vehicleId={id}
      defaultValues={{
        name: data.name,
        type: data.type,
        registrationNumber: data.registrationNumber,
        status: data.status,
        brand: data.specs?.brand || '',
        model: data.specs?.model || '',
        year: data.specs?.year || new Date().getFullYear(),
        color: data.specs?.color || '',
        fuelType: data.specs?.fuelType || 'petrol',
        transmission: data.specs?.transmission || 'manual',
        seats: data.specs?.seats,
        engineCapacity: data.specs?.engineCapacity || '',
        hourly: data.pricing?.hourly,
        daily: data.pricing?.daily,
        weekly: data.pricing?.weekly,
        monthly: data.pricing?.monthly,
        securityDeposit: data.pricing?.securityDeposit,
        lateFeePerHour: data.pricing?.lateFeePerHour,
        taxPercent: data.pricing?.taxPercent ?? 18,
        hub: data.location?.hub || '',
        city: data.location?.city || '',
        address: data.location?.address || '',
        longitude: coords[0],
        latitude: coords[1],
        features: (data.features || []).join(', '),
        description: data.description || '',
        gpsDeviceId: data.gpsDeviceId || '',
        isFeatured: data.isFeatured || false,
      }}
      defaultThumbnail={data.thumbnail || ''}
    />
  );
}
