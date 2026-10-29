import type {
  User,
  Vehicle,
  ParkingLot,
  ParkingSlot,
  Reservation,
  ParkingSession,
  Payment,
  NotificationItem,
  AuditLogItem,
  DashboardAnalytics,
  PricingRule,
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('smart_parking_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = `Request failed with status ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    return request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(data: { email: string; password: string; full_name: string; phone?: string; role?: string }) {
    return request<{ access_token: string; token_type: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe() {
    return request<User>('/auth/me');
  },

  async updateProfile(data: { full_name?: string; phone?: string; password?: string }) {
    return request<User>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Parking Facilities (Map-Free)
  async getParkingLots(params?: { query?: string; area?: string; max_price?: number; has_ev?: boolean }) {
    const query = new URLSearchParams();
    if (params?.query) query.append('query', params.query);
    if (params?.area && params.area !== 'all') query.append('area', params.area);
    if (params?.max_price) query.append('max_price', params.max_price.toString());
    if (params?.has_ev) query.append('has_ev', 'true');
    const qs = query.toString();
    return request<ParkingLot[]>(`/parking-lots${qs ? `?${qs}` : ''}`);
  },

  async getParkingLot(lotId: number) {
    return request<ParkingLot & { slots: ParkingSlot[]; pricing_rules: PricingRule[] }>(`/parking-lots/${lotId}`);
  },

  async getLotSlots(lotId: number, filters?: { floor?: string; category?: string; slot_status?: string; has_ev?: boolean; is_accessible?: boolean; search?: string }) {
    const query = new URLSearchParams();
    if (filters?.floor && filters.floor !== 'all') query.append('floor', filters.floor);
    if (filters?.category && filters.category !== 'all') query.append('category', filters.category);
    if (filters?.slot_status && filters.slot_status !== 'all') query.append('slot_status', filters.slot_status);
    if (filters?.has_ev) query.append('has_ev', 'true');
    if (filters?.is_accessible) query.append('is_accessible', 'true');
    if (filters?.search) query.append('search', filters.search);
    const qs = query.toString();
    return request<ParkingSlot[]>(`/parking-lots/${lotId}/slots${qs ? `?${qs}` : ''}`);
  },

  async searchParking(filters: {
    query?: string;
    area?: string;
    vehicle_type?: string;
    arrival_time?: string;
    departure_time?: string;
    max_hourly_budget?: number;
    requires_ev?: boolean;
    requires_accessible?: boolean;
    sort_by?: string;
  }) {
    const query = new URLSearchParams();
    if (filters.query) query.append('query', filters.query);
    if (filters.area && filters.area !== 'all') query.append('area', filters.area);
    if (filters.vehicle_type) query.append('vehicle_type', filters.vehicle_type);
    if (filters.arrival_time) query.append('arrival_time', filters.arrival_time);
    if (filters.departure_time) query.append('departure_time', filters.departure_time);
    if (filters.max_hourly_budget) query.append('max_hourly_budget', filters.max_hourly_budget.toString());
    if (filters.requires_ev) query.append('requires_ev', 'true');
    if (filters.requires_accessible) query.append('requires_accessible', 'true');
    if (filters.sort_by) query.append('sort_by', filters.sort_by);
    return request<ParkingLot[]>(`/parking/search?${query.toString()}`);
  },

  // Slots Management
  async updateSlotStatus(slotId: number, data: { status?: string; slot_category?: string; is_active?: boolean }) {
    return request<ParkingSlot>(`/slots/${slotId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Reservations
  async previewReservation(data: { lot_id: number; vehicle_id: number; start_time: string; end_time: string }) {
    return request<{
      lot_id: number;
      lot_name: string;
      recommended_slot?: ParkingSlot;
      compatible_slots_count: number;
      duration_hours: number;
      base_rate: number;
      estimated_amount: number;
      peak_surcharge: number;
      cancellation_policy: string;
      is_available: boolean;
      message: string;
    }>('/reservations/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createReservation(data: {
    lot_id: number;
    slot_id?: number;
    vehicle_id: number;
    start_time: string;
    end_time: string;
    payment_method?: string;
  }) {
    return request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getReservations(statusFilter?: string) {
    const qs = statusFilter && statusFilter !== 'all' ? `?status_filter=${statusFilter}` : '';
    return request<Reservation[]>(`/reservations${qs}`);
  },

  async getReservation(id: number) {
    return request<Reservation>(`/reservations/${id}`);
  },

  async cancelReservation(id: number, cancellation_reason?: string) {
    return request<Reservation>(`/reservations/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancellation_reason }),
    });
  },

  // Vehicles
  async getVehicles() {
    return request<Vehicle[]>('/vehicles');
  },

  async createVehicle(data: {
    registration_number: string;
    vehicle_type: string;
    make: string;
    model: string;
    color: string;
    dimensions?: string;
    is_ev?: boolean;
    preferences?: string;
  }) {
    return request<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateVehicle(id: number, data: Partial<Vehicle>) {
    return request<Vehicle>(`/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteVehicle(id: number) {
    return request<void>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  },

  // Entry & Exit Sessions
  async checkInVehicle(data: { booking_reference?: string; vehicle_registration?: string; notes?: string }) {
    return request<ParkingSession>('/sessions/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async checkOutVehicle(data: { session_id?: number; booking_reference?: string; vehicle_registration?: string; payment_method?: string }) {
    return request<ParkingSession>('/sessions/check-out', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSessions(statusFilter?: string, lotId?: number) {
    const q = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') q.append('status_filter', statusFilter);
    if (lotId) q.append('lot_id', lotId.toString());
    const qs = q.toString();
    return request<ParkingSession[]>(`/sessions${qs ? `?${qs}` : ''}`);
  },

  async getActiveSessions(lotId?: number) {
    const qs = lotId ? `?lot_id=${lotId}` : '';
    return request<ParkingSession[]>(`/sessions/active${qs}`);
  },

  // Payments
  async getPayments() {
    return request<Payment[]>('/payments');
  },

  async simulatePayment(data: { reservation_id?: number; session_id?: number; amount: number; payment_method: string }) {
    return request<Payment>('/payments/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Analytics & Reports
  async getDashboardAnalytics(lotId?: number, days: number = 7) {
    const q = new URLSearchParams();
    if (lotId) q.append('lot_id', lotId.toString());
    q.append('days', days.toString());
    return request<DashboardAnalytics>(`/analytics/dashboard?${q.toString()}`);
  },

  getExportCsvUrl(reportType: 'reservations' | 'sessions' | 'revenue' | 'facilities') {
    return `/api/analytics/export-csv?report_type=${reportType}`;
  },

  // Notifications
  async getNotifications() {
    return request<NotificationItem[]>('/notifications');
  },

  async markNotificationRead(id: number) {
    return request<NotificationItem>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead() {
    return request<{ message: string }>('/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  // Admin Controls
  async adminCreateLot(data: Partial<ParkingLot>) {
    return request<ParkingLot>('/admin/parking-lots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async adminUpdateLot(id: number, data: Partial<ParkingLot>) {
    return request<ParkingLot>(`/admin/parking-lots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async adminGenerateSlots(lotId: number, count: number, floors: number) {
    return request<{ message: string }>(`/admin/parking-lots/${lotId}/generate-slots?count=${count}&floors=${floors}`, {
      method: 'POST',
    });
  },

  async adminGetUsers() {
    return request<User[]>('/admin/users');
  },

  async adminUpdateUserRole(userId: number, role: string) {
    return request<User>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async adminGetPricingRules(lotId?: number) {
    const qs = lotId ? `?lot_id=${lotId}` : '';
    return request<PricingRule[]>(`/admin/pricing-rules${qs}`);
  },

  async adminCreatePricingRule(data: Partial<PricingRule>) {
    return request<PricingRule>('/admin/pricing-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async adminGetAuditLogs(limit: number = 50) {
    return request<AuditLogItem[]>(`/admin/audit-logs?limit=${limit}`);
  },
};
