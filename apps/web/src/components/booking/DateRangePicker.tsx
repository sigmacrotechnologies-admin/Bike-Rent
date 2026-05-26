'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/cn';

type DateRangePickerProps = {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  showLabels?: boolean;
  className?: string;
  error?: string;
  disabled?: boolean;
};

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  showLabels = true,
  className,
  error,
  disabled,
}: DateRangePickerProps) {
  const minStart = new Date().toISOString().slice(0, 16);
  const minEnd = startDate || minStart;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          {showLabels && (
            <Label className="text-xs font-medium text-muted-foreground">Pickup Date & Time</Label>
          )}
          <Input
            type="datetime-local"
            value={startDate}
            min={minStart}
            disabled={disabled}
            onChange={(e) => onStartChange(e.target.value)}
            className="h-10 rounded-xl bg-background/80 [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
        <div className="space-y-1">
          {showLabels && (
            <Label className="text-xs font-medium text-muted-foreground">Return Date & Time</Label>
          )}
          <Input
            type="datetime-local"
            value={endDate}
            min={minEnd}
            disabled={disabled}
            onChange={(e) => onEndChange(e.target.value)}
            className="h-10 rounded-xl bg-background/80 [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>
      {error && <p className="text-xs text-amber-500">{error}</p>}
    </div>
  );
}
