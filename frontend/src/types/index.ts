export type UserRole = 'customer' | 'operator' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Vehicle {
  id: number;
  user_id: number;
  registration_number: string;
  vehicle_type: 'car' | 'motorcycle' | 'suv' | 'van' | 'ev';
  make: string;
  model: string;
  color: string;
  dimensions?: string;
  is_ev: boolean;
  preferences?: string;
  created_at: string;
}

export interface ParkingLot {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  area: string;
  open_time: string;
  close_time: string;
  is_24_7: boolean;
  total_capacity: number;
  base_hourly_rate: number;
  contact_phone?: string;
  facilities?: string;
  is_active: boolean;
  available_slots: number;
  occupied_slots: number;
  reserved_slots: number;
  maintenance_slots: number;
  disabled_slots: number;
  created_at: string;
  updated_at: string;
  // search enrichment fields
  estimated_total_price?: number;
  duration_hours?: number;
  compatible_slots_count?: number;
}

export type SlotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'disabled';
export type SlotCategory = 'standard' | 'compact' | 'suv' | 'motorcycle' | 'accessible' | 'ev';

export interface ParkingSlot {
  id: number;
  lot_id: number;
  slot_number: string;
  floor_level: string;
  slot_category: SlotCategory;
  status: SlotStatus;
  has_ev_charger: boolean;
  is_accessible: boolean;
  max_vehicle_length?: number;
  max_vehicle_height?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: number;
  lot_id: number;
  name: string;
  vehicle_type: string;
  base_hourly_rate: number;
  minimum_charge: number;
  billing_increment_minutes: number;
  daily_max_rate: number;
  peak_multiplier: number;
  peak_start_time?: string;
  peak_end_time?: string;
  cancellation_fee_percent: number;
  created_at: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';

export interface Reservation {
  id: number;
  booking_reference: string;
  user_id: number;
  lot_id: number;
  slot_id: number;
  vehicle_id: number;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  estimated_amount: number;
  final_amount?: number;
  cancellation_reason?: string;
  cancellation_fee?: number;
  created_at: string;
  updated_at: string;
  lot?: ParkingLot;
  slot?: ParkingSlot;
  vehicle?: Vehicle;
}

export interface ParkingSession {
  id: number;
  reservation_id?: number;
  lot_id: number;
  slot_id: number;
  vehicle_registration: string;
  entry_time: string;
  exit_time?: string;
  status: 'active' | 'completed';
  duration_minutes?: number;
  calculated_charge: number;
  created_at: string;
  updated_at: string;
  lot?: ParkingLot;
  slot?: ParkingSlot;
  reservation?: Reservation;
}

export interface Payment {
  id: number;
  transaction_reference: string;
  reservation_id?: number;
  session_id?: number;
  user_id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'successful' | 'failed' | 'refunded';
  payment_method: string;
  payment_gateway: string;
  paid_at: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: 'reservation' | 'check_in' | 'check_out' | 'payment' | 'system';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface DashboardAnalytics {
  kpi: {
    total_slots: number;
    available_slots: number;
    occupied_slots: number;
    reserved_slots: number;
    maintenance_slots: number;
    disabled_slots: number;
    operational_slots: number;
    occupancy_rate: number;
    today_reservations: number;
    today_revenue: number;
    average_parking_duration_minutes: number;
  };
  hourly_occupancy: Array<{
    hour: string;
    occupancy_rate: number;
    occupied_count: number;
  }>;
  daily_reservations: Array<{
    date: string;
    reservations_count: number;
    revenue: number;
  }>;
  facility_utilization: Array<{
    lot_id: number;
    lot_name: string;
    total_slots: number;
    occupied_slots: number;
    occupancy_rate: number;
    revenue: number;
  }>;
  category_distribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  peak_hours: Array<{
    hour: string;
    entries: number;
    exits: number;
    traffic_score: number;
  }>;
  recent_activities: Array<{
    id: string;
    timestamp: string;
    action_type: string;
    title: string;
    description: string;
    badge_color: 'green' | 'blue' | 'amber' | 'purple' | 'red';
  }>;
}
