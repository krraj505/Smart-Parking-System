from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.parking import ParkingSlotResponse, ParkingLotResponse
from app.schemas.vehicle import VehicleResponse

class ReservationCreate(BaseModel):
    lot_id: int
    slot_id: Optional[int] = None  # If omitted, intelligent allocation engine assigns best slot
    vehicle_id: int
    start_time: datetime
    end_time: datetime
    payment_method: Optional[str] = "simulated_upi"  # simulated_upi, simulated_card, simulated_netbanking

class ReservationPreviewRequest(BaseModel):
    lot_id: int
    vehicle_id: int
    start_time: datetime
    end_time: datetime

class ReservationPreviewResponse(BaseModel):
    lot_id: int
    lot_name: str
    recommended_slot: Optional[ParkingSlotResponse] = None
    compatible_slots_count: int
    duration_hours: float
    base_rate: float
    estimated_amount: float
    peak_surcharge: float = 0.0
    cancellation_policy: str
    is_available: bool
    message: str

class ReservationCancelRequest(BaseModel):
    cancellation_reason: Optional[str] = "Customer requested cancellation"

class ReservationResponse(BaseModel):
    id: int
    booking_reference: str
    user_id: int
    lot_id: int
    slot_id: int
    vehicle_id: int
    start_time: datetime
    end_time: datetime
    status: str
    estimated_amount: float
    final_amount: Optional[float] = None
    cancellation_reason: Optional[str] = None
    cancellation_fee: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    
    lot: Optional[ParkingLotResponse] = None
    slot: Optional[ParkingSlotResponse] = None
    vehicle: Optional[VehicleResponse] = None

    class Config:
        from_attributes = True
