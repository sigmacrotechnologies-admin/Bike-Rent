/** Format a Date for `<input type="datetime-local" />` in local timezone */
export function toDatetimeLocalValue(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function defaultPickupDatetimeLocal(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toDatetimeLocalValue(d);
}

export function defaultReturnDatetimeLocal(startLocal?: string): string {
  const base = startLocal ? new Date(startLocal) : new Date();
  if (Number.isNaN(base.getTime())) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toDatetimeLocalValue(d);
  }
  base.setDate(base.getDate() + 1);
  return toDatetimeLocalValue(base);
}

export function validateDateRange(startLocal: string, endLocal: string): string | null {
  if (!startLocal || !endLocal) return 'Please select pickup and return dates';
  const start = new Date(startLocal);
  const end = new Date(endLocal);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Invalid date selected';
  if (end <= start) return 'Return date must be after pickup date';
  if (start < new Date()) return 'Pickup date cannot be in the past';
  return null;
}

export function buildSearchParams(base: {
  city?: string;
  hub?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}): string {
  const params = new URLSearchParams();
  if (base.city) params.set('city', base.city);
  if (base.hub) params.set('hub', base.hub);
  if (base.type) params.set('type', base.type);
  if (base.startDate) params.set('startDate', new Date(base.startDate).toISOString());
  if (base.endDate) params.set('endDate', new Date(base.endDate).toISOString());
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
