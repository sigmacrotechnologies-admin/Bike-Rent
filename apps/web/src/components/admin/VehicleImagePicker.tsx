'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Upload, Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { assetService } from '@/services';
import { cn } from '@/utils/cn';

type VehicleImage = {
  path: string;
  name: string;
  folder: string;
};

type VehicleImagePickerProps = {
  value?: string;
  onChange: (path: string) => void;
  vehicleType: string;
};

const FOLDER_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'bikes', label: 'Bikes' },
  { key: 'cars', label: 'Cars' },
  { key: 'ev', label: 'EVs' },
  { key: 'scooters', label: 'Scooters' },
  { key: 'defaults', label: 'Defaults' },
];

export function VehicleImagePicker({ value, onChange, vehicleType }: VehicleImagePickerProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [filter, setFilter] = useState('all');
  const [uploadError, setUploadError] = useState('');

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['vehicle-assets'],
    queryFn: () => assetService.listVehicleImages().then((r) => r.data.data as VehicleImage[]),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => assetService.uploadVehicleImage(file, vehicleType),
    onSuccess: (res) => {
      const uploaded = res.data.data.path as string;
      onChange(uploaded);
      setUploadError('');
      queryClient.invalidateQueries({ queryKey: ['vehicle-assets'] });
      setShowGallery(true);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setUploadError(axiosErr.response?.data?.message || 'Upload failed');
    },
  });

  const suggestedFolder = vehicleType === 'bike' ? 'bikes' : vehicleType === 'car' ? 'cars' : vehicleType;

  const filtered = images.filter((img) => {
    if (filter === 'all') return true;
    return img.folder === filter || img.path.includes(`/${filter}/`);
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/20 sm:w-64">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Selected vehicle" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="mb-2 h-10 w-10 opacity-40" />
              <span className="text-sm">No image selected</span>
            </div>
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div>
            <Label>Vehicle Image</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose from assets or upload a new image (saved to{' '}
              <code className="text-xs">assets/vehicles/{suggestedFolder}/</code>)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setShowGallery((v) => !v)}>
              <ImageIcon className="mr-2 h-4 w-4" />
              {showGallery ? 'Hide Gallery' : 'Browse Images'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload New
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {value && (
            <p className="truncate text-xs text-muted-foreground">
              Selected: <code>{value}</code>
            </p>
          )}
          {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
        </div>
      </div>

      {showGallery && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {FOLDER_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                  filter === f.key
                    ? 'bg-electric-500 text-white'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-video animate-pulse rounded-lg bg-muted/20" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No images found in this folder.</p>
          ) : (
            <div className="grid max-h-[420px] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((img) => (
                <button
                  key={img.path}
                  type="button"
                  onClick={() => onChange(img.path)}
                  className={cn(
                    'group relative overflow-hidden rounded-lg border-2 transition-all',
                    value === img.path
                      ? 'border-electric-500 ring-2 ring-electric-500/30'
                      : 'border-transparent hover:border-electric-500/50'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.path}
                    alt={img.name}
                    className="aspect-video w-full object-cover"
                  />
                  {value === img.path && (
                    <div className="absolute inset-0 flex items-center justify-center bg-electric-500/20">
                      <div className="rounded-full bg-electric-500 p-1 text-white">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {img.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
