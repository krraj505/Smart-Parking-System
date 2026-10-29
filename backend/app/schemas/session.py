from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.parking import ParkingSlotResponse, ParkingLotResponse
from app.schemas.reservation import ReservationResponse

class SessionCheckInRequest(BaseModel):
    booking_reference: Optional[str] = None
    vehicle_registration: Optional[str] = None
    lot_id: Optional[int] = None
    notes: Optional[str] = None

class SessionCheckOutRequest(BaseModel):
    session_id: Optional[int] = None
    booking_reference: Optional[str] = None
    vehicle_registration: Optional[str] = None
    payment_method: Optional[str] = "simulated_upi"

class SessionResponse(BaseModel):
    id: int
    reservation_id: Optional[int] = None
    lot_id: int
    slot_id: int
    vehicle_registration: str
    entry_time: datetime
    exit_time: Optional[datetime] = None
    status: str
    duration_minutes: Optional[int] = None
    calculated_charge: float
    created_at: datetime
    updated_at: datetime
    
    lot: Optional[ParkingLotResponse] = None
    slot: Optional[ParkingSlotResponse] = None
    reservation: Optional[ReservationResponse] = None

    class Config:
        from_attributes = True
