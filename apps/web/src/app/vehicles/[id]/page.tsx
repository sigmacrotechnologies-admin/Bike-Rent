'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Fuel, Calendar, Shield, Star, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleImage } from '@/components/vehicles/VehicleImage';
import { vehicleService } from '@/services';
import { useBookingStore, useAuthStore } from '@/store';
import { formatCurrency } from '@/utils/cn';
import { toDatetimeLocalValue } from '@/utils/dates';
import { VEHICLE_TYPES } from '@/utils/constants';

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const setBookingDetails = useBookingStore((s) => s.setBookingDetails);
  const storedStart = useBookingStore((s) => s.startDate);
  const storedEnd = useBookingStore((s) => s.endDate);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (storedStart) setStartDate(toDatetimeLocalValue(storedStart));
    if (storedEnd) setEndDate(toDatetimeLocalValue(storedEnd));
  }, [storedStart, storedEnd]);

  const { data, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleService.getById(id).then((r) => r.data.data),
  });

  const vehicle = data;
  const isAvailable = vehicle?.isAvailableForBooking !== false;

  useEffect(() => {
    if (!startDate || !endDate || !id) {
      setDateError('');
      return;
    }
    vehicleService
      .checkAvailability(id, new Date(startDate).toISOString(), new Date(endDate).toISOString())
      .then((r) => {
        const { available, reason } = r.data.data;
        setDateError(available ? '' : reason || 'Not available for selected dates');
      })
      .catch(() => setDateError('Could not verify availability'));
  }, [id, startDate, endDate]);

  const handleBook = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!startDate || !endDate || dateError || !isAvailable) return;
    setBookingDetails({ selectedVehicle: id, startDate, endDate });
    router.push('/booking/checkout');
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center pt-16">Loading...</div>;
  }

  if (!vehicle) {
    return <div className="flex min-h-screen items-center justify-center pt-16">Vehicle not found</div>;
  }

  const typeInfo = VEHICLE_TYPES[vehicle.type as keyof typeof VEHICLE_TYPES];

  return (
    <main className="min-h-screen pt-16">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border/40 shadow-xl">
              <VehicleImage vehicle={vehicle} className="absolute inset-0 rounded-2xl" priority imgClassName="object-cover" />
              {!isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <Badge className="bg-amber-500/90 text-black text-sm px-4 py-2">Currently Unavailable</Badge>
                </div>
              )}
            </div>
            {vehicle.features?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {vehicle.features.map((f: string) => (
                  <Badge key={f} variant="outline">{f}</Badge>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Badge className="mb-2">{typeInfo?.label}</Badge>
            <h1 className="font-display text-3xl font-bold">{vehicle.name}</h1>
            <p className="text-muted-foreground">{vehicle.specs?.brand} {vehicle.specs?.model} · {vehicle.specs?.year}</p>

            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              {vehicle.location?.city && (
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{vehicle.location.hub}, {vehicle.location.city}</span>
              )}
              {vehicle.specs?.fuelType && (
                <span className="flex items-center gap-1"><Fuel className="h-4 w-4" />{vehicle.specs.fuelType}</span>
              )}
              {vehicle.rating > 0 && (
                <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{vehicle.rating} ({vehicle.reviewCount})</span>
              )}
            </div>

            {!isAvailable && (
              <Card className="mt-6 border-amber-500/30 bg-amber-500/5">
                <CardContent className="flex items-start gap-3 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-600">This vehicle is currently booked</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      It will become available again after the current rental is returned. Please check back later or browse other vehicles.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card><CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Hourly</p>
                <p className="font-bold text-electric-500">{formatCurrency(vehicle.pricing.hourly)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Daily</p>
                <p className="font-bold text-electric-500">{formatCurrency(vehicle.pricing.daily)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Deposit</p>
                <p className="font-bold">{formatCurrency(vehicle.pricing.securityDeposit || 0)}</p>
              </CardContent></Card>
            </div>

            {vehicle.description && (
              <p className="mt-6 text-sm text-muted-foreground">{vehicle.description}</p>
            )}

            <Card className="mt-8 border-electric-500/20">
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-electric-500" /> Book This Vehicle
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={!isAvailable}
                      className="[color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={!isAvailable}
                      min={startDate || undefined}
                      className="[color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
                {dateError && (
                  <p className="mt-3 text-sm text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {dateError}
                  </p>
                )}
                <Button
                  className="mt-4 w-full"
                  size="lg"
                  onClick={handleBook}
                  disabled={!isAvailable || !startDate || !endDate || !!dateError}
                >
                  {isAvailable ? 'Proceed to Checkout' : 'Currently Unavailable'}
                </Button>
                <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" /> Secure booking with instant confirmation
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
