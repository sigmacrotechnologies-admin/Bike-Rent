export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const VEHICLE_TYPES = {
  bike: { label: 'Bikes', icon: '🏍️' },
  car: { label: 'Cars', icon: '🚗' },
  ev: { label: 'EVs', icon: '⚡' },
  scooter: { label: 'Scooters', icon: '🛵' },
} as const;

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  active: 'bg-neon-400/20 text-neon-400',
  completed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  extended: 'bg-purple-500/20 text-purple-400',
};

export const ADMIN_ROLES = ['super_admin', 'admin', 'staff'];
