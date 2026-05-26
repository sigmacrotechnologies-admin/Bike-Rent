import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  kyc?: { status: string; aadharNumber?: string; licenseNumber?: string; profilePhotoUrl?: string };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
      setUser: (user) => set({ user }),
    }),
    { name: 'velocity-auth' }
  )
);

interface BookingState {
  selectedVehicle: string | null;
  startDate: string | null;
  endDate: string | null;
  couponCode: string | null;
  setBookingDetails: (details: Partial<BookingState>) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedVehicle: null,
  startDate: null,
  endDate: null,
  couponCode: null,
  setBookingDetails: (details) => set((state) => ({ ...state, ...details })),
  clearBooking: () =>
    set({ selectedVehicle: null, startDate: null, endDate: null, couponCode: null }),
}));

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'velocity-ui' }
  )
);

interface NotificationState {
  notifications: Array<{ _id: string; title: string; message: string; isRead: boolean; createdAt: string }>;
  unreadCount: number;
  setNotifications: (notifications: NotificationState['notifications'], unreadCount: number) => void;
  addNotification: (notification: NotificationState['notifications'][0]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications, unreadCount) => set({ notifications, unreadCount }),
  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),
}));

interface LocationState {
  city: string;
  hub: string;
  setCity: (city: string) => void;
  setHub: (hub: string) => void;
  setLocation: (city: string, hub: string) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      city: '',
      hub: '',
      setCity: (city) => set({ city, hub: '' }),
      setHub: (hub) => set({ hub }),
      setLocation: (city, hub) => set({ city, hub }),
    }),
    { name: 'velocity-location' }
  )
);
