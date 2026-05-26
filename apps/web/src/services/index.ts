import api from './api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const authService = {
  register: (data: Record<string, string>) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
};

const cleanParams = (params?: Record<string, string | number>) =>
  params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
    : undefined;

export const vehicleService = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get('/vehicles', { params: cleanParams(params) }),
  listAdmin: (params?: Record<string, string | number>) =>
    api.get('/vehicles', { params: cleanParams({ ...params, admin: true }) }),
  getById: (id: string) => api.get(`/vehicles/${id}`),
  checkAvailability: (id: string, startDate: string, endDate: string) =>
    api.get(`/vehicles/${id}/availability`, { params: { startDate, endDate } }),
  create: (data: Record<string, unknown>) => api.post('/vehicles', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
  sell: (id: string, data: { salePrice: number; soldTo?: string; notes?: string }) =>
    api.post(`/vehicles/${id}/sell`, data),
};

export const bookingService = {
  create: (data: Record<string, unknown>) => api.post('/bookings', data),
  list: (params?: Record<string, string>) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  cancel: (id: string, reason: string) => api.post(`/bookings/${id}/cancel`, { reason }),
  extend: (id: string, newEndDate: string) => api.post(`/bookings/${id}/extend`, { newEndDate }),
  getExtensionQuote: (id: string, newEndDate: string) =>
    api.get(`/bookings/${id}/extension-quote`, { params: { newEndDate } }),
  updateStatus: (id: string, status: string) => api.patch(`/bookings/${id}/status`, { status }),
  submitOnboarding: (id: string, data: Record<string, unknown>) => api.post(`/bookings/${id}/onboarding`, data),
  getReturnChecklist: (id: string) => api.get(`/bookings/${id}/return-checklist`),
  processReturn: (id: string, data: Record<string, unknown>) => api.post(`/bookings/${id}/return`, data),
  getInvoiceData: (id: string) => api.get(`/bookings/${id}/invoice-data`),
  getSummaryPdf: (id: string) => api.get(`/bookings/${id}/summary-pdf`),
  getInvoicePdf: (id: string) => api.get(`/bookings/${id}/invoice-pdf`),
};

export const paymentService = {
  initiate: (data: { bookingId: string; provider: 'razorpay' | 'stripe' | 'wallet' }) =>
    api.post('/payments/initiate', data),
  payWithWallet: (bookingId: string) => api.post('/payments/wallet', { bookingId }),
  verifyRazorpay: (data: Record<string, string>) => api.post('/payments/verify/razorpay', data),
  verifyStripe: (sessionId: string) => api.post('/payments/verify/stripe', { sessionId }),
};

export const walletService = {
  getBalance: () => api.get('/wallet'),
  listTransactions: (params?: Record<string, string>) => api.get('/wallet/transactions', { params }),
  topUp: (amount: number) => api.post('/wallet/topup', { amount }),
  listAll: (params?: Record<string, string>) => api.get('/wallet/admin/all', { params }),
  adminAdjust: (userId: string, data: { amount: number; description?: string }) =>
    api.post(`/wallet/admin/${userId}/adjust`, data),
};

export const analyticsService = {
  dashboard: () => api.get('/analytics/dashboard'),
  reports: (params?: Record<string, string>) => api.get('/analytics/reports', { params }),
};

export const supportService = {
  create: (data: Record<string, string>) => api.post('/support', data),
  list: (params?: Record<string, string>) => api.get('/support', { params }),
  addMessage: (id: string, message: string) => api.post(`/support/${id}/messages`, { message }),
};

export const notificationService = {
  list: (params?: Record<string, string>) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/profile', data),
  submitKYC: (data: Record<string, unknown>) => api.post('/users/kyc/submit', data),
  listCustomers: (params?: Record<string, string>) => api.get('/users/customers', { params }),
  verifyKYC: (id: string, data: Record<string, string>) => api.patch(`/users/${id}/kyc`, data),
};

export const gpsService = {
  fleet: () => api.get('/gps/fleet'),
  live: (vehicleId: string) => api.get(`/gps/${vehicleId}/live`),
  history: (vehicleId: string, params?: Record<string, string>) =>
    api.get(`/gps/${vehicleId}/history`, { params }),
};

export const couponService = {
  list: () => api.get('/coupons'),
  validate: (code: string, orderAmount: number, vehicleType: string) =>
    api.post('/coupons/validate', { code, orderAmount, vehicleType }),
  create: (data: Record<string, unknown>) => api.post('/coupons', data),
};

export const maintenanceService = {
  list: (params?: Record<string, string>) => api.get('/maintenance', { params }),
  create: (data: Record<string, unknown>) => api.post('/maintenance', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/maintenance/${id}`, data),
};

export const assetService = {
  listVehicleImages: () => api.get('/assets/vehicles'),
  uploadVehicleImage: (file: File, type: string) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    return api.post('/assets/vehicles/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadUserPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/assets/users/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export interface ServiceHub {
  _id: string;
  name: string;
  address?: string;
  isActive?: boolean;
}

export interface ServiceArea {
  _id: string;
  name: string;
  slug: string;
  state: string;
  isActive: boolean;
  hubs: ServiceHub[];
}

export const locationService = {
  list: () => api.get('/locations'),
  listAdmin: () => api.get('/locations', { params: { admin: true } }),
  createCity: (data: { name: string; state?: string }) => api.post('/locations/cities', data),
  updateCity: (cityId: string, data: Record<string, unknown>) => api.put(`/locations/cities/${cityId}`, data),
  deleteCity: (cityId: string) => api.delete(`/locations/cities/${cityId}`),
  addHub: (cityId: string, data: { name: string; address?: string }) =>
    api.post(`/locations/cities/${cityId}/hubs`, data),
  updateHub: (cityId: string, hubId: string, data: Record<string, unknown>) =>
    api.put(`/locations/cities/${cityId}/hubs/${hubId}`, data),
  deleteHub: (cityId: string, hubId: string) =>
    api.delete(`/locations/cities/${cityId}/hubs/${hubId}`),
};
