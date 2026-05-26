'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Banknote, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { vehicleService } from '@/services';
import { formatCurrency } from '@/utils/cn';
import { VEHICLE_TYPES } from '@/utils/constants';
import { getVehicleImage } from '@/utils/vehicleImages';

export type FleetVehicle = {
  _id: string;
  name: string;
  type: string;
  status: string;
  registrationNumber: string;
  pricing: { daily: number; taxPercent?: number };
  location?: { city: string; hub: string };
  isFeatured?: boolean;
  thumbnail?: string;
  saleInfo?: { salePrice?: number; soldAt?: string };
};

const statusVariant = (status: string) => {
  if (status === 'available') return 'success';
  if (status === 'sold') return 'destructive';
  if (status === 'booked') return 'warning';
  return 'outline';
};

export function FleetVehicleCard({ vehicle }: { vehicle: FleetVehicle }) {
  const queryClient = useQueryClient();
  const [showSell, setShowSell] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [soldTo, setSoldTo] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-fleet'] });

  const deleteMutation = useMutation({
    mutationFn: () => vehicleService.delete(vehicle._id),
    onSuccess: invalidate,
  });

  const sellMutation = useMutation({
    mutationFn: () =>
      vehicleService.sell(vehicle._id, {
        salePrice: Number(salePrice),
        soldTo,
      }),
    onSuccess: () => {
      setShowSell(false);
      invalidate();
    },
  });

  const isSold = vehicle.status === 'sold';

  return (
    <Card className={isSold ? 'opacity-70' : ''}>
      <CardContent className="p-0">
        <div className="relative h-32 overflow-hidden rounded-t-xl bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getVehicleImage(vehicle)} alt={vehicle.name} className="h-full w-full object-cover" />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{vehicle.name}</h3>
              <p className="text-xs text-muted-foreground">{vehicle.registrationNumber}</p>
            </div>
            <Badge variant={statusVariant(vehicle.status)}>{vehicle.status}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {VEHICLE_TYPES[vehicle.type as keyof typeof VEHICLE_TYPES]?.label}
            </Badge>
            {vehicle.pricing.taxPercent != null && (
              <Badge variant="outline" className="text-xs">GST {vehicle.pricing.taxPercent}%</Badge>
            )}
          </div>
          <p className="mt-2 font-bold text-electric-500">{formatCurrency(vehicle.pricing.daily)}/day</p>
          {isSold && vehicle.saleInfo?.salePrice && (
            <p className="text-xs text-muted-foreground">Sold for {formatCurrency(vehicle.saleInfo.salePrice)}</p>
          )}

          {!isSold && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/admin/fleet/${vehicle._id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setShowSell((v) => !v)}>
                <Banknote className="mr-1 h-3.5 w-3.5" /> Sell
              </Button>
              {!confirmDelete ? (
                <Button variant="outline" size="sm" className="text-red-400" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm'}
                </Button>
              )}
            </div>
          )}

          {showSell && !isSold && (
            <div className="mt-3 space-y-2 rounded-lg border border-border/50 bg-muted/10 p-3">
              <div className="space-y-1">
                <Label className="text-xs">Sale Price (₹) *</Label>
                <Input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="85000" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Buyer Name</Label>
                <Input value={soldTo} onChange={(e) => setSoldTo(e.target.value)} placeholder="Optional" />
              </div>
              <Button
                size="sm"
                className="w-full"
                disabled={!salePrice || sellMutation.isPending}
                onClick={() => sellMutation.mutate()}
              >
                {sellMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Mark as Sold
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
