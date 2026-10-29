from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class KPIMetrics(BaseModel):
    total_slots: int
    available_slots: int
    occupied_slots: int
    reserved_slots: int
    maintenance_slots: int
    disabled_slots: int
    operational_slots: int
    occupancy_rate: float
    today_reservations: int
    today_revenue: float
    average_parking_duration_minutes: float

class HourlyOccupancyPoint(BaseModel):
    hour: str  # "00:00", "01:00", ...
    occupancy_rate: float
    occupied_count: int

class DailyReservationPoint(BaseModel):
    date: str  # "2026-10-25"
    reservations_count: int
    revenue: float

class FacilityUtilization(BaseModel):
    lot_id: int
    lot_name: str
    total_slots: int
    occupied_slots: int
    occupancy_rate: float
    revenue: float

class VehicleCategoryDistribution(BaseModel):
    category: str
    count: int
    percentage: float

class PeakHourPoint(BaseModel):
    hour: str
    entries: int
    exits: int
    traffic_score: int

class RecentActivityItem(BaseModel):
    id: str
    timestamp: str
    action_type: str  # reservation_created, check_in, check_out, reservation_cancelled, payment_received
    title: str
    description: str
    badge_color: str  # green, blue, amber, purple, red
    lot_name: Optional[str] = None
    vehicle_registration: Optional[str] = None

class DashboardAnalyticsResponse(BaseModel):
    kpi: KPIMetrics
    hourly_occupancy: List[HourlyOccupancyPoint]
    daily_reservations: List[DailyReservationPoint]
    facility_utilization: List[FacilityUtilization]
    category_distribution: List[VehicleCategoryDistribution]
    peak_hours: List[PeakHourPoint]
    recent_activities: List[RecentActivityItem]
