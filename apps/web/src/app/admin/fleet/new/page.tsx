'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { VehicleForm } from '@/components/admin/VehicleForm';

function AddVehicleContent() {
  const searchParams = useSearchParams();
  return (
    <VehicleForm
      mode="create"
      prefillCity={searchParams.get('city') || ''}
      prefillHub={searchParams.get('hub') || ''}
      prefillType={searchParams.get('type') || ''}
    />
  );
}

export default function AddVehiclePage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/20" />}>
      <AddVehicleContent />
    </Suspense>
  );
}
